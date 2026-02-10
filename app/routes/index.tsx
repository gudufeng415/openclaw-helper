import { createRoute } from 'honox/factory'
import { html, raw } from 'hono/html'
import { TelegramGuide } from '../components/TelegramGuide'
import { wizardAlpine } from '../lib/alpine/wizard'
import { getOpenClawStatus } from '../lib/status'

export default createRoute(async (c) => {
  // 如果已经配置了模型和 Telegram，直接跳转到配置页
  const status = await getOpenClawStatus()
  if (status.defaultModel && status.telegramConfigured) {
    return c.redirect('/config')
  }

  const tgGuide = TelegramGuide({ withTokenInput: true, alpineTokenModel: 'tgToken' })

  return c.render(
    html`
    <div x-data="wizard">

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

      <div class="h-screen w-full flex items-center justify-center p-6 overflow-hidden">
        <div class="w-full max-w-5xl rounded-3xl bg-white/95 p-10 shadow-2xl overflow-y-auto max-h-[calc(100vh-3rem)]">

          <!-- 标题 -->
          <div class="text-center">
            <h1 class="text-3xl font-semibold text-indigo-500">OpenClaw 配置助手</h1>
            <p class="mt-2 text-sm text-slate-500">按照步骤完成模型和 Telegram 配置</p>
          </div>

          <!-- 步骤指示器 -->
          <div class="mt-10 flex items-center justify-center gap-6 text-sm">
            <div class="flex items-center gap-3" :class="step1Class">
              <div class="flex h-10 w-10 items-center justify-center rounded-full" :class="step1NumClass">1</div>
              <span>选择模型</span>
            </div>
            <div class="h-[2px] w-12 bg-slate-200"></div>
            <div class="flex items-center gap-3" :class="step2Class">
              <div class="flex h-10 w-10 items-center justify-center rounded-full" :class="step2NumClass">2</div>
              <span>配置 Telegram</span>
            </div>
          </div>

          <!-- 提示 -->
          <div x-show="alert && alert.type === 'error'" x-cloak x-text="alert?.message" class="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"></div>
          <div x-show="alert && alert.type === 'success'" x-cloak x-text="alert?.message" class="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"></div>

          <!-- Loading -->
          <div x-show="loading" x-cloak class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40">
            <div class="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
              <div class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
              <p class="text-sm text-slate-600">正在配置中,请稍候...</p>
            </div>
          </div>

          <!-- 步骤 1: 选择模型 -->
          <div x-show="step === 1" class="mt-10">
            <h2 class="mb-6 text-xl font-semibold text-slate-700">步骤 1: 选择模型</h2>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-600">选择模型提供商</label>
              <select x-model="provider" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none">
                <option value="">-- 请选择 --</option>
                <option value="minimax">MiniMax (需要 API Key)</option>
                <option value="gpt">GPT (通过 OAuth 登录)</option>
                <option value="qwen">千问 (通过 OAuth 登录)</option>
                <option value="custom">第三方模型 (OpenAI 兼容 API)</option>
              </select>
            </div>
            <div x-show="provider === 'minimax'" x-cloak class="mt-6">
              <label class="mb-2 block text-sm font-medium text-slate-600">MiniMax API Key</label>
              <input type="text" x-model="minimaxToken" placeholder="请输入 MiniMax API Key" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
            </div>
            <!-- 第三方模型表单 -->
            <div x-show="provider === 'custom'" x-cloak class="mt-6 space-y-4">
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
            <div class="mt-8 flex justify-end">
              <button @click="submitStep1()" :disabled="!canStep1" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400">下一步</button>
            </div>
          </div>

          <!-- 步骤 2: 配置 Telegram -->
          <div x-show="step === 2" x-cloak class="mt-10">
            <h2 class="mb-6 text-xl font-semibold text-slate-700">步骤 2: 配置 Telegram 机器人</h2>
            ${tgGuide}
            <div class="mt-6">
              <label class="mb-2 block text-sm font-medium text-slate-600">Telegram 用户 ID</label>
              <input type="text" x-model="tgUserId" placeholder="请输入用户 ID" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
            </div>
            <div class="mt-8 flex justify-between gap-3">
              <button @click="step = 1" class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100">上一步</button>
              <div class="flex gap-3">
                <button @click="skipTelegram()" class="rounded-lg bg-slate-100 px-5 py-2 text-sm text-slate-600 hover:bg-slate-200">跳过</button>
                <button @click="submitStep2()" :disabled="!tgToken.trim() || !tgUserId.trim()" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400">完成配置</button>
              </div>
            </div>
          </div>

          <!-- 配置完成 -->
          <div x-show="step === 'success'" x-cloak class="mt-10">
            <div class="text-center">
              <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-3xl text-white">✓</div>
              <h2 class="mt-4 text-2xl font-semibold text-slate-700">配置完成!</h2>
              <p class="mt-2 text-sm text-slate-500">OpenClaw 已成功配置并启动。</p>
              <p class="mt-3 text-sm font-semibold text-slate-600">现在可以打开 OpenClaw 页面，并在 Telegram 里向机器人发送消息测试。</p>
              <div class="mx-auto mt-6 max-w-md text-left text-sm text-slate-500">
                <p class="mb-2">✓ 打开 OpenClaw Dashboard 开始使用</p>
                <p class="mb-2">✓ 在 Telegram 中向您的机器人发送消息测试</p>
                <p>✓ 查看日志: <code class="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">tail -f ~/.openclaw/logs/gateway.log</code></p>
              </div>
              <div class="mt-6 flex flex-wrap justify-center gap-3">
                <button @click="openDashboard()" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400">开始体验 OpenClaw</button>
                <a class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100" href="/config">更多配置指引</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <script>${raw(wizardAlpine)}</script>
    `,
    { title: 'OpenClaw 配置助手' }
  )
})
