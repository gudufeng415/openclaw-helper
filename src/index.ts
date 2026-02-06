import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { configRouter } from './routes/config.js';
import { createNodeWebSocket } from '@hono/node-ws';

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: new Hono() });

const app = new Hono();

// 静态文件服务
app.use('/assets/*', serveStatic({ root: './public' }));
app.use('/', serveStatic({ path: './public/index.html' }));

// API 路由
app.route('/api/config', configRouter);

// WebSocket 路由 - OAuth 登录终端
app.get(
  '/ws/oauth-login',
  upgradeWebSocket((c) => {
    return {
      onMessage: async (event, ws) => {
        const data = JSON.parse(event.data.toString());
        const { provider } = data;

        if (!provider) {
          ws.send(JSON.stringify({ type: 'error', message: '请指定模型提供商' }));
          return;
        }

        try {
          // 动态导入 node-pty
          const pty = await import('node-pty');
          
          // 确定命令
          let command: string;
          if (provider === 'gpt') {
            command = 'openclaw models auth login --provider openai --set-default';
          } else if (provider === 'qwen') {
            command = 'openclaw models auth login --provider qwen-portal --set-default';
          } else {
            ws.send(JSON.stringify({ type: 'error', message: '不支持的提供商' }));
            return;
          }

          // 创建伪终端
          const shell = pty.spawn('sh', ['-c', command], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.env.HOME || process.cwd(),
            env: process.env as any,
          });

          // 监听输出
          shell.onData((data) => {
            ws.send(JSON.stringify({ type: 'output', data }));
          });

          // 监听退出
          shell.onExit(({ exitCode }) => {
            if (exitCode === 0) {
              ws.send(JSON.stringify({ type: 'success', message: '登录成功！' }));
            } else {
              ws.send(JSON.stringify({ type: 'error', message: `命令执行失败 (退出码: ${exitCode})` }));
            }
            ws.close();
          });

          // 接收用户输入
          ws.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data.toString());
            if (msg.type === 'input') {
              shell.write(msg.data);
            }
          });

        } catch (error: any) {
          ws.send(JSON.stringify({ type: 'error', message: '启动终端失败: ' + error.message }));
          ws.close();
        }
      },
      onClose: () => {
        console.log('WebSocket 连接已关闭');
      },
    };
  })
);

// 健康检查
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 17543;

console.log(`🚀 OpenClaw Helper 服务启动中...`);
console.log(`📍 监听端口: ${PORT}`);
console.log(`🌐 访问地址: http://127.0.0.1:${PORT}`);

const server = serve({
  fetch: injectWebSocket(app.fetch),
  port: PORT,
});

console.log('✅ 服务已启动 (WebSocket 支持已启用)');
