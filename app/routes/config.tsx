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
          <aside class="rounded-2xl bg-slate-900/80 p-6 text-slate-200 shadow-xl">
            <div class="text-sm font-semibold text-white">OpenClaw 控制台</div>
            <div class="mt-1 text-xs text-slate-400">更多配置指引</div>
            <div class="mt-6 flex flex-col gap-2">
              <button @click="tab='models'" :class="tab==='models' ? 'bg-slate-800 text-white' : 'text-slate-300'" class="rounded-lg px-3 py-2 text-left text-sm">模型</button>
              <button @click="tab='channels'" :class="tab==='channels' ? 'bg-slate-800 text-white' : 'text-slate-300'" class="rounded-lg px-3 py-2 text-left text-sm">渠道</button>
              <button @click="tab='skills'" :class="tab==='skills' ? 'bg-slate-800 text-white' : 'text-slate-300'" class="rounded-lg px-3 py-2 text-left text-sm">技能</button>
              <button @click="tab='remote'" :class="tab==='remote' ? 'bg-slate-800 text-white' : 'text-slate-300'" class="rounded-lg px-3 py-2 text-left text-sm">远程支持</button>
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
