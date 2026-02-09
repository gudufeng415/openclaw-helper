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
const OPENAI_CODEX_DEFAULT_MODEL = 'openai-codex/gpt-5.2';

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
  status: 'pending' | 'success' | 'error';
  error?: string;
  authUrl?: string;
  startedAt: number;
};

const gptOAuthSessions = new Map<string, GptOAuthSession>();

// 动态导入 openclaw 内置的 loginOpenAICodex（来自 @mariozechner/pi-ai）
let _loginOpenAICodex: any = null;
const PI_AI_REL = 'node_modules/@mariozechner/pi-ai/dist/utils/oauth/openai-codex.js';

async function resolveOpenclawRoot(): Promise<string | null> {
  const home = process.env.HOME || '';

  // 1. 通过 which openclaw 找到 bin，然后解析真实路径
  //    openclaw 可能是 bash wrapper: exec /path/to/node/bin/openclaw "$@"
  try {
    const { stdout: whichOut } = await execa('which', ['openclaw']);
    const binPath = whichOut.trim();

    // 如果是脚本包装器，解析其中的 exec 目标路径
    try {
      const content = fs.readFileSync(binPath, 'utf-8');
      const execMatch = content.match(/exec\s+(.+?)\/bin\/openclaw/);
      if (execMatch) {
        const nodePrefix = execMatch[1].trim();
        const root = path.join(nodePrefix, 'lib/node_modules/openclaw');
        if (fs.existsSync(root)) return root;
      }
    } catch {}

    // 如果是真实的 node 二进制 symlink
    try {
      const realBin = fs.realpathSync(binPath);
      const root = path.resolve(path.dirname(realBin), '..', 'lib/node_modules/openclaw');
      if (fs.existsSync(root)) return root;
    } catch {}
  } catch {}

  // 2. 扫描 nvm 安装的各个 node 版本
  const nvmDir = path.join(home, '.nvm/versions/node');
  try {
    if (fs.existsSync(nvmDir)) {
      const versions = fs.readdirSync(nvmDir).sort().reverse(); // 从新到旧
      for (const v of versions) {
        const root = path.join(nvmDir, v, 'lib/node_modules/openclaw');
        if (fs.existsSync(root)) return root;
      }
    }
  } catch {}

  // 3. 常见全局安装路径
  const fallbacks = [
    path.join(home, '.local/lib/node_modules/openclaw'),
    '/usr/local/lib/node_modules/openclaw',
    '/usr/lib/node_modules/openclaw',
  ];
  for (const root of fallbacks) {
    if (fs.existsSync(root)) return root;
  }

  return null;
}

async function getLoginOpenAICodex() {
  if (_loginOpenAICodex) return _loginOpenAICodex;

  const openclawRoot = await resolveOpenclawRoot();
  if (!openclawRoot) {
    throw new Error('无法找到 openclaw 安装目录，请确认 openclaw 已正确安装');
  }

  const modulePath = path.join(openclawRoot, PI_AI_REL);
  if (!fs.existsSync(modulePath)) {
    throw new Error(`找到 openclaw 目录 (${openclawRoot}) 但缺少 pi-ai 模块: ${modulePath}`);
  }

  try {
    const mod = await import(`file://${modulePath}`);
    _loginOpenAICodex = mod.loginOpenAICodex;
    console.log(`已加载 loginOpenAICodex from: ${modulePath}`);
    return _loginOpenAICodex;
  } catch (err: any) {
    throw new Error(`加载 loginOpenAICodex 失败: ${err.message}`);
  }
}

// 写入 OpenAI Codex 凭据到 auth-profiles.json
function writeOpenAICodexCredentials(creds: { access: string; refresh: string; expires: number; email?: string; [key: string]: unknown }) {
  const home = process.env.HOME || process.cwd();
  const agentDir = process.env.OPENCLAW_AGENT_DIR?.trim() || path.join(home, '.openclaw', 'agents', 'main', 'agent');
  const authProfilePath = path.join(agentDir, 'auth-profiles.json');

  let store: any = { version: 1, profiles: {} };
  try {
    if (fs.existsSync(authProfilePath)) {
      store = JSON.parse(fs.readFileSync(authProfilePath, 'utf-8'));
    }
  } catch {}

  const profileId = `openai-codex:${creds.email?.trim() || 'default'}`;
  store.profiles[profileId] = {
    type: 'oauth',
    provider: 'openai-codex',
    ...creds,
  };

  const dir = path.dirname(authProfilePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(authProfilePath, JSON.stringify(store, null, 2));
  console.log(`OpenAI Codex 凭据已写入 ${authProfilePath} (profile: ${profileId})`);
}

// 配置 OpenAI Codex 默认模型
async function applyOpenAICodexConfig() {
  await execa('openclaw', [
    'config',
    'set',
    '--json',
    'agents.defaults.model',
    JSON.stringify({ primary: OPENAI_CODEX_DEFAULT_MODEL }),
  ]);
}

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
        // OpenAI Codex 使用内置 ChatGPT OAuth，无需插件
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

// GPT OAuth: 使用 loginOpenAICodex (ChatGPT OAuth) 启动授权流程
configRouter.post('/gpt-oauth/start', async (c) => {
  try {
    const loginOpenAICodex = await getLoginOpenAICodex();
    const sessionId = randomUUID();

    const session: GptOAuthSession = {
      sessionId,
      status: 'pending',
      startedAt: Date.now(),
    };
    gptOAuthSessions.set(sessionId, session);

    // 启动 ChatGPT OAuth 流程（异步，不 await）
    loginOpenAICodex({
      onAuth: (info: { url: string; instructions?: string }) => {
        // 捕获授权 URL
        const currentSession = gptOAuthSessions.get(sessionId);
        if (currentSession) {
          currentSession.authUrl = info.url;
        }
      },
      onPrompt: async (prompt: { message: string }) => {
        // 手动粘贴回调 URL 的 fallback（在浏览器回调失败时使用）
        // 在 web UI 中暂不支持，返回空字符串等待浏览器回调
        console.log('OpenAI OAuth prompt:', prompt.message);
        return '';
      },
      onProgress: (msg: string) => {
        console.log('OpenAI OAuth progress:', msg);
      },
    }).then(async (creds: any) => {
      const currentSession = gptOAuthSessions.get(sessionId);
      if (currentSession) {
        try {
          // 写入凭据到 auth-profiles.json
          writeOpenAICodexCredentials(creds);
          // 设置默认模型
          await applyOpenAICodexConfig();
          currentSession.status = 'success';
          console.log('OpenAI Codex OAuth 认证成功');
        } catch (err: any) {
          currentSession.status = 'error';
          currentSession.error = '保存凭据失败: ' + (err.message || '未知错误');
          console.error('保存 OpenAI Codex 凭据失败:', err);
        }
      }
    }).catch((err: any) => {
      const currentSession = gptOAuthSessions.get(sessionId);
      if (currentSession) {
        currentSession.status = 'error';
        currentSession.error = 'ChatGPT OAuth 失败: ' + (err.message || '未知错误');
      }
      console.error('OpenAI Codex OAuth 失败:', err);
    });

    // 等待 onAuth 回调获取授权 URL
    await new Promise(resolve => setTimeout(resolve, 3000));

    const authUrl = session.authUrl || '';
    if (!authUrl) {
      // 如果还没拿到 URL，再等一下
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    return c.json({
      success: true,
      data: {
        sessionId,
        authUrl: session.authUrl || 'https://chatgpt.com',
        message: '请在浏览器中完成 ChatGPT 授权',
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

// 获取 Telegram 已有配置
configRouter.get('/telegram', async (c) => {
  try {
    let botToken = '';
    let userId = '';

    try {
      const { stdout } = await execa('openclaw', ['config', 'get', 'channels.telegram.botToken']);
      botToken = stdout.trim().replace(/^"|"$/g, '');
    } catch {}

    try {
      const { stdout } = await execa('openclaw', ['config', 'get', '--json', 'channels.telegram.allowFrom']);
      const parsed = extractJson(stdout);
      if (Array.isArray(parsed) && parsed.length > 0) {
        userId = String(parsed[0]);
      }
    } catch {}

    return c.json({
      success: true,
      data: {
        configured: !!(botToken && userId),
        botToken,
        userId,
      },
    });
  } catch (error: any) {
    return c.json({ success: true, data: { configured: false, botToken: '', userId: '' } });
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
    await execa('openclaw', ['config', 'set', '--json', 'channels.telegram.botToken', JSON.stringify(token)]);
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

    // 获取 Gateway Token
    try {
      const { stdout } = await execa('openclaw', ['config', 'get', 'gateway.auth.token']);
      config.gatewayToken = stdout.trim() || null;
    } catch {
      config.gatewayToken = null;
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
