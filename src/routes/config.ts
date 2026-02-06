import { Hono } from 'hono';
import { execa } from 'execa';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const configRouter = new Hono();

const QWEN_OAUTH_BASE_URL = 'https://chat.qwen.ai';
const QWEN_OAUTH_DEVICE_CODE_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/device/code`;
const QWEN_OAUTH_TOKEN_ENDPOINT = `${QWEN_OAUTH_BASE_URL}/api/v1/oauth2/token`;
const QWEN_OAUTH_CLIENT_ID = 'f0304373b74a44d2b584a3fb70ca9e56';
const QWEN_OAUTH_SCOPE = 'openid profile email model.completion';
const QWEN_OAUTH_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code';
const QWEN_DEFAULT_BASE_URL = 'https://portal.qwen.ai/v1';
const QWEN_DEFAULT_MODEL = 'qwen-portal/coder-model';

type QwenDeviceSession = {
  sessionId: string;
  deviceCode: string;
  verifier: string;
  expiresAt: number;
  intervalMs: number;
};

const qwenDeviceSessions = new Map<string, QwenDeviceSession>();

type GptOAuthSession = {
  sessionId: string;
  process: any;
  status: 'pending' | 'success' | 'error';
  error?: string;
  startedAt: number;
};

const gptOAuthSessions = new Map<string, GptOAuthSession>();

function toFormUrlEncoded(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
}

function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  return { verifier, challenge };
}

function normalizeBaseUrl(value: string | undefined): string {
  const raw = value?.trim() || QWEN_DEFAULT_BASE_URL;
  const withProtocol = raw.startsWith('http') ? raw : `https://${raw}`;
  return withProtocol.endsWith('/v1') ? withProtocol : `${withProtocol.replace(/\/+$/, '')}/v1`;
}

async function requestQwenDeviceCode(params: { challenge: string }) {
  const response = await fetch(QWEN_OAUTH_DEVICE_CODE_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'x-request-id': randomUUID(),
    },
    body: toFormUrlEncoded({
      client_id: QWEN_OAUTH_CLIENT_ID,
      scope: QWEN_OAUTH_SCOPE,
      code_challenge: params.challenge,
      code_challenge_method: 'S256',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Qwen device authorization failed: ${text || response.statusText}`);
  }

  const payload = (await response.json()) as {
    device_code?: string;
    user_code?: string;
    verification_uri?: string;
    verification_uri_complete?: string;
    expires_in?: number;
    interval?: number;
    error?: string;
  };

  if (!payload.device_code || !payload.user_code || !payload.verification_uri) {
    throw new Error(
      payload.error ??
        'Qwen device authorization returned an incomplete payload (missing user_code or verification_uri).'
    );
  }

  return payload as {
    device_code: string;
    user_code: string;
    verification_uri: string;
    verification_uri_complete?: string;
    expires_in: number;
    interval?: number;
  };
}

async function pollQwenToken(params: { deviceCode: string; verifier: string }) {
  const response = await fetch(QWEN_OAUTH_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: toFormUrlEncoded({
      grant_type: QWEN_OAUTH_GRANT_TYPE,
      client_id: QWEN_OAUTH_CLIENT_ID,
      device_code: params.deviceCode,
      code_verifier: params.verifier,
    }),
  });

  if (!response.ok) {
    let payload: { error?: string; error_description?: string } | undefined;
    try {
      payload = (await response.json()) as { error?: string; error_description?: string };
    } catch {
      const text = await response.text();
      return { status: 'error', message: text || response.statusText } as const;
    }

    if (payload?.error === 'authorization_pending') {
      return { status: 'pending' } as const;
    }

    if (payload?.error === 'slow_down') {
      return { status: 'pending', slowDown: true } as const;
    }

    return {
      status: 'error',
      message: payload?.error_description || payload?.error || response.statusText,
    } as const;
  }

  const tokenPayload = (await response.json()) as {
    access_token?: string | null;
    refresh_token?: string | null;
    expires_in?: number | null;
    resource_url?: string;
  };

  if (!tokenPayload.access_token || !tokenPayload.refresh_token || !tokenPayload.expires_in) {
    return { status: 'error', message: 'Qwen OAuth returned incomplete token payload.' } as const;
  }

  return {
    status: 'success',
    token: {
      access: tokenPayload.access_token,
      refresh: tokenPayload.refresh_token,
      expires: Date.now() + tokenPayload.expires_in * 1000,
      resourceUrl: tokenPayload.resource_url,
    },
  } as const;
}

function resolveOAuthPath() {
  const home = process.env.HOME || process.cwd();
  const dir = process.env.OPENCLAW_OAUTH_DIR || path.join(home, '.openclaw', 'credentials');
  return path.join(dir, 'oauth.json');
}

function resolveRemoteSupportPath() {
  const home = process.env.HOME || process.cwd();
  return path.join(home, '.openclaw-helper', 'remote-support.json');
}

function extractJson(stdout: string) {
  const start = stdout.indexOf('{');
  const end = stdout.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  try {
    return JSON.parse(stdout.slice(start, end + 1));
  } catch {
    return null;
  }
}

function writeQwenOAuthToken(token: { access: string; refresh: string; expires: number; resourceUrl?: string }) {
  const oauthPath = resolveOAuthPath();
  const dir = path.dirname(oauthPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let data: Record<string, any> = {};
  try {
    data = JSON.parse(fs.readFileSync(oauthPath, 'utf-8'));
  } catch {
    data = {};
  }
  data['qwen-portal'] = {
    access: token.access,
    refresh: token.refresh,
    expires: token.expires,
    ...(token.resourceUrl ? { resourceUrl: token.resourceUrl } : {}),
  };
  fs.writeFileSync(oauthPath, JSON.stringify(data, null, 2));
}

async function applyQwenConfig(resourceUrl?: string) {
  const baseUrl = normalizeBaseUrl(resourceUrl);
  await execa('openclaw', [
    'config',
    'set',
    '--json',
    'models.providers.qwen-portal',
    JSON.stringify({
      baseUrl,
      apiKey: 'qwen-oauth',
      api: 'openai-completions',
      models: [
        {
          id: 'coder-model',
          name: 'Qwen Coder',
          reasoning: false,
          input: ['text'],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 128000,
          maxTokens: 8192,
        },
        {
          id: 'vision-model',
          name: 'Qwen Vision',
          reasoning: false,
          input: ['text', 'image'],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 128000,
          maxTokens: 8192,
        },
      ],
    }),
  ]);

  await execa('openclaw', [
    'config',
    'set',
    '--json',
    'agents.defaults.models',
    JSON.stringify({
      'qwen-portal/coder-model': { alias: 'qwen' },
      'qwen-portal/vision-model': {},
    }),
  ]);

  await execa('openclaw', [
    'config',
    'set',
    '--json',
    'agents.defaults.model',
    JSON.stringify({ primary: QWEN_DEFAULT_MODEL }),
  ]);
}

async function getOpenClawPlugins() {
  const { stdout } = await execa('openclaw', ['plugins', 'list', '--json']);
  const jsonStart = stdout.indexOf('{');
  const jsonEnd = stdout.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    throw new Error('无法解析 OpenClaw 插件列表');
  }
  const data = JSON.parse(stdout.slice(jsonStart, jsonEnd + 1));
  return Array.isArray(data.plugins) ? data.plugins : [];
}

function resolveOpenAIPluginId(plugins: any[]) {
  const direct = plugins.find((p) => p.id === 'openai');
  if (direct) return 'openai';
  const byProvider = plugins.find(
    (p) => Array.isArray(p.providerIds) && p.providerIds.includes('openai')
  );
  if (byProvider?.id) return byProvider.id;
  const byName = plugins.find(
    (p) =>
      typeof p.id === 'string' &&
      (p.id.includes('openai') || p.id.includes('open-ai'))
  );
  return byName?.id || null;
}

// 配置模型
configRouter.post('/model', async (c) => {
  try {
    const { provider, token } = await c.req.json();

    if (!provider) {
      return c.json({ success: false, error: '请选择模型提供商' }, 400);
    }

    let result;

    switch (provider) {
      case 'minimax':
        if (!token) {
          return c.json({ success: false, error: '请提供 MiniMax API Key' }, 400);
        }
        
        // 设置环境变量
        process.env.MINIMAX_API_KEY = token;
        
        // 配置 MiniMax 提供商
        await execa('openclaw', [
          'config',
          'set',
          '--json',
          'models.providers.minimax',
          JSON.stringify({
            baseUrl: 'https://api.minimax.io/anthropic',
            api: 'anthropic-messages',
            apiKey: '${MINIMAX_API_KEY}',
            models: [
              {
                id: 'MiniMax-M2.1',
                name: 'MiniMax M2.1',
                reasoning: false,
                input: ['text'],
                cost: {
                  input: 15,
                  output: 60,
                  cacheRead: 2,
                  cacheWrite: 10,
                },
                contextWindow: 200000,
                maxTokens: 8192,
              },
            ],
          }),
        ]);

        // 设置为默认模型
        await execa('openclaw', [
          'config',
          'set',
          '--json',
          'agents.defaults.model',
          JSON.stringify({ primary: 'minimax/MiniMax-M2.1' }),
        ]);

        // 写入配置文件
        const configFile = `${process.env.HOME}/.profile`;
        const configLine = `export MINIMAX_API_KEY="${token}"`;
        
        try {
          const { stdout } = await execa('grep', ['-q', 'MINIMAX_API_KEY', configFile]);
        } catch {
          // 如果没有找到,添加配置
          await execa('sh', [
            '-c',
            `echo '' >> ${configFile} && echo '# OpenClaw MiniMax API Key' >> ${configFile} && echo '${configLine}' >> ${configFile}`,
          ]);
        }

        result = { provider: 'minimax', model: 'MiniMax-M2.1' };
        break;

      case 'gpt':
        // 使用自动化 OAuth 流程
        result = {
          provider: 'gpt',
          requiresOAuth: true,
          oauthMode: 'auto',
        };
        break;

      case 'qwen':
        // 启用千问插件
        await execa('openclaw', ['plugins', 'enable', 'qwen-portal-auth']);
        // 使用设备码流程（无需 TTY）
        result = {
          provider: 'qwen',
          requiresOAuth: true,
          oauthMode: 'device',
        };
        break;

      default:
        return c.json({ success: false, error: '不支持的模型提供商' }, 400);
    }

    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('配置模型失败:', error);
    return c.json(
      {
        success: false,
        error: '配置失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// 千问 OAuth: 设备码流程
configRouter.post('/qwen-oauth/start', async (c) => {
  try {
    const { verifier, challenge } = generatePkce();
    const device = await requestQwenDeviceCode({ challenge });
    const sessionId = randomUUID();
    const expiresAt = Date.now() + device.expires_in * 1000;
    const intervalMs = (device.interval ?? 2) * 1000;
    qwenDeviceSessions.set(sessionId, {
      sessionId,
      deviceCode: device.device_code,
      verifier,
      expiresAt,
      intervalMs,
    });
    return c.json({
      success: true,
      data: {
        sessionId,
        verificationUrl: device.verification_uri_complete || device.verification_uri,
        userCode: device.user_code,
        expiresIn: device.expires_in,
        interval: device.interval ?? 2,
      },
    });
  } catch (error: any) {
    console.error('启动千问 OAuth 失败:', error);
    return c.json(
      {
        success: false,
        error: '启动千问 OAuth 失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// GPT OAuth: 启动授权流程
configRouter.post('/gpt-oauth/start', async (c) => {
  try {
    const plugins = await getOpenClawPlugins();
    const pluginId = resolveOpenAIPluginId(plugins);
    if (!pluginId) {
      return c.json(
        {
          success: false,
          error: '未检测到 OpenAI 插件，请先安装 OpenAI 插件',
        },
        400
      );
    }

    // 启用 OpenAI 插件
    await execa('openclaw', ['plugins', 'enable', pluginId]);

    const sessionId = randomUUID();
    
    // 启动 OAuth 登录子进程
    const { spawn } = await import('child_process');
    const childProcess = spawn('openclaw', ['models', 'auth', 'login', '--provider', 'openai', '--set-default'], {
      cwd: process.env.HOME,
      env: process.env,
    });

    let authUrl = '';
    let output = '';

    // 捕获输出以获取授权 URL
    childProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // 尝试提取授权 URL
      const urlMatch = text.match(/https?:\/\/[^\s]+/);
      if (urlMatch && !authUrl) {
        authUrl = urlMatch[0];
      }
    });

    childProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    const session: GptOAuthSession = {
      sessionId,
      process: childProcess,
      status: 'pending',
      startedAt: Date.now(),
    };

    gptOAuthSessions.set(sessionId, session);

    // 监听进程退出
    childProcess.on('close', (code) => {
      const currentSession = gptOAuthSessions.get(sessionId);
      if (currentSession) {
        if (code === 0) {
          currentSession.status = 'success';
        } else {
          currentSession.status = 'error';
          currentSession.error = `认证失败 (退出码: ${code})`;
        }
      }
    });

    // 等待一下，尝试获取授权 URL
    await new Promise(resolve => setTimeout(resolve, 2000));

    return c.json({
      success: true,
      data: {
        sessionId,
        authUrl: authUrl || 'https://platform.openai.com/authorize',
        message: '请在浏览器中完成授权',
      },
    });
  } catch (error: any) {
    console.error('启动 GPT OAuth 失败:', error);
    return c.json(
      {
        success: false,
        error: '启动 GPT OAuth 失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// GPT OAuth: 轮询状态
configRouter.post('/gpt-oauth/poll', async (c) => {
  try {
    const { sessionId } = await c.req.json();
    const session = gptOAuthSessions.get(sessionId);
    
    if (!session) {
      return c.json({ success: false, error: '无效的会话，请重新开始登录' }, 400);
    }

    // 检查超时（5分钟）
    if (Date.now() - session.startedAt > 5 * 60 * 1000) {
      gptOAuthSessions.delete(sessionId);
      try {
        session.process.kill();
      } catch {}
      return c.json({ success: false, error: '登录已超时，请重新开始' }, 400);
    }

    if (session.status === 'pending') {
      return c.json({ success: true, data: { status: 'pending' } });
    }

    if (session.status === 'error') {
      gptOAuthSessions.delete(sessionId);
      return c.json({ success: false, error: session.error || '认证失败' }, 500);
    }

    // 成功
    gptOAuthSessions.delete(sessionId);
    return c.json({ success: true, data: { status: 'success' } });
  } catch (error: any) {
    console.error('轮询 GPT OAuth 失败:', error);
    return c.json(
      {
        success: false,
        error: '轮询失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

configRouter.post('/qwen-oauth/poll', async (c) => {
  try {
    const { sessionId } = await c.req.json();
    const session = qwenDeviceSessions.get(sessionId);
    if (!session) {
      return c.json({ success: false, error: '无效的会话，请重新开始登录' }, 400);
    }
    if (Date.now() > session.expiresAt) {
      qwenDeviceSessions.delete(sessionId);
      return c.json({ success: false, error: '登录已过期，请重新开始' }, 400);
    }

    const result = await pollQwenToken({
      deviceCode: session.deviceCode,
      verifier: session.verifier,
    });

    if (result.status === 'pending') {
      return c.json({ success: true, data: { status: 'pending' } });
    }

    if (result.status === 'error') {
      return c.json({ success: false, error: result.message }, 500);
    }

    writeQwenOAuthToken(result.token);
    await applyQwenConfig(result.token.resourceUrl);
    qwenDeviceSessions.delete(sessionId);

    return c.json({ success: true, data: { status: 'success' } });
  } catch (error: any) {
    console.error('轮询千问 OAuth 失败:', error);
    return c.json(
      {
        success: false,
        error: '轮询千问 OAuth 失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// 配置 Telegram
configRouter.post('/telegram', async (c) => {
  try {
    const { token, userId, skip } = await c.req.json();

    if (skip) {
      return c.json({ success: true, skipped: true });
    }

    if (!token || !userId) {
      return c.json({ success: false, error: '请提供 Telegram Bot Token 和用户 ID' }, 400);
    }

    // 配置 Telegram (新路径 channels.telegram)
    await execa('openclaw', ['config', 'set', 'channels.telegram.botToken', token]);
    await execa('openclaw', [
      'config',
      'set',
      '--json',
      'channels.telegram.allowFrom',
      JSON.stringify([userId]),
    ]);

    // 重启 gateway
    try {
      await execa('pkill', ['-f', 'openclaw.*gateway']);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch {
      // 进程可能不存在,忽略错误
    }

    // 启动 gateway
    const logFile = `${process.env.HOME}/.openclaw/logs/gateway.log`;
    execa('sh', [
      '-c',
      `nohup openclaw gateway run --bind loopback --port 18789 > ${logFile} 2>&1 &`,
    ]);

    await new Promise((resolve) => setTimeout(resolve, 3000));

    return c.json({
      success: true,
      data: {
        token: token.substring(0, 10) + '...',
        userId,
      },
    });
  } catch (error: any) {
    console.error('配置 Telegram 失败:', error);
    return c.json(
      {
        success: false,
        error: '配置失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// 获取当前配置
configRouter.get('/status', async (c) => {
  try {
    const config: any = {};

    // 获取默认模型
    try {
      const { stdout } = await execa('openclaw', ['config', 'get', 'agents.defaults.model.primary']);
      config.defaultModel = stdout.trim();
    } catch {
      config.defaultModel = null;
    }

    // 获取 Telegram 配置
    try {
      const { stdout } = await execa('openclaw', ['config', 'get', 'channels.telegram.botToken']);
      config.telegramConfigured = !!stdout.trim();
    } catch {
      config.telegramConfigured = false;
    }

    // 检查 Gateway 状态
    try {
      await execa('pgrep', ['-f', 'openclaw.*gateway']);
      config.gatewayRunning = true;
    } catch {
      config.gatewayRunning = false;
    }

    return c.json({ success: true, data: config });
  } catch (error: any) {
    console.error('获取状态失败:', error);
    return c.json(
      {
        success: false,
        error: '获取状态失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// 获取模型列表
configRouter.get('/models', async (c) => {
  try {
    const { stdout: providersRaw } = await execa('openclaw', ['config', 'get', '--json', 'models.providers']);
    const providersJson = extractJson(providersRaw) || {};

    let defaultModel: string | null = null;
    try {
      const { stdout } = await execa('openclaw', ['config', 'get', 'agents.defaults.model.primary']);
      defaultModel = stdout.trim() || null;
    } catch {
      defaultModel = null;
    }

    const models: Array<{ key: string; label: string }> = [];
    Object.entries(providersJson).forEach(([providerId, provider]: any) => {
      const list = Array.isArray(provider?.models) ? provider.models : [];
      list.forEach((model: any) => {
        const id = model?.id || model?.name || 'unknown';
        const name = model?.name || model?.id || id;
        models.push({
          key: `${providerId}/${id}`,
          label: `${name} (${providerId})`,
        });
      });
    });

    return c.json({ success: true, data: { models, defaultModel } });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: '获取模型列表失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// 切换默认模型
configRouter.post('/models/default', async (c) => {
  try {
    const { model } = await c.req.json();
    if (!model) {
      return c.json({ success: false, error: '缺少模型参数' }, 400);
    }
    await execa('openclaw', [
      'config',
      'set',
      '--json',
      'agents.defaults.model',
      JSON.stringify({ primary: model }),
    ]);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: '切换默认模型失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// 获取渠道配置
configRouter.get('/channels', async (c) => {
  try {
    const { stdout } = await execa('openclaw', ['config', 'get', '--json', 'channels']);
    const channelsJson = extractJson(stdout) || {};
    const channels = Object.entries(channelsJson).map(([id, value]: any) => ({
      id,
      label: id.toUpperCase(),
      enabled: value?.enabled !== false,
    }));
    return c.json({ success: true, data: { channels } });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: '获取渠道配置失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// 远程支持配置读取
configRouter.get('/remote-support', async (c) => {
  try {
    const filePath = resolveRemoteSupportPath();
    if (!fs.existsSync(filePath)) {
      return c.json({ success: true, data: { sshKey: '', cpolarToken: '', region: 'en' } });
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);
    return c.json({
      success: true,
      data: {
        sshKey: data.sshKey || '',
        cpolarToken: data.cpolarToken || '',
        region: data.region || 'en',
      },
    });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: '读取远程支持配置失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// 远程支持配置保存
configRouter.post('/remote-support', async (c) => {
  try {
    const { sshKey, cpolarToken, region } = await c.req.json();
    const filePath = resolveRemoteSupportPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      filePath,
      JSON.stringify(
        {
          sshKey: sshKey || '',
          cpolarToken: cpolarToken || '',
          region: region || 'en',
        },
        null,
        2
      )
    );
    return c.json({ success: true });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: '保存远程支持配置失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});

// 启动远程支持
configRouter.post('/remote-support/start', async (c) => {
  try {
    const { sshKey, cpolarToken, region } = await c.req.json();
    if (!sshKey || !cpolarToken) {
      return c.json({ success: false, error: '请填写 SSH Key 和 cpolar AuthToken' }, 400);
    }

    const mappedRegion = region === 'en' ? 'eu' : region;

    await execa('cpolar', ['authtoken', cpolarToken]);
    await execa('sh', [
      '-c',
      `nohup cpolar tcp -region=${mappedRegion} 22 > ${process.env.HOME}/.openclaw/logs/cpolar.log 2>&1 &`,
    ]);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json(
      {
        success: false,
        error: '启动远程支持失败: ' + (error.message || '未知错误'),
      },
      500
    );
  }
});
