# 故障排查指南

## 常见问题

### 1. "Failed to fetch" 或 "网络错误"

**原因**: 服务器未启动或连接失败

**解决方案**:

```bash
# 方法 1: 使用启动脚本
./start.sh

# 方法 2: 手动启动
npm run dev

# 方法 3: 检查并重启
lsof -ti :17543 | xargs kill -9 2>/dev/null
npm run dev
```

**验证**:
```bash
# 检查端口
lsof -i :17543

# 测试 API
curl http://127.0.0.1:17543/health
```

### 2. 端口被占用

**错误信息**: `EADDRINUSE: address already in use :::17543`

**解决方案**:

```bash
# 查找并停止占用端口的进程
lsof -ti :17543 | xargs kill -9

# 重新启动
npm run dev
```

### 3. OAuth 登录卡住

**原因**: 终端未正确响应

**解决方案**:

1. 刷新页面重试
2. 检查浏览器控制台是否有 WebSocket 错误
3. 确认 OpenClaw 插件已启用:

```bash
# GPT
openclaw plugins enable openai

# 千问
openclaw plugins enable qwen-portal-auth
```

### 4. 配置不生效

**解决方案**:

```bash
# 检查配置
openclaw config get agents.defaults.model.primary
openclaw config get telegram.token

# 运行诊断
openclaw doctor --yes --fix

# 重启 Gateway
pkill -f "openclaw.*gateway"
openclaw gateway run --bind loopback --port 18789 &
```

### 5. WebSocket 连接失败

**错误信息**: "WebSocket connection failed"

**解决方案**:

1. 确认服务器支持 WebSocket:
```bash
# 检查服务日志
tail -f /tmp/openclaw-helper-dev.log
```

2. 检查防火墙设置

3. 尝试使用 HTTP 而不是 HTTPS

### 6. 模块未找到错误

**错误信息**: `Cannot find module 'xxx'`

**解决方案**:

```bash
# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 7. TypeScript 编译错误

**解决方案**:

```bash
# 检查 TypeScript 版本
npx tsc --version

# 重新编译
npm run build
```

### 8. 权限错误

**错误信息**: `EACCES: permission denied`

**解决方案**:

```bash
# 修复文件权限
chmod +x install.sh start.sh

# 修复目录权限
chmod 755 ~/.openclaw
```

## 调试工具

### 检查服务状态

```bash
# 完整检查脚本
cat << 'EOF' > check.sh
#!/bin/bash
echo "=== OpenClaw Helper 状态检查 ==="
echo ""
echo "1. 端口状态:"
lsof -i :17543 || echo "  端口未使用"
echo ""
echo "2. 进程状态:"
ps aux | grep "tsx watch" | grep -v grep || echo "  进程未运行"
echo ""
echo "3. 健康检查:"
curl -s http://127.0.0.1:17543/health || echo "  服务未响应"
echo ""
echo "4. 配置状态:"
curl -s http://127.0.0.1:17543/api/config/status || echo "  API 未响应"
echo ""
echo "5. Gateway 状态:"
pgrep -f "openclaw.*gateway" || echo "  Gateway 未运行"
lsof -i :18789 || echo "  Gateway 端口未监听"
EOF
chmod +x check.sh
./check.sh
```

### 查看日志

```bash
# Helper 服务日志
tail -f /tmp/openclaw-helper-dev.log

# OpenClaw Gateway 日志
tail -f ~/.openclaw/logs/gateway.log

# cpolar 日志
tail -f /tmp/cpolar.log
```

### 测试 API 端点

```bash
# 健康检查
curl http://127.0.0.1:17543/health

# 配置状态
curl http://127.0.0.1:17543/api/config/status

# 配置模型 (测试)
curl -X POST http://127.0.0.1:17543/api/config/model \
  -H "Content-Type: application/json" \
  -d '{"provider":"minimax","token":"test"}'
```

### 浏览器调试

打开浏览器开发者工具 (F12):

1. **Console** - 查看 JavaScript 错误
2. **Network** - 查看 API 请求和响应
3. **WebSocket** - 查看 WebSocket 连接状态

## 重置一切

如果所有方法都失败，尝试完全重置：

```bash
# 停止所有服务
pkill -f "tsx watch"
pkill -f "openclaw.*gateway"
lsof -ti :17543 | xargs kill -9
lsof -ti :18789 | xargs kill -9

# 清理缓存
rm -rf node_modules package-lock.json
rm -rf ~/.openclaw
rm -f /tmp/openclaw-helper*.log

# 重新安装
npm install

# 重新启动
./start.sh
```

## 获取帮助

如果问题仍未解决:

1. **查看日志** - 检查所有相关日志文件
2. **提交 Issue** - https://github.com/shunseven/openclaw-helper/issues
3. **附上信息**:
   - 错误消息
   - 日志内容
   - 系统信息 (`node --version`, `npm --version`)
   - 步骤重现

## 系统要求检查

```bash
# 检查 Node.js 版本 (需要 22+)
node --version

# 检查 npm 版本
npm --version

# 检查 OpenClaw 版本
openclaw --version

# 检查系统信息
uname -a
```

## 快速修复命令

```bash
# 一键重启服务
pkill -f "tsx watch" && npm run dev

# 一键重启 Gateway
pkill -f "openclaw.*gateway" && openclaw gateway run --bind loopback --port 18789 &

# 一键检查所有服务
lsof -i :17543 && lsof -i :18789 && echo "✅ 所有服务正常"
```
