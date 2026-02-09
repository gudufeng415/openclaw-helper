import { createRoute } from 'honox/factory'
import { html } from 'hono/html'

export default createRoute((c) => {
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
              <a class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" href="/">返回配置助手</a>
            </div>

            <!-- 全局提示 -->
            <div x-show="alert && alert.type === 'error'" x-cloak x-text="alert?.message" class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"></div>
            <div x-show="alert && alert.type === 'success'" x-cloak x-text="alert?.message" class="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"></div>

            <!-- ═══ 模型管理 ═══ -->
            <div x-show="tab==='models'">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">已配置模型</h4>
                <p class="mt-2 text-sm text-slate-500">下方显示当前 OpenClaw 配置的模型，点击可快速切换默认模型。</p>
                <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
                     id="model-list"
                     hx-get="/api/partials/models"
                     hx-trigger="load"
                     hx-swap="innerHTML">
                  <p class="text-sm text-slate-400">加载中...</p>
                </div>
                <div class="mt-6 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50 px-6 py-5 text-center text-sm text-slate-600">
                  <strong class="text-indigo-600">+ 添加新模型</strong>
                  <p class="mt-2 text-xs">使用下方引导完成新增</p>
                </div>
              </div>
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h4 class="text-lg font-semibold text-slate-800">新增模型指引</h4>
                <p class="mt-2 text-sm text-slate-500">返回配置助手完成 OAuth 或 API Key 登录。</p>
                <div class="mt-4">
                  <a class="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400" href="/">去配置助手</a>
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
    `,
    { title: 'OpenClaw 配置指引' }
  )
})
