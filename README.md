# OpenClaw Helper

OpenClaw 安装配置助手 - 简化 OpenClaw 的安装和配置流程。

## 功能特性

- 🚀 一键安装 OpenClaw 及其依赖
- 🎯 可视化配置模型 (MiniMax/GPT/千问)
- 📱 图文并茂的 Telegram 机器人配置指南
- 🔧 自动管理 Gateway 服务
- 📊 实时状态监控

## 快速开始

### 安装方式

#### 方式 1: 使用安装脚本 (推荐)

```bash
# 下载并运行安装脚本
curl -fsSL https://raw.githubusercontent.com/shunseven/openclaw-helper/main/install.sh | bash
```

#### 方式 2: 手动安装

```bash
# 克隆仓库
git clone https://github.com/shunseven/openclaw-helper.git
cd openclaw-helper

# 安装依赖
npm install

# 启动服务
npm start
```

### 开发模式

```bash
# 本地开发
npm run dev

# 或者使用 dev 参数运行安装脚本
./install.sh dev
```

## 使用说明

### 1. 运行安装脚本

安装脚本会自动完成以下任务:

- ✓ 检查并安装系统依赖 (Node.js, Git, Homebrew)
- ✓ 安装 cpolar (SSH 隧道工具)
- ✓ 安装 OpenClaw
- ✓ 安装 OpenClaw Skills
- ✓ 安装系统 CLI 工具 (ffmpeg, gifgrep, peekaboo 等)
- ✓ 启动 Gateway 服务
- ✓ 启动 Helper Web 服务

### 2. 配置模型

安装完成后,浏览器会自动打开 Helper 配置页面 (http://127.0.0.1:17543)。

**步骤 1: 选择模型**

支持三种模型提供商:

1. **MiniMax** - 需要提供 API Key
2. **GPT** - 通过 OAuth 登录
3. **千问** - 通过 OAuth 登录

### 3. 配置 Telegram (可选)

**步骤 2: 配置 Telegram 机器人**

页面提供详细的图文指南,帮助您:

1. 找到 @BotFather
2. 创建新机器人
3. 获取 Bot Token
4. 绑定 Telegram 用户 ID

您也可以选择跳过此步骤,稍后手动配置。

### 4. 完成配置

配置完成后,您可以:

- 打开 OpenClaw Dashboard (http://127.0.0.1:18789)
- 在 Telegram 中向您的机器人发送消息测试
- 查看运行日志

## 常用命令

### OpenClaw 命令

```bash
# 打开 Dashboard
openclaw dashboard

# 查看日志
tail -f ~/.openclaw/logs/gateway.log

# 停止 Gateway
pkill -f 'openclaw.*gateway'

# 重启 Gateway
pkill -f 'openclaw.*gateway' && openclaw gateway run --bind loopback --port 18789 &

# 查看配置
openclaw config get <path>

# 发送消息
openclaw message send '你好'
```

### Helper 服务命令

```bash
# 停止 Helper 服务
lsof -ti :17543 | xargs kill -9

# 启动 Helper 服务
npm start

# 查看 Helper 日志
tail -f /tmp/openclaw-helper.log
```

### cpolar 命令

```bash
# 启动 SSH 隧道
cpolar tcp 22

# 后台运行
nohup cpolar tcp 22 > /tmp/cpolar.log 2>&1 &

# 查看帮助
cpolar help
```

## 端口说明

| 端口 | 服务 | 说明 |
|------|------|------|
| 17543 | Helper Web 服务 | 配置界面 |
| 18789 | OpenClaw Gateway | 主服务 |

## 目录结构

```
openclaw-helper/
├── install.sh              # 安装脚本
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript 配置
├── src/                    # 源代码
│   ├── index.ts            # Hono 服务器
│   └── routes/             # API 路由
│       └── config.ts       # 配置 API
└── public/                 # 静态文件
    ├── index.html          # 配置页面
    └── assets/             # 图片资源
```

## API 文档

### POST /api/config/model

配置模型提供商

**请求体:**

```json
{
  "provider": "minimax|gpt|qwen",
  "token": "your-api-key"  // 仅 MiniMax 需要
}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "provider": "minimax",
    "model": "MiniMax-M2.1"
  }
}
```

### POST /api/config/telegram

配置 Telegram 机器人

**请求体:**

```json
{
  "token": "123456789:ABCDefghIJKLmnopQRSTuvwxYZ",
  "userId": "123456789",
  "skip": false  // true 表示跳过配置
}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "token": "1234567...",
    "userId": "123456789"
  }
}
```

### GET /api/config/status

获取当前配置状态

**响应:**

```json
{
  "success": true,
  "data": {
    "defaultModel": "minimax/MiniMax-M2.1",
    "telegramConfigured": true,
    "gatewayRunning": true
  }
}
```

## 故障排查

### Gateway 启动失败

```bash
# 查看完整日志
cat ~/.openclaw/logs/gateway.log

# 检查配置
openclaw config get agents.defaults.model

# 手动启动测试
openclaw gateway run --bind loopback --port 18789

# 重新运行 doctor
openclaw doctor --yes --fix
```

### Helper 服务无法访问

```bash
# 检查端口占用
lsof -i :17543

# 查看服务日志
tail -f /tmp/openclaw-helper.log

# 重启服务
lsof -ti :17543 | xargs kill -9
npm start
```

### 模型配置失败

```bash
# 检查环境变量
echo $MINIMAX_API_KEY

# 查看配置
openclaw config get models.providers

# 手动设置
openclaw config set agents.defaults.model.primary "minimax/MiniMax-M2.1"
```

## 技术栈

- **后端**: Hono + Node.js
- **前端**: 原生 HTML/CSS/JavaScript
- **进程管理**: execa
- **Shell 脚本**: Bash

## 安全说明

- 本项目的安装脚本已移除所有敏感信息配置
- 不包含 SSH Key、API Key、cpolar authtoken 等敏感数据
- 用户需要自行提供和配置相关凭证

## 系统要求

- macOS 10.15+ (Catalina 或更高版本)
- Node.js 22+ 
- 至少 2GB 可用磁盘空间

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request!

## 相关链接

- [OpenClaw 官网](https://openclaw.ai)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw 文档](https://docs.openclaw.ai)
