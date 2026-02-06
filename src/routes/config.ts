import { Hono } from 'hono';
import { execa } from 'execa';

export const configRouter = new Hono();

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
        // 启用 OpenAI 插件
        await execa('openclaw', ['plugins', 'enable', 'openai']);
        // OAuth 登录通过 WebSocket 完成
        result = {
          provider: 'gpt',
          requiresOAuth: true,
          message: '请在弹出的终端中完成 GPT OAuth 登录',
        };
        break;

      case 'qwen':
        // 启用千问插件
        await execa('openclaw', ['plugins', 'enable', 'qwen-portal-auth']);
        // OAuth 登录通过 WebSocket 完成
        result = {
          provider: 'qwen',
          requiresOAuth: true,
          message: '请在弹出的终端中完成千问 OAuth 登录',
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

    // 配置 Telegram
    await execa('openclaw', ['config', 'set', 'telegram.token', token]);
    await execa('openclaw', ['config', 'set', '--json', 'telegram.allowlist', JSON.stringify([userId])]);

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
      const { stdout } = await execa('openclaw', ['config', 'get', 'telegram.token']);
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
