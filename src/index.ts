import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { configRouter } from './routes/config.js';

const app = new Hono();

// 静态文件服务
app.use('/assets/*', serveStatic({ root: './public' }));
app.use('/', serveStatic({ path: './public/index.html' }));

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

serve({
  fetch: app.fetch,
  port: PORT,
});
