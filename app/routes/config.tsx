import { createRoute } from 'honox/factory'
import { html, raw } from 'hono/html'
import { modelAdderAlpine } from '../lib/alpine/model-adder'
import { whatsappLinkerAlpine } from '../lib/alpine/whatsapp-linker'
import { getOpenClawStatus } from '../lib/status'

export default createRoute(async (c) => {
  const status = await getOpenClawStatus()
  let openClawUrl = 'http://127.0.0.1:18789'
  if (status.gatewayToken) {
    openClawUrl += `?token=${encodeURIComponent(status.gatewayToken)}`
  }

  return c.render(
    html`
    <div x-data="{ tab: 'models', alert: null, _t: null }"
         @show-alert.window="alert = $event.detail; clearTimeout(_t); _t = setTimeout(() => alert = null, 5000)">

      <div class="h-screen w-full px-6 py-10 overflow-y-auto">
        <div class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">

          <!-- 侧边栏 -->
          <aside class="sticky top-6 h-fit rounded-3xl border border-indigo-300/30 bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 p-6 text-slate-200 shadow-2xl shadow-indigo-900/20">
            <div class="text-base font-semibold tracking-wide text-white">OpenClaw 控制台</div>
            <div class="mt-1 text-xs text-indigo-200/80">更多配置指引</div>
            <div class="mt-4 h-px bg-gradient-to-r from-indigo-400/50 to-transparent"></div>
            <div class="mt-6 flex flex-col gap-2">
              <button @click="tab='models'" :class="tab==='models' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-indigo-300/60 -translate-y-0.5' : 'text-slate-200/90 border-transparent hover:bg-slate-800/70 hover:text-white'" class="rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all">模型</button>
              <button @click="tab='channels'" :class="tab==='channels' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-indigo-300/60 -translate-y-0.5' : 'text-slate-200/90 border-transparent hover:bg-slate-800/70 hover:text-white'" class="rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all">渠道</button>
              <button @click="tab='skills'" :class="tab==='skills' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-indigo-300/60 -translate-y-0.5' : 'text-slate-200/90 border-transparent hover:bg-slate-800/70 hover:text-white'" class="rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all">技能</button>
              <button @click="tab='remote'" :class="tab==='remote' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-indigo-300/60 -translate-y-0.5' : 'text-slate-200/90 border-transparent hover:bg-slate-800/70 hover:text-white'" class="rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all">远程支持</button>
            </div>
          </aside>

          <!-- 主内容 -->
          <main class="rounded-2xl bg-white p-8 text-slate-700 shadow-2xl">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 class="text-2xl font-semibold text-slate-800">配置中心</h1>
                <p class="mt-1 text-sm text-slate-500">集中管理模型、渠道、技能与远程支持</p>
              </div>
              ${status.defaultModel && status.telegramConfigured ? html`
                <a class="rounded-lg bg-indigo-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 flex items-center gap-2" href="${openClawUrl}" target="_blank">
                  <span>打开 OpenClaw 页面</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                    <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" />
                    <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" />
                  </svg>
                </a>
              ` : html`
                <a class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" href="/">返回配置助手</a>
              `}
            </div>

            <!-- 全局提示 -->
            <div x-show="alert && alert.type === 'error'" x-cloak x-text="alert?.message" class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"></div>
            <div x-show="alert && alert.type === 'success'" x-cloak x-text="alert?.message" class="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"></div>

            <!-- ═══ 模型管理 ═══ -->
            <div x-show="tab==='models'">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">已配置模型</h4>
                <p class="mt-2 text-sm text-slate-500">下方显示当前 OpenClaw 配置的模型及其支持的输入类型，点击可快速切换默认模型。</p>
                <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                     id="model-list"
                     hx-get="/api/partials/models"
                     hx-trigger="load"
                     hx-swap="innerHTML">
                  <p class="text-sm text-slate-400">加载中...</p>
                </div>
              </div>

              <!-- 模型编辑区域 -->
              <div id="model-form-area" class="mt-6"></div>

              <!-- 新增模型 -->
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6" x-data="modelAdder">

                <!-- OAuth 弹窗 -->
                <div x-show="oauth.show" x-cloak class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70">
                  <div class="w-full max-w-2xl rounded-2xl bg-slate-900 text-slate-100 shadow-2xl">
                    <div class="flex items-center justify-between border-b border-slate-700 px-5 py-3">
                      <div class="text-sm" x-text="oauth.title"></div>
                      <button class="text-xl text-slate-400 hover:text-white" @click="closeOAuth()">×</button>
                    </div>
                    <div class="max-h-[520px] overflow-y-auto px-5 py-4 font-mono text-sm">
                      <div class="whitespace-pre-wrap" x-html="oauth.output"></div>
                      <div class="mt-4 flex justify-end gap-2">
                        <button x-show="oauth.showOpen" @click="window.open(oauth.openUrl,'_blank')" class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800">打开授权页面</button>
                        <button x-show="oauth.showDone" @click="manualOAuthDone()" class="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400">已完成登录</button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Loading -->
                <div x-show="loading" x-cloak class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">
                  <div class="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
                    <div class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
                    <p class="text-sm text-slate-600">正在配置中，请稍候...</p>
                  </div>
                </div>

                <h4 class="text-lg font-semibold text-slate-800">新增模型</h4>
                <p class="mt-2 text-sm text-slate-500">选择提供商，通过 OAuth 登录或填写 API Key 添加模型。</p>

                <div class="mt-4">
                  <label class="mb-2 block text-sm font-medium text-slate-600">选择模型提供商</label>
                  <select x-model="provider" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none">
                    <option value="">-- 请选择 --</option>
                    <option value="minimax">MiniMax (需要 API Key)</option>
                    <option value="gpt">GPT (通过 ChatGPT OAuth 登录)</option>
                    <option value="qwen">千问 (通过 OAuth 登录)</option>
                    <option value="custom">第三方模型 (OpenAI 兼容 API)</option>
                  </select>
                </div>

                <div x-show="provider === 'minimax'" x-cloak class="mt-4">
                  <label class="mb-2 block text-sm font-medium text-slate-600">MiniMax API Key</label>
                  <input type="text" x-model="minimaxToken" placeholder="请输入 MiniMax API Key" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                </div>

                <!-- 第三方模型表单 -->
                <div x-show="provider === 'custom'" x-cloak class="mt-4 space-y-4">
                  <div class="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                    <p class="text-sm text-blue-700">支持任何兼容 OpenAI Chat Completions API 的第三方服务，例如 Gemini、Moonshot、DeepSeek 等。</p>
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-600">API Base URL <span class="text-red-400">*</span></label>
                    <input type="text" x-model="customBaseUrl" placeholder="例如：https://gptproto.com/v1" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-600">API Key <span class="text-red-400">*</span></label>
                    <input type="password" x-model="customApiKey" placeholder="请输入 API Key" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-600">模型 ID <span class="text-red-400">*</span></label>
                    <input type="text" x-model="customModelId" placeholder="例如：gemini-3-pro-preview、deepseek-chat" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                  </div>
                  <div>
                    <label class="mb-2 block text-sm font-medium text-slate-600">支持的输入类型</label>
                    <div class="flex flex-wrap gap-4 mt-2">
                      <label class="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" value="text" x-model="customInputTypes" class="rounded" /> 文本</label>
                      <label class="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" value="image" x-model="customInputTypes" class="rounded" /> 图片</label>
                      <label class="flex items-center gap-1.5 text-sm text-slate-600"><input type="checkbox" value="audio" x-model="customInputTypes" class="rounded" /> 音频</label>
                    </div>
                  </div>
                  <div>
                    <label class="flex items-center gap-2 text-sm text-slate-600">
                      <input type="checkbox" x-model="customSetDefault" class="rounded" />
                      设为默认模型
                    </label>
                  </div>

                  <!-- Claude 模型切换提示 -->
                  <div x-show="customModelId && customModelId.toLowerCase().includes('claude')" x-cloak x-transition
                       class="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-4">
                    <div class="flex items-start gap-2.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="mt-0.5 h-5 w-5 shrink-0 text-amber-500">
                        <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
                      </svg>
                      <div class="flex-1">
                        <p class="text-sm font-semibold text-amber-800">Claude 模型切换提醒</p>
                        <p class="mt-1.5 text-sm text-amber-700">第一次切换到 Claude 模型后，需要在 OpenClaw 聊天界面中点击 <strong class="font-semibold">"New Session"</strong> 按钮才能正常运行。</p>
                        <div class="mt-2 rounded-lg border border-amber-300/60 bg-amber-100/60 px-3 py-2">
                          <p class="text-xs text-amber-600"><strong>注意：</strong>点击 New Session 会创建新的会话，之前的聊天记录将不会在新会话中显示。如有重要信息，请提前保存。</p>
                        </div>
                        <img src="/assets/claude-new-session-tip.png" alt="点击 New Session 按钮示意图" class="mt-3 w-full max-w-2xl rounded-lg border border-amber-200 shadow-sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-6 flex justify-end">
                  <button @click="submitModel()" :disabled="!canSubmit" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400">添加模型</button>
                </div>
              </div>
            </div>

            <!-- ═══ 渠道管理 ═══ -->
            <div x-show="tab==='channels'" x-cloak>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">已配置渠道</h4>
                <p class="mt-2 text-sm text-slate-500">管理已配置的消息渠道，支持编辑和启用/关闭。</p>
                <div class="mt-4 grid gap-3 md:grid-cols-2"
                     id="channel-list"
                     hx-get="/api/partials/channels"
                     hx-trigger="intersect once"
                     hx-swap="innerHTML">
                  <p class="text-sm text-slate-400">加载中...</p>
                </div>
              </div>
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h4 class="text-lg font-semibold text-slate-800">新增渠道</h4>
                <p class="mt-2 text-sm text-slate-500">选择要添加的渠道类型，点击对应按钮开始配置。</p>
                <div id="available-channels"
                     hx-get="/api/partials/channels/available"
                     hx-trigger="intersect once"
                     hx-swap="innerHTML">
                  <p class="mt-4 text-sm text-slate-400">加载中...</p>
                </div>
              </div>
              <div id="channel-form-area" class="mt-6"></div>
            </div>

            <!-- ═══ 技能管理 ═══ -->
            <div x-show="tab==='skills'" x-cloak>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">预装技能说明</h4>
                <p class="mt-2 text-sm text-slate-500">install.sh 默认安装以下技能，便于快速使用常见能力。</p>
                <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>blogwatcher</strong><div class="mt-2 text-xs text-slate-500">监控博客更新并推送摘要</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>nano-pdf</strong><div class="mt-2 text-xs text-slate-500">快速读取与处理 PDF 内容</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>obsidian</strong><div class="mt-2 text-xs text-slate-500">Obsidian 笔记协作工具</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>gifgrep</strong><div class="mt-2 text-xs text-slate-500">快速检索 GIF 与短视频帧</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>model-usage</strong><div class="mt-2 text-xs text-slate-500">统计模型调用与用量</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>video-frames</strong><div class="mt-2 text-xs text-slate-500">提取视频关键帧</div></div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4"><strong>peekaboo</strong><div class="mt-2 text-xs text-slate-500">快速预览内容与格式检查</div></div>
                </div>
              </div>

              <!-- Web 搜索配置 -->
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6"
                x-data="{
                  braveApiKey: '',
                  loading: false,
                  guideOpen: false,
                  configured: false,
                  editing: false,
                  maskedKey: '',
                  fetching: true,
                  init() {
                    fetch('/api/config/web-search')
                      .then(r => r.json())
                      .then(data => {
                        if (data.success && data.data) {
                          this.configured = data.data.configured;
                          if (data.data.apiKey) {
                            this.braveApiKey = data.data.apiKey;
                            const k = data.data.apiKey;
                            this.maskedKey = k.length > 8 ? k.substring(0, 4) + '****' + k.substring(k.length - 4) : '****';
                          }
                        }
                      })
                      .catch(() => {})
                      .finally(() => { this.fetching = false });
                  },
                  submitKey() {
                    if (!this.braveApiKey.trim()) return;
                    this.loading = true;
                    fetch('/api/config/web-search', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ apiKey: this.braveApiKey.trim() })
                    })
                    .then(r => r.json())
                    .then(data => {
                      if (data.success) {
                        $dispatch('show-alert', { type: 'success', message: 'Web 搜索配置成功！网关已重启。' });
                        const k = this.braveApiKey.trim();
                        this.maskedKey = k.length > 8 ? k.substring(0, 4) + '****' + k.substring(k.length - 4) : '****';
                        this.configured = true;
                        this.editing = false;
                      } else {
                        $dispatch('show-alert', { type: 'error', message: data.error || '配置失败' });
                      }
                    })
                    .catch(() => {
                      $dispatch('show-alert', { type: 'error', message: '请求失败，请检查网络后重试' });
                    })
                    .finally(() => { this.loading = false });
                  }
                }">

                <!-- 加载中 -->
                <div x-show="fetching" class="flex items-center gap-2 text-sm text-slate-400">
                  <div class="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500"></div>
                  加载配置中...
                </div>

                <div x-show="!fetching" x-cloak>
                  <!-- 标题区 -->
                  <div class="flex items-center gap-3">
                    <div class="flex h-10 w-10 items-center justify-center rounded-xl" :class="configured ? 'bg-emerald-100' : 'bg-indigo-100'">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" :class="configured ? 'text-emerald-600' : 'text-indigo-600'">
                        <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
                      </svg>
                    </div>
                    <div class="flex-1">
                      <h4 class="text-lg font-semibold text-slate-800">Web 搜索功能</h4>
                      <p class="mt-0.5 text-sm text-slate-500">配置 Brave Search API 以启用 Web 搜索和网页抓取能力</p>
                    </div>
                  </div>

                  <!-- ══ 已配置状态 ══ -->
                  <div x-show="configured && !editing" class="mt-5">
                    <div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 text-emerald-600">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.06l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
                          </svg>
                          <span class="text-sm font-medium text-emerald-700">Web 搜索功能已开启</span>
                        </div>
                        <button @click="editing = true" class="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors">
                          编辑
                        </button>
                      </div>
                      <div class="mt-2 flex items-center gap-2 text-sm text-emerald-600">
                        <span class="text-slate-500">Brave Search API Key:</span>
                        <code class="rounded bg-emerald-100 px-2 py-0.5 text-xs font-mono" x-text="maskedKey"></code>
                      </div>
                    </div>
                  </div>

                  <!-- ══ 编辑/首次配置模式 ══ -->
                  <div x-show="!configured || editing">

                    <!-- 编辑模式返回按钮 -->
                    <div x-show="configured && editing" class="mt-4">
                      <button @click="editing = false" class="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                          <path fill-rule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clip-rule="evenodd" />
                        </svg>
                        取消编辑
                      </button>
                    </div>

                    <!-- 展开/收起指引 -->
                    <button @click="guideOpen = !guideOpen" class="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 transition-transform" :class="guideOpen && 'rotate-90'">
                        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                      </svg>
                      <span x-text="guideOpen ? '收起配置指引' : '查看配置指引'"></span>
                    </button>

                    <!-- 配置指引内容 -->
                    <div x-show="guideOpen" x-cloak x-transition class="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-5">
                      <h5 class="text-base font-semibold text-slate-700">第一步：获取 Brave Search API Key</h5>
                      <ol class="mt-3 space-y-3 text-sm text-slate-600">
                        <li class="flex gap-2">
                          <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">1</span>
                          <div>
                            <strong>登录 Brave 官网</strong>
                            <p class="mt-0.5 text-slate-500">打开 <a href="https://brave.com/search/api/" target="_blank" class="text-indigo-600 underline hover:text-indigo-500">https://brave.com/search/api</a>，点击右上角登录。如果没有账号先注册，按网站流程提示注册/登录。</p>
                            <img src="/assets/brave-step1-login.png" alt="Brave Search API 登录页面" class="mt-2 w-full max-w-2xl rounded-lg border border-slate-200 shadow-sm" />
                          </div>
                        </li>
                        <li class="flex gap-2">
                          <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">2</span>
                          <div>
                            <strong>选择方案</strong>
                            <p class="mt-0.5 text-slate-500">登录后点击左侧菜单栏的 "Available plans"，按需选择方案。如果 Web 搜索不是很高频，免费方案就够用了。</p>
                            <img src="/assets/brave-step2-plans.png" alt="选择 Brave Search 方案" class="mt-2 w-full max-w-2xl rounded-lg border border-slate-200 shadow-sm" />
                          </div>
                        </li>
                        <li class="flex gap-2">
                          <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">3</span>
                          <div>
                            <strong>支付</strong>
                            <p class="mt-0.5 text-slate-500">填写支付信息，提交支付。（免费方案也需要填写支付信息）</p>
                            <img src="/assets/brave-step3-payment.png" alt="填写支付信息" class="mt-2 w-full max-w-md rounded-lg border border-slate-200 shadow-sm" />
                          </div>
                        </li>
                        <li class="flex gap-2">
                          <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-600">4</span>
                          <div>
                            <strong>创建 API Key</strong>
                            <p class="mt-0.5 text-slate-500">点击左侧菜单栏中的 "API keys"；点击 "Add API key"，在弹出的框中填写 name 后提交；点击创建的 key 后面的复制按钮。</p>
                            <img src="/assets/brave-step4-apikey.png" alt="创建并复制 API Key" class="mt-2 w-full max-w-2xl rounded-lg border border-slate-200 shadow-sm" />
                          </div>
                        </li>
                      </ol>

                      <div class="mt-5 border-t border-slate-200 pt-4">
                        <h5 class="text-base font-semibold text-slate-700">第二步：在下方输入 API Key 并确认</h5>
                        <p class="mt-1 text-sm text-slate-500">将复制的 API Key 粘贴到下方输入框中，点击"确认配置"即可自动完成 Web 搜索和网页抓取的配置，并重启网关使其生效。</p>
                      </div>
                    </div>

                    <!-- API Key 输入 -->
                    <div class="mt-5">
                      <label class="mb-2 block text-sm font-medium text-slate-600">Brave Search API Key <span class="text-red-400">*</span></label>
                      <input type="password" x-model="braveApiKey" placeholder="请输入 Brave Search API Key（以 BSA 开头）" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                    </div>

                    <!-- 确认按钮 -->
                    <div class="mt-6 flex items-center justify-between">
                      <p class="text-xs text-slate-400" x-show="loading">正在配置中，网关将自动重启...</p>
                      <div class="ml-auto flex items-center gap-2">
                        <button x-show="configured && editing" @click="editing = false" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">取消</button>
                        <button
                          @click="submitKey()"
                          :disabled="!braveApiKey.trim() || loading"
                          class="rounded-lg bg-indigo-500 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400 transition-colors"
                        >
                          <span x-show="!loading">确认配置</span>
                          <span x-show="loading" x-cloak class="flex items-center gap-2">
                            <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            配置中...
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ═══ 远程支持 ═══ -->
            <div x-show="tab==='remote'" x-cloak>
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">开启共享登录</h4>
                <p class="mt-2 text-sm text-slate-500">打开设置 → 通用 → 共享 → 打开"共享登录"。</p>
                <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <img src="/assets/remote-login-1.png" alt="共享登录步骤 1" class="w-full rounded-2xl border border-slate-200" />
                  <img src="/assets/remote-login-2.png" alt="共享登录步骤 2" class="w-full rounded-2xl border border-slate-200" />
                </div>
              </div>
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h4 class="text-lg font-semibold text-slate-800">远程支持配置</h4>
                <div hx-get="/api/partials/remote-support/form"
                     hx-trigger="intersect once"
                     hx-swap="innerHTML">
                  <p class="mt-4 text-sm text-slate-400">加载中...</p>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
    <script>${raw(modelAdderAlpine)}</script>
    <script>${raw(whatsappLinkerAlpine)}</script>
    `,
    { title: 'OpenClaw 配置指引' }
  )
})
