#!/usr/bin/env bash
set -e


# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[信息]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[警告]${NC} $1"
}

print_error() {
    echo -e "${RED}[错误]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[步骤]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检测是否为更新模式
is_update_mode() {
    if command_exists openclaw || command_exists clawdbot; then
        return 0  # 是更新模式
    else
        return 1  # 是安装模式
    fi
}

# 保存当前配置
save_existing_config() {
    print_info "正在保存现有配置..."
    
    # 尝试从 clawdbot 或 openclaw 获取 token
    if command_exists openclaw; then
        SAVED_TOKEN=$(openclaw config get gateway.auth.token 2>/dev/null || echo "")
    elif command_exists clawdbot; then
        SAVED_TOKEN=$(clawdbot config get gateway.auth.token 2>/dev/null || echo "")
    else
        SAVED_TOKEN=""
    fi
    
    if [ -n "$SAVED_TOKEN" ]; then
        print_info "✓ 已保存现有 Gateway Token"
        echo "$SAVED_TOKEN" > /tmp/openclaw_saved_token.txt
    else
        print_warning "未找到现有 Token,将生成新的"
    fi
}

# 关闭所有 Node 相关端口和进程
stop_all_node_processes() {
    print_info "正在关闭所有 Node 相关进程..."
    
    # 停止 gateway 进程
    if pgrep -f "gateway" > /dev/null 2>&1; then
        print_info "停止 gateway 进程..."
        pkill -9 -f "gateway" || true
        sleep 1
    fi
    
    # 停止所有 node 进程
    if pgrep -f "node" > /dev/null 2>&1; then
        print_warning "检测到正在运行的 Node 进程,正在停止..."
        pkill -9 -f "node" || true
        sleep 2
    fi
    
    # 释放 18789 端口
    print_info "释放端口 18789..."
    if lsof -i :18789 > /dev/null 2>&1; then
        lsof -ti :18789 | xargs kill -9 2>/dev/null || true
    fi
    
    sleep 2
    print_info "✓ 已停止所有 Node 相关进程"
}

# 清除 npm 缓存
clear_npm_cache() {
    print_info "正在清除 npm 缓存..."
    
    if command_exists npm; then
        npm cache clean --force 2>/dev/null || true
        print_info "✓ npm 缓存已清除"
    fi
    
    # 也清理可能的全局安装残留
    if [ -d "${HOME}/.npm" ]; then
        print_info "清理 npm 全局缓存目录..."
        rm -rf "${HOME}/.npm/_cacache" 2>/dev/null || true
    fi
}

# 检查并安装 Homebrew
check_and_install_homebrew() {
    if command_exists brew; then
        print_info "Homebrew 已安装"
        return 0
    fi
    
    print_warning "未检测到 Homebrew,开始安装..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # 配置 Homebrew 环境变量
    if [[ $(uname -m) == 'arm64' ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
    else
        eval "$(/usr/local/bin/brew shellenv)"
    fi
    
    if command_exists brew; then
        print_info "Homebrew 安装成功"
    else
        print_error "Homebrew 安装失败"
        exit 1
    fi
}

# 检查并安装 Node.js
check_and_install_node() {
    if command_exists node; then
        NODE_VERSION=$(node --version)
        print_info "Node.js 已安装: $NODE_VERSION"
        
        # 检查版本是否满足要求 (Node 22+)
        MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 22 ]; then
            print_warning "Node.js 版本过低 ($NODE_VERSION),需要 22+,开始升级..."
            brew upgrade node
        fi
        return 0
    fi
    
    print_warning "未检测到 Node.js,开始安装..."
    check_and_install_homebrew
    brew install node
    
    if command_exists node; then
        print_info "Node.js 安装成功: $(node --version)"
    else
        print_error "Node.js 安装失败"
        exit 1
    fi
}

# 检查并安装 Git
check_and_install_git() {
    if command_exists git; then
        GIT_VERSION=$(git --version)
        print_info "Git 已安装: $GIT_VERSION"
        return 0
    fi
    
    print_warning "未检测到 Git,开始安装..."
    check_and_install_homebrew
    brew install git
    
    if command_exists git; then
        print_info "Git 安装成功: $(git --version)"
    else
        print_error "Git 安装失败"
        exit 1
    fi
}

# 检查并安装 cpolar
check_and_install_cpolar() {
    if command_exists cpolar; then
        CPOLAR_VERSION=$(cpolar version 2>/dev/null || echo "未知版本")
        print_info "cpolar 已安装: $CPOLAR_VERSION"
        return 0
    fi
    
    print_warning "未检测到 cpolar,开始通过 Homebrew 安装..."
    
    # 确保 Homebrew 已安装
    check_and_install_homebrew
    
    # 通过 Homebrew 安装 cpolar
    print_info "添加 cpolar 的 Homebrew tap..."
    if brew tap probezy/core; then
        print_info "✓ Homebrew tap 添加成功"
    else
        print_error "添加 Homebrew tap 失败"
        exit 1
    fi
    
    print_info "安装 cpolar..."
    if brew install cpolar; then
        print_info "✓ cpolar 安装成功"
    else
        print_error "cpolar 安装失败"
        exit 1
    fi
    
    if command_exists cpolar; then
        CPOLAR_VERSION=$(cpolar version 2>/dev/null || echo "未知版本")
        print_info "✓ cpolar 安装完成: $CPOLAR_VERSION"
    else
        print_error "cpolar 安装验证失败"
        exit 1
    fi
}

# 卸载旧版本
uninstall_old_version() {
    print_info "正在卸载旧版本..."
    
    # 卸载 clawdbot
    if command_exists clawdbot; then
        print_info "卸载 clawdbot..."
        npm uninstall -g clawdbot 2>/dev/null || true
    fi
    
    # 卸载旧版 openclaw(如果存在)
    if command_exists openclaw; then
        print_info "卸载旧版 openclaw..."
        npm uninstall -g openclaw 2>/dev/null || true
    fi
    
    sleep 1
    print_info "✓ 旧版本已卸载"
}

# 安装 openclaw
install_openclaw() {
    print_info "开始安装 openclaw..."

    if command_exists openclaw; then
        CURRENT_VERSION=$(openclaw --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+(-[0-9]+)?' | head -n 1)
        LATEST_VERSION=$(npm view openclaw version 2>/dev/null || echo "")

        if [ -n "$CURRENT_VERSION" ] && [ -n "$LATEST_VERSION" ]; then
            if [ "$CURRENT_VERSION" = "$LATEST_VERSION" ]; then
                print_info "✓ openclaw 已是最新版本: $CURRENT_VERSION"
                return 0
            else
                print_info "检测到新版本: $CURRENT_VERSION -> $LATEST_VERSION,开始升级..."
            fi
        else
            print_warning "无法获取最新版本信息,继续安装..."
        fi
    fi

    npm install -g openclaw@latest
    
    if command_exists openclaw; then
        OPENCLAW_VERSION=$(openclaw --version 2>/dev/null || echo "未知版本")
        print_info "✓ openclaw 安装成功: $OPENCLAW_VERSION"
    else
        print_error "openclaw 安装失败"
        exit 1
    fi
}

# 配置 openclaw
# 参数: $1 = 是否为更新模式 (true/false)
configure_openclaw() {
    local IS_UPDATE_MODE="${1:-false}"
    print_info "开始配置 openclaw..."
    
    # 配置 Gateway 模式(必需!)
    print_info "配置 Gateway 模式为 local..."
    openclaw config set gateway.mode "local"
    
    # 恢复或生成 Gateway Token
    if [ -f /tmp/openclaw_saved_token.txt ]; then
        GATEWAY_TOKEN=$(cat /tmp/openclaw_saved_token.txt)
        print_info "✓ 恢复之前的 Gateway Token"
        rm -f /tmp/openclaw_saved_token.txt
    else
        print_info "生成新的 Gateway Token(纯字母数字)..."
        # 生成 48 个字符的随机字符串,只包含字母和数字
        GATEWAY_TOKEN=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-zA-Z0-9' | head -c 48)
    fi
    
    openclaw config set gateway.auth.token "$GATEWAY_TOKEN"
    export OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN"
    print_info "✓ Gateway Token 已配置"
    
    # 设置模型合并模式
    print_info "设置模型合并模式..."
    openclaw config set models.mode "merge"
    
    print_info "✓ 配置完成"
}

# 验证 Skills 安装状态
verify_skills_status() {
    print_info "验证 Skills 安装状态..."
    
    # 使用 openclaw skills list 检查 skills 状态
    print_info "运行 openclaw skills list 检查..."
    
    # 通过 ClawHub 安装的 skills
    local CLAWHUB_SKILLS=(
        "blogwatcher"
        "nano-pdf"
        "obsidian"
    )
    
    # OpenClaw 内置的 skills
    local BUILTIN_SKILLS=(
        "gifgrep"
        "model-usage"
        "video-frames"
        "peekaboo"
    )
    
    local ALL_READY=true
    
    # 检查 ClawHub skills
    for skill in "${CLAWHUB_SKILLS[@]}"; do
        if openclaw skills list 2>/dev/null | grep -i "$skill" | grep -q "✓ ready"; then
            print_info "✓ Skill '$skill' 已就绪"
        else
            print_warning "⚠ Skill '$skill' 未就绪或未安装"
            ALL_READY=false
        fi
    done
    
    # 检查内置 skills
    for skill in "${BUILTIN_SKILLS[@]}"; do
        if openclaw skills list 2>/dev/null | grep -i "$skill" | grep -q "✓ ready"; then
            print_info "✓ Skill '$skill' 已就绪"
        else
            print_warning "⚠ Skill '$skill' 未就绪"
            ALL_READY=false
        fi
    done
    
    # 检查 Canvas(内置服务,不在 skills list 中)
    print_info "检查 Canvas 服务..."
    if pgrep -f "openclaw.*gateway" > /dev/null 2>&1; then
        # Gateway 在运行,canvas 应该也在运行
        if curl -s --max-time 2 http://127.0.0.1:18789/__openclaw__/canvas/ > /dev/null 2>&1; then
            print_info "✓ Canvas 服务已就绪(内置功能)"
        else
            print_warning "⚠ Canvas 服务未响应"
            ALL_READY=false
        fi
    else
        print_warning "⚠ Gateway 未运行,无法验证 Canvas"
        ALL_READY=false
    fi
    
    echo ""
    if [ "$ALL_READY" = true ]; then
        print_info "✓ 所有目标 Skills 已就绪!"
    else
        print_warning "部分 Skills 未就绪,您可以稍后手动安装:"
        echo "  运行: npx clawhub search <skill-name>"
        echo "  然后: npx clawhub install <skill-name>"
    fi
    
    print_info "✓ Skills 验证完成"
}

# 检查并安装 OpenClaw Skills
check_and_install_skills() {
    print_info "检查并安装 OpenClaw Skills..."
    
    # 定义需要通过 clawhub 安装的 skills
    local CLAWHUB_SKILLS=(
        "blogwatcher"
        "nano-pdf"
        "obsidian"
    )
    
    print_info "通过 ClawHub 安装 OpenClaw Skills..."
    for skill in "${CLAWHUB_SKILLS[@]}"; do
        # 检查 skill 是否已经安装(通过 openclaw skills list 检查)
        # 使用更宽松的 grep 模式来匹配
        if openclaw skills list 2>/dev/null | grep -i "$skill" | grep -q "✓ ready"; then
            print_info "✓ Skill '$skill' 已安装"
        else
            print_info "通过 ClawHub 安装 Skill '$skill'..."
            # 显示完整输出以便调试
            # 明确指定安装到 ~/.openclaw/skills 以确保 OpenClaw 能找到
            if npx -y clawhub install "$skill" --workdir "$HOME/.openclaw"; then
                print_info "✓ Skill '$skill' 安装成功"
            else
                print_warning "⚠ Skill '$skill' 安装失败(可能已通过其他方式安装)"
            fi
        fi
    done
    
    print_info "✓ OpenClaw Skills 检查完成"
}

# 检查并安装 CLI 工具
check_and_install_cli_tools() {
    print_info "检查并安装系统 CLI 工具..."
    
    # 确保 Homebrew 已安装
    check_and_install_homebrew
    
    # 安装 ffmpeg (用于 video-frames)
    if command_exists ffmpeg; then
        print_info "✓ CLI 工具 'ffmpeg' 已安装"
    else
        print_info "安装 CLI 工具 'ffmpeg'..."
        if brew install ffmpeg 2>/dev/null; then
            print_info "✓ CLI 工具 'ffmpeg' 安装成功"
        else
            print_warning "⚠ CLI 工具 'ffmpeg' 安装失败"
        fi
    fi
    
    # 确保 steipete/tap 已添加 (用于 gifgrep 和 peekaboo)
    print_info "添加 steipete/tap..."
    brew tap steipete/tap 2>/dev/null || true
    
    # 安装 gifgrep (用于 gifgrep skill)
    if command_exists gifgrep; then
        print_info "✓ CLI 工具 'gifgrep' 已安装"
    else
        print_info "安装 CLI 工具 'gifgrep'..."
        if brew install gifgrep 2>/dev/null; then
            print_info "✓ CLI 工具 'gifgrep' 安装成功"
        else
            print_warning "⚠ CLI 工具 'gifgrep' 安装失败"
        fi
    fi

    # 安装 peekaboo (用于 peekaboo skill)
    if command_exists peekaboo; then
        print_info "✓ CLI 工具 'peekaboo' 已安装"
    else
        print_info "安装 CLI 工具 'peekaboo'..."
        if brew install peekaboo 2>/dev/null; then
            print_info "✓ CLI 工具 'peekaboo' 安装成功"
        else
            print_warning "⚠ CLI 工具 'peekaboo' 安装失败"
        fi
    fi
    
    # 安装 codexbar (用于 model-usage skill)
    if command_exists codexbar; then
        print_info "✓ CLI 工具 'codexbar' 已安装"
    else
        print_info "安装 CLI 工具 'codexbar'..."
        if brew install --cask codexbar 2>/dev/null; then
            print_info "✓ CLI 工具 'codexbar' 安装成功"
        else
            print_warning "⚠ CLI 工具 'codexbar' 安装失败"
        fi
    fi
    
    # 检查 canvas 相关依赖(Node.js canvas 模块需要的系统库)
    print_info "检查 Canvas 系统依赖..."
    local CANVAS_DEPS=("cairo" "pango" "libpng" "jpeg" "giflib" "pkg-config")
    
    for dep in "${CANVAS_DEPS[@]}"; do
        if brew list "$dep" &>/dev/null; then
            print_info "✓ Canvas 依赖 '$dep' 已安装"
        else
            print_info "安装 Canvas 依赖 '$dep'..."
            if brew install "$dep" 2>/dev/null; then
                print_info "✓ Canvas 依赖 '$dep' 安装成功"
            else
                print_warning "⚠ Canvas 依赖 '$dep' 安装失败"
            fi
        fi
    done
    
    print_info "✓ 系统 CLI 工具检查完成"
}

# 验证安装
verify_installation() {
    print_info "验证安装..."
    
    print_info "运行 openclaw doctor 检查和修复配置(自动模式)..."
    if openclaw doctor --yes --fix; then
        print_info "✓ openclaw 配置正常"
    else
        print_warning "配置检查发现一些问题,但可以继续使用"
    fi
    
    # 确保 GATEWAY_TOKEN 变量与配置文件一致
    GATEWAY_TOKEN=$(openclaw config get gateway.auth.token 2>/dev/null || echo "$GATEWAY_TOKEN")
    export OPENCLAW_GATEWAY_TOKEN="$GATEWAY_TOKEN"
    
    print_info "显示配置..."
    echo "默认模型:"
    openclaw config get agents.defaults.model.primary 2>/dev/null || echo "  未设置"
    echo ""
}

# 启动 openclaw gateway
start_gateway() {
    print_info "启动 openclaw gateway..."
    
    # 检查是否已有 gateway 在运行
    if pgrep -f "openclaw.*gateway" > /dev/null 2>&1; then
        print_warning "检测到 gateway 已在运行,先停止旧进程..."
        pkill -f "openclaw.*gateway" || true
        sleep 2
    fi
    
    # 检查端口是否被占用
    if lsof -i :18789 > /dev/null 2>&1; then
        print_warning "端口 18789 已被占用,尝试释放..."
        lsof -ti :18789 | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    # 创建日志目录
    LOG_DIR="${HOME}/.openclaw/logs"
    mkdir -p "$LOG_DIR"
    LOG_FILE="${LOG_DIR}/gateway.log"
    
    # 清空旧日志
    > "$LOG_FILE"
    
    # 启动 gateway(后台运行)
    print_info "在后台启动 gateway..."
    print_info "日志文件: $LOG_FILE"
    
    # 从配置读取 token,确保使用最新的值
    CURRENT_TOKEN=$(openclaw config get gateway.auth.token 2>/dev/null || echo "")
    if [ -n "$CURRENT_TOKEN" ]; then
        export OPENCLAW_GATEWAY_TOKEN="$CURRENT_TOKEN"
        print_info "✓ Gateway Token 已设置"
    fi
    
    nohup openclaw gateway run --bind loopback --port 18789 > "$LOG_FILE" 2>&1 &
    GATEWAY_PID=$!
    
    # 等待 gateway 启动并检查
    print_info "等待 gateway 启动(最多等待 10 秒)..."
    
    local MAX_WAIT=10
    local WAIT_COUNT=0
    local GATEWAY_STARTED=false
    
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        sleep 1
        WAIT_COUNT=$((WAIT_COUNT + 1))
        
        # 检查进程是否还在运行
        if ! ps -p $GATEWAY_PID > /dev/null 2>&1; then
            print_error "Gateway 进程已退出 (PID: $GATEWAY_PID)"
            print_error "查看错误日志:"
            cat "$LOG_FILE"
            return 1
        fi
        
        # 检查端口是否监听
        if lsof -i :18789 > /dev/null 2>&1; then
            GATEWAY_STARTED=true
            break
        fi
        
        echo -n "."
    done
    echo ""
    
    if [ "$GATEWAY_STARTED" = true ]; then
        print_info "✓ Gateway 启动成功 (PID: $GATEWAY_PID)"
        print_info "✓ 端口 18789 正在监听"
        print_info "✓ 访问地址: http://127.0.0.1:18789"
        
        # 显示最后几行日志
        print_info "最新日志输出:"
        tail -n 15 "$LOG_FILE"
        
        return 0
    else
        print_error "Gateway 启动超时(端口未监听)"
        print_error "进程状态: $(ps -p $GATEWAY_PID -o state= 2>/dev/null || echo '已退出')"
        print_error "完整日志:"
        cat "$LOG_FILE"
        return 1
    fi
}

# 打开 Dashboard 与 Helper
open_dashboard() {
    print_info "准备打开 Dashboard..."
    
    # 始终从配置读取最新的 token
    CURRENT_TOKEN=$(openclaw config get gateway.auth.token 2>/dev/null || echo '')
    
    if [ -z "$CURRENT_TOKEN" ]; then
        print_warning "未找到 Gateway Token,无法打开 Dashboard"
        return 1
    fi
    
    DASHBOARD_URL="http://127.0.0.1:18789?token=${CURRENT_TOKEN}"
    HELPER_URL="http://127.0.0.1:17543"
    
    echo "================================================"
    echo -e "${GREEN}🌐 Dashboard 访问地址:${NC}"
    echo ""
    echo "$DASHBOARD_URL"
    echo ""
    echo -e "${GREEN}🌐 OpenClaw Helper 访问地址:${NC}"
    echo ""
    echo "$HELPER_URL"
    echo ""
    
    # 检查 gateway 是否真的在运行
    if ! pgrep -f "openclaw.*gateway" > /dev/null 2>&1 || ! lsof -i :18789 > /dev/null 2>&1; then
        print_warning "Gateway 未正常运行,无法自动打开浏览器"
        return 1
    fi
    
    # 自动打开浏览器
    print_info "正在打开浏览器..."
    sleep 1  # 等待 1 秒确保 gateway 完全就绪
    
    local BROWSER_OPENED=false
    
    if command -v open >/dev/null 2>&1; then
        # macOS
        if open "$DASHBOARD_URL" 2>/dev/null; then
            BROWSER_OPENED=true
        fi
        open "$HELPER_URL" 2>/dev/null || true
    elif command -v xdg-open >/dev/null 2>&1; then
        # Linux
        if xdg-open "$DASHBOARD_URL" 2>/dev/null; then
            BROWSER_OPENED=true
        fi
        xdg-open "$HELPER_URL" 2>/dev/null || true
    elif command -v start >/dev/null 2>&1; then
        # Windows (Git Bash)
        if start "$DASHBOARD_URL" 2>/dev/null; then
            BROWSER_OPENED=true
        fi
        start "$HELPER_URL" 2>/dev/null || true
    fi
    
    if [ "$BROWSER_OPENED" = true ]; then
        echo -e "${GREEN}✓ 已在默认浏览器中打开 Dashboard${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ 无法自动打开浏览器,请手动复制上面的 URL 访问${NC}"
        return 1
    fi
}

# 管理 Helper 服务
manage_helper_service() {
    local MODE="${1:-production}"
    print_info "管理 OpenClaw Helper 服务 (模式: $MODE)..."
    
    local HELPER_DIR="${HOME}/openclaw-helper"
    local HELPER_PORT=17543
    
    # 检查端口占用
    if lsof -i :${HELPER_PORT} > /dev/null 2>&1; then
        print_warning "端口 ${HELPER_PORT} 已被占用,正在停止..."
        lsof -ti :${HELPER_PORT} | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
    
    if [ "$MODE" = "dev" ]; then
        print_info "启动本地开发服务..."
        # 本地开发模式,假设当前目录就是项目目录
        if [ ! -f "package.json" ]; then
            print_error "当前目录不是有效的项目目录"
            exit 1
        fi
        
        npm run dev &
        print_info "✓ 开发服务已启动"
    else
        # 生产模式,从 GitHub 拉取代码(dist 已预构建,只装运行时依赖)
        if [ -d "$HELPER_DIR" ]; then
            print_info "更新现有项目..."
            cd "$HELPER_DIR"
            git fetch --all
            git reset --hard origin/main
            npm install --omit=dev
        else
            print_info "克隆项目仓库..."
            git clone https://github.com/shunseven/openclaw-helper.git "$HELPER_DIR"
            cd "$HELPER_DIR"
            npm install --omit=dev
        fi
        
        print_info "启动生产服务..."
        nohup npm start > /tmp/openclaw-helper.log 2>&1 &
    fi
    
    # 等待服务启动
    print_info "等待 Helper 服务启动..."
    local MAX_WAIT=10
    local WAIT_COUNT=0
    local HELPER_STARTED=false
    
    while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
        sleep 1
        WAIT_COUNT=$((WAIT_COUNT + 1))
        
        if lsof -i :${HELPER_PORT} > /dev/null 2>&1; then
            HELPER_STARTED=true
            break
        fi
    done
    
    if [ "$HELPER_STARTED" = true ]; then
        print_info "✓ Helper 服务正在端口 ${HELPER_PORT} 上运行"
        print_info "✓ 访问地址: http://127.0.0.1:${HELPER_PORT}"
    else
        print_error "Helper 服务启动失败"
        print_error "查看日志: cat /tmp/openclaw-helper.log"
        return 1
    fi
}

# 主函数
main() {
    local IS_UPDATE=false
    local HELPER_MODE="production"
    local TOTAL_STEPS=13
    
    # 检查是否传入 dev 参数
    if [ "$1" = "dev" ]; then
        HELPER_MODE="dev"
        print_info "使用开发模式"
    fi
    
    # 检测是否为更新模式
    if is_update_mode; then
        IS_UPDATE=true
        TOTAL_STEPS=17
        echo "================================================"
        echo "       OpenClaw 更新脚本"
        echo "================================================"
        echo ""
        print_info "检测到已安装版本,将执行更新流程"
        echo ""
        
        # 更新模式的特殊步骤
        print_step "步骤 1/${TOTAL_STEPS}: 保存现有配置"
        save_existing_config
        echo ""
        
        print_step "步骤 2/${TOTAL_STEPS}: 停止所有 Node 进程"
        stop_all_node_processes
        echo ""
        
        print_step "步骤 3/${TOTAL_STEPS}: 清除 npm 缓存"
        clear_npm_cache
        echo ""
        
        print_step "步骤 4/${TOTAL_STEPS}: 卸载旧版本"
        uninstall_old_version
        echo ""
        
        STEP_OFFSET=4
    else
        echo "================================================"
        echo "       OpenClaw 一键安装脚本"
        echo "================================================"
        echo ""
        STEP_OFFSET=0
    fi
    
    # 共同步骤
    print_step "步骤 $((STEP_OFFSET + 1))/${TOTAL_STEPS}: 检查系统依赖"
    check_and_install_node
    check_and_install_git
    echo ""
    
    print_step "步骤 $((STEP_OFFSET + 2))/${TOTAL_STEPS}: 检查并安装 cpolar"
    check_and_install_cpolar
    echo ""
    
    print_step "步骤 $((STEP_OFFSET + 3))/${TOTAL_STEPS}: 安装 openclaw"
    install_openclaw
    echo ""
    
    print_step "步骤 $((STEP_OFFSET + 4))/${TOTAL_STEPS}: 配置 openclaw"
    configure_openclaw "$IS_UPDATE"
    echo ""
    
    print_step "步骤 $((STEP_OFFSET + 5))/${TOTAL_STEPS}: 检查并安装系统 CLI 工具"
    check_and_install_cli_tools
    echo ""
    
    print_step "步骤 $((STEP_OFFSET + 6))/${TOTAL_STEPS}: 安装 OpenClaw Skills"
    check_and_install_skills
    echo ""
    
    print_step "步骤 $((STEP_OFFSET + 7))/${TOTAL_STEPS}: 验证安装"
    verify_installation
    echo ""
    
    print_step "步骤 $((STEP_OFFSET + 8))/${TOTAL_STEPS}: 验证 Skills 状态"
    verify_skills_status
    echo ""
    
    print_step "步骤 $((STEP_OFFSET + 9))/${TOTAL_STEPS}: 启动 Gateway"
    if start_gateway; then
        echo ""
    else
        print_error "Gateway 启动失败!"
        echo ""
        print_info "故障排查建议:"
        echo "  1. 查看完整日志: cat ~/.openclaw/logs/gateway.log"
        echo "  2. 检查配置: openclaw config get agents.defaults.model"
        echo "  3. 手动启动测试: openclaw gateway run --bind loopback --port 18789"
        echo "  4. 重新运行 doctor: openclaw doctor --yes --fix"
        echo ""
        exit 1
    fi
    
    print_step "步骤 $((STEP_OFFSET + 10))/${TOTAL_STEPS}: 启动 Helper 服务"
    manage_helper_service "$HELPER_MODE"
    echo ""
    
    print_step "步骤 $((STEP_OFFSET + 11))/${TOTAL_STEPS}: 打开 Dashboard"
    open_dashboard
    echo ""
    
    print_step "步骤 $((STEP_OFFSET + 12))/${TOTAL_STEPS}: 完成"
    echo ""
    echo "================================================"
    if [ "$IS_UPDATE" = true ]; then
        echo -e "${GREEN}✓ OpenClaw 已成功更新并启动!${NC}"
    else
        echo -e "${GREEN}✓ OpenClaw 已安装、配置并启动!${NC}"
    fi
    echo "================================================"
    echo ""
    echo "常用命令:"
    echo "  - 打开 Dashboard: openclaw dashboard"
    echo "  - 查看日志: tail -f ~/.openclaw/logs/gateway.log"
    echo "  - 停止 Gateway: pkill -f 'openclaw.*gateway'"
    echo "  - 重启 Gateway: pkill -f 'openclaw.*gateway' && openclaw gateway run --bind loopback --port 18789 &"
    echo "  - 配置向导: openclaw config"
    echo "  - 查看配置: openclaw config get <path>"
    echo "  - 发送消息: openclaw message send '你好'"
    echo "  - 查看帮助: openclaw --help"
    echo ""
    echo "Helper 服务:"
    echo "  - 访问地址: http://127.0.0.1:17543"
    echo "  - 在此配置模型和 Telegram"
    echo ""
    echo "cpolar SSH 隧道:"
    echo "  - 启动 SSH 隧道: cpolar tcp 22"
    echo "  - 后台运行: nohup cpolar tcp 22 > /tmp/cpolar.log 2>&1 &"
    echo "  - 查看帮助: cpolar help"
    echo ""
    echo "Gateway 状态:"
    echo "  - 地址: http://127.0.0.1:18789"
    CURRENT_PID=$(pgrep -f 'openclaw.*gateway' || echo '')
    if [ -n "$CURRENT_PID" ]; then
        echo -e "  - PID: ${GREEN}$CURRENT_PID (运行中)${NC}"
        if lsof -i :18789 > /dev/null 2>&1; then
            echo -e "  - 端口: ${GREEN}18789 (监听中)${NC}"
        else
            echo -e "  - 端口: ${RED}18789 (未监听)${NC}"
        fi
    else
        echo -e "  - PID: ${RED}未运行${NC}"
    fi
    echo ""
    
    if [ "$IS_UPDATE" = true ]; then
        echo "🎉 更新成功!OpenClaw 已经是最新版本了!"
    else
        echo "🎉 安装成功!现在可以在浏览器中使用 OpenClaw 了!"
    fi
    echo ""
    echo ""
}

# 运行主函数
main "$@"
