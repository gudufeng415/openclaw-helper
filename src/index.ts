import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { configRouter } from './routes/config.js';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { ConfigPage, WizardPage } from './views.js';
import fs from 'fs';
import path from 'path';

const app = new Hono();

// CORS 支持
app.use('/*', cors());

// 静态文件服务
app.use('/assets/*', serveStatic({ root: './public' }));
app.use('/tailwind.css', serveStatic({ path: './public/tailwind.css' }));

// 页面路由
app.get('/', (c) => c.html(WizardPage()));
app.get('/config', (c) => c.html(ConfigPage()));

// API 路由
app.route('/api/config', configRouter);

// 健康检查
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = 17543;

console.log(`🚀 OpenClaw Helper 服务启动中...`);
console.log(`📍 监听端口: ${PORT}`);
console.log(`🌐 访问地址: http://127.0.0.1:${PORT}`);

// 创建 HTTP 服务器
const server = createServer(async (req, res) => {
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const response = await app.fetch(
    new Request(`http://localhost${req.url}`, {
      method: req.method,
      headers: req.headers as any,
      body: hasBody ? req : undefined,
      ...(hasBody ? { duplex: 'half' } : {}),
    } as RequestInit)
  );

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
});

// 创建 WebSocket 服务器
const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);

  if (pathname === '/ws/oauth-login') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);

      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          const { provider, type } = data;

          // 只处理第一条连接消息
          if (!type && provider) {
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
              const shPath = process.env.SHELL || '/bin/sh';
              const home = process.env.HOME || process.cwd();
              const env = {
                ...process.env,
                PATH:
                  process.env.PATH ||
                  `${home}/.local/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin`,
                TERM: process.env.TERM || 'xterm-256color',
              } as any;

              let spawned = false;
              try {
                const openclawPath = path.join(home, '.local/bin', 'openclaw');
                const directOpenclaw = fs.existsSync(openclawPath);
                const ptyFile = directOpenclaw ? openclawPath : shPath;
                const ptyArgs = directOpenclaw
                  ? ['models', 'auth', 'login', '--provider', provider, '--set-default']
                  : ['-lc', command];

                const shell = pty.spawn(ptyFile, ptyArgs, {
                  name: 'xterm-color',
                  cols: 80,
                  rows: 30,
                  cwd: home,
                  env,
                });
                spawned = true;

                // 监听输出
                shell.onData((data) => {
                  if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ type: 'output', data }));
                  }
                });

                // 监听退出
                shell.onExit(({ exitCode }) => {
                  if (ws.readyState === ws.OPEN) {
                    if (exitCode === 0) {
                      ws.send(JSON.stringify({ type: 'success', message: '登录成功！' }));
                    } else {
                      ws.send(JSON.stringify({ type: 'error', message: `命令执行失败 (退出码: ${exitCode})` }));
                    }
                    setTimeout(() => ws.close(), 1000);
                  }
                });
              } catch (err: any) {
                // pty 失败则尝试用 script 分配伪终端
                const { spawn } = await import('child_process');
                let child: ReturnType<typeof spawn> | null = null;
                const scriptPath = '/usr/bin/script';
                const openclawPath = path.join(home, '.local/bin', 'openclaw');
                const directOpenclaw = fs.existsSync(openclawPath);
                const fallbackFile = directOpenclaw ? openclawPath : shPath;
                const fallbackArgs = directOpenclaw
                  ? ['models', 'auth', 'login', '--provider', provider, '--set-default']
                  : ['-lc', command];
                if (scriptPath) {
                  child = spawn(scriptPath, ['-q', '/dev/null', fallbackFile, ...fallbackArgs], {
                    cwd: home,
                    env,
                  });
                } else {
                  // 再降级为普通子进程（可能仍然要求 TTY）
                  child = spawn(fallbackFile, fallbackArgs, {
                    cwd: home,
                    env,
                  });
                }

                child.stdout.on('data', (data) => {
                  if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
                  }
                });
                child.stderr.on('data', (data) => {
                  if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ type: 'output', data: data.toString() }));
                  }
                });
                child.on('close', (code) => {
                  if (ws.readyState === ws.OPEN) {
                    if (code === 0) {
                      ws.send(JSON.stringify({ type: 'success', message: '登录成功！' }));
                    } else {
                      const msg = err?.message ? `，pty 启动失败: ${err.message}` : '';
                      ws.send(JSON.stringify({ type: 'error', message: `命令执行失败 (退出码: ${code})${msg}` }));
                    }
                    setTimeout(() => ws.close(), 1000);
                  }
                });
              }

              // 接收用户输入
              ws.on('message', (msg) => {
                try {
                  const inputData = JSON.parse(msg.toString());
                  if (inputData.type === 'input') {
                    shell.write(inputData.data);
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              });
            } catch (error: any) {
              ws.send(JSON.stringify({ type: 'error', message: '启动终端失败: ' + error.message }));
              ws.close();
            }
          }
        } catch (error: any) {
          console.error('WebSocket 消息处理错误:', error);
        }
      });

      ws.on('close', () => {
        console.log('WebSocket 连接已关闭');
      });

      ws.on('error', (error) => {
        console.error('WebSocket 错误:', error);
      });
    });
  } else {
    socket.destroy();
  }
});

server.listen(PORT, () => {
  console.log('✅ 服务已启动 (WebSocket 支持已启用)');
});
