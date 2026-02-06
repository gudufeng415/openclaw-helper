# OpenClaw Helper 测试指南

## 功能测试清单

### 1. 服务启动测试

#### 开发模式
```bash
cd openclaw-helper
npm run dev
```

**预期结果:**
```
🚀 OpenClaw Helper 服务启动中...
📍 监听端口: 17543
🌐 访问地址: http://127.0.0.1:17543
✅ 服务已启动 (WebSocket 支持已启用)
```

#### 检查服务状态
```bash
# 检查端口监听
lsof -i :17543

# 健康检查
curl http://127.0.0.1:17543/health
```

**预期响应:**
```json
{"status":"ok","timestamp":"2026-02-06T..."}
```

### 2. 静态文件服务测试

#### 访问首页
```bash
curl -I http://127.0.0.1:17543/
```

**预期结果:** 返回 200 状态码，Content-Type 为 text/html

#### 访问图片资源
```bash
curl -I http://127.0.0.1:17543/assets/image-1.png
```

**预期结果:** 返回 200 状态码，Content-Type 为 image/png

### 3. API 端点测试

#### 3.1 配置状态查询
```bash
curl http://127.0.0.1:17543/api/config/status
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "defaultModel": null,
    "telegramConfigured": false,
    "gatewayRunning": false
  }
}
```

#### 3.2 配置 MiniMax 模型
```bash
curl -X POST http://127.0.0.1:17543/api/config/model \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "minimax",
    "token": "your-api-key"
  }'
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "provider": "minimax",
    "model": "MiniMax-M2.1"
  }
}
```

#### 3.3 配置 GPT 模型 (返回 OAuth 提示)
```bash
curl -X POST http://127.0.0.1:17543/api/config/model \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gpt"
  }'
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "provider": "gpt",
    "requiresOAuth": true,
    "message": "请在弹出的终端中完成 GPT OAuth 登录"
  }
}
```

#### 3.4 配置 Telegram
```bash
curl -X POST http://127.0.0.1:17543/api/config/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456789:ABCDefghIJKLmnopQRSTuvwxYZ",
    "userId": "123456789"
  }'
```

**预期响应:**
```json
{
  "success": true,
  "data": {
    "token": "1234567...",
    "userId": "123456789"
  }
}
```

#### 3.5 跳过 Telegram 配置
```bash
curl -X POST http://127.0.0.1:17543/api/config/telegram \
  -H "Content-Type: application/json" \
  -d '{"skip": true}'
```

**预期响应:**
```json
{
  "success": true,
  "skipped": true
}
```

### 4. WebSocket OAuth 登录测试

#### 使用 WebSocket 客户端测试

**连接地址:** `ws://127.0.0.1:17543/ws/oauth-login`

**发送消息 (启动 GPT 登录):**
```json
{"provider": "gpt"}
```

**预期接收的消息:**

1. **输出消息** (实时显示命令输出):
```json
{"type": "output", "data": "正在启动 OAuth 登录..."}
```

2. **成功消息** (登录成功):
```json
{"type": "success", "message": "登录成功！"}
```

3. **错误消息** (登录失败):
```json
{"type": "error", "message": "命令执行失败 (退出码: 1)"}
```

#### 使用浏览器测试

1. 打开 http://127.0.0.1:17543
2. 选择 "GPT" 或 "千问"
3. 点击 "下一步"
4. 观察是否弹出终端模态框
5. 终端中应该显示 OAuth 登录流程

### 5. 前端界面测试

#### 步骤 1: 模型选择

**测试用例:**

1. **未选择模型** - 点击"下一步"应显示错误提示
2. **选择 MiniMax 但未填 Token** - 点击"下一步"应显示错误提示
3. **选择 MiniMax 并填写 Token** - 应正常进入下一步
4. **选择 GPT** - 应弹出 OAuth 终端
5. **选择千问** - 应弹出 OAuth 终端

#### 步骤 2: Telegram 配置

**测试用例:**

1. **未填写任何信息** - "完成配置"按钮应禁用
2. **只填写 Token** - "完成配置"按钮应禁用
3. **只填写用户 ID** - "完成配置"按钮应禁用
4. **两者都填写** - "完成配置"按钮应启用
5. **点击跳过** - 应进入完成页面

#### 完成页面

**测试用例:**

1. **显示成功提示** - 应显示 ✓ 图标和成功消息
2. **打开 Dashboard** - 点击按钮应打开新标签页访问 http://127.0.0.1:18789

### 6. 错误处理测试

#### 6.1 端口被占用
```bash
# 启动两个实例
npm run dev &
npm run dev &
```

**预期结果:** 第二个实例应报错 "EADDRINUSE: address already in use"

#### 6.2 无效的 API 请求
```bash
curl -X POST http://127.0.0.1:17543/api/config/model \
  -H "Content-Type: application/json" \
  -d '{"provider": "invalid"}'
```

**预期响应:**
```json
{
  "success": false,
  "error": "不支持的模型提供商"
}
```

#### 6.3 缺少必填字段
```bash
curl -X POST http://127.0.0.1:17543/api/config/telegram \
  -H "Content-Type: application/json" \
  -d '{"token": "only-token"}'
```

**预期响应:**
```json
{
  "success": false,
  "error": "请提供 Telegram Bot Token 和用户 ID"
}
```

### 7. 集成测试

#### 完整流程测试

1. **启动服务**
```bash
npm run dev
```

2. **访问首页**
   - 打开浏览器访问 http://127.0.0.1:17543

3. **配置模型**
   - 选择 MiniMax
   - 输入 API Key
   - 点击"下一步"

4. **配置 Telegram**
   - 输入 Bot Token
   - 输入用户 ID
   - 点击"完成配置"

5. **验证配置**
```bash
openclaw config get agents.defaults.model.primary
openclaw config get telegram.token
```

6. **检查 Gateway**
```bash
pgrep -f "openclaw.*gateway"
lsof -i :18789
```

### 8. 性能测试

#### 并发请求测试
```bash
# 使用 ab (Apache Bench) 测试
ab -n 1000 -c 10 http://127.0.0.1:17543/health

# 或使用 curl 循环测试
for i in {1..100}; do
  curl -s http://127.0.0.1:17543/health > /dev/null
  echo "Request $i completed"
done
```

#### WebSocket 连接测试
```bash
# 测试多个 WebSocket 连接
for i in {1..10}; do
  # 使用 wscat 工具
  echo '{"provider":"gpt"}' | wscat -c ws://127.0.0.1:17543/ws/oauth-login &
done
```

### 9. 安全测试

#### SQL 注入测试
```bash
curl -X POST http://127.0.0.1:17543/api/config/model \
  -H "Content-Type: application/json" \
  -d '{"provider":"minimax","token":"'; DROP TABLE--"}'
```

**预期结果:** 应正常处理，不会执行恶意代码

#### XSS 测试
```bash
curl -X POST http://127.0.0.1:17543/api/config/telegram \
  -H "Content-Type: application/json" \
  -d '{"token":"<script>alert(1)</script>","userId":"123"}'
```

**预期结果:** 应正常处理，脚本不会执行

### 10. 清理和重置

#### 停止服务
```bash
pkill -f "tsx watch"
lsof -ti :17543 | xargs kill -9
```

#### 清理配置
```bash
rm -rf ~/.openclaw
rm -rf ~/openclaw-helper
```

## 自动化测试脚本

```bash
#!/bin/bash
# test.sh - 自动化测试脚本

echo "开始测试 OpenClaw Helper..."

# 1. 启动服务
npm run dev &
DEV_PID=$!
sleep 3

# 2. 健康检查
echo "测试健康检查..."
curl -s http://127.0.0.1:17543/health | grep -q "ok" && echo "✅ 健康检查通过" || echo "❌ 健康检查失败"

# 3. 测试静态文件
echo "测试静态文件..."
curl -s -I http://127.0.0.1:17543/ | grep -q "200 OK" && echo "✅ 首页访问通过" || echo "❌ 首页访问失败"

# 4. 测试 API
echo "测试 API..."
curl -s http://127.0.0.1:17543/api/config/status | grep -q "success" && echo "✅ API 测试通过" || echo "❌ API 测试失败"

# 5. 清理
kill $DEV_PID 2>/dev/null

echo "测试完成！"
```

## 常见问题

### Q: 服务启动后无法访问?
**A:** 检查防火墙设置，确保 17543 端口没有被阻止。

### Q: WebSocket 连接失败?
**A:** 检查浏览器控制台错误，确认 WebSocket URL 正确。

### Q: OAuth 登录卡住?
**A:** 检查终端输出，可能需要在浏览器中完成 OAuth 授权。

### Q: 配置未生效?
**A:** 运行 `openclaw doctor --yes --fix` 检查和修复配置。

## 测试报告模板

```markdown
# 测试报告

**测试日期:** 2026-02-06
**测试人员:** [姓名]
**版本:** 1.0.0

## 测试结果

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 服务启动 | ✅ | - |
| 静态文件 | ✅ | - |
| API 端点 | ✅ | - |
| WebSocket | ✅ | - |
| 前端界面 | ✅ | - |
| 错误处理 | ✅ | - |

## 问题记录

1. [问题描述]
   - 复现步骤: ...
   - 预期结果: ...
   - 实际结果: ...
   - 解决方案: ...

## 总结

测试通过率: 100%
建议: ...
```

## 下一步

完成测试后:
1. 记录测试结果
2. 修复发现的问题
3. 更新文档
4. 准备发布
