import { Hono } from 'hono'
import { execa } from 'execa'
import { extractJson, extractPlainValue } from './utils'
import { TelegramGuide } from '../components/TelegramGuide'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export const partialsRouter = new Hono()

/** 将对象序列化为纯 ASCII 的 JSON 字符串（非 ASCII 字符用 \uXXXX 转义），避免 HTTP header ByteString 报错 */
function asciiJson(obj: any): string {
  return JSON.stringify(obj).replace(/[\u0080-\uffff]/g, (ch) => {
    return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')
  })
}

// ─── 模型列表片段 ───

type ModelInfo = { key: string; label: string; input: string[] }

/** 将 input 字段统一为 string[]，兼容数组、"text+image" 字符串、纯字符串等格式 */
function parseInput(raw: any): string[] {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) return raw.split('+').map((s: string) => s.trim()).filter(Boolean)
  return ['text']
}

async function fetchModels() {
  // 使用 openclaw models list 获取所有可用模型（包括内置提供商如 openai-codex）
  let models: ModelInfo[] = []
  try {
    const { stdout: modelsRaw } = await execa('openclaw', ['models', 'list', '--json'])
    const modelsJson = extractJson(modelsRaw)
    if (modelsJson && Array.isArray(modelsJson.models)) {
      models = modelsJson.models.map((m: any) => ({
        key: m.key || 'unknown',
        label: `${m.name || m.key} (${(m.key || '').split('/')[0]})`,
        input: parseInput(m.input),
      }))
    }
  } catch {
    // 降级：从 models.providers 配置读取
    try {
      const { stdout: providersRaw } = await execa('openclaw', ['config', 'get', '--json', 'models.providers'])
      const providersJson = extractJson(providersRaw) || {}
      Object.entries(providersJson).forEach(([providerId, provider]: any) => {
        const list = Array.isArray(provider?.models) ? provider.models : []
        list.forEach((model: any) => {
          const id = model?.id || model?.name || 'unknown'
          const name = model?.name || model?.id || id
          models.push({
            key: `${providerId}/${id}`,
            label: `${name} (${providerId})`,
            input: parseInput(model?.input),
          })
        })
      })
    } catch {}
  }

  let defaultModel: string | null = null
  try {
    const { stdout } = await execa('openclaw', ['config', 'get', 'agents.defaults.model.primary'])
    defaultModel = extractPlainValue(stdout) || null
  } catch {
    defaultModel = null
  }

  return { models, defaultModel }
}

const INPUT_LABELS: Record<string, string> = {
  text: '文本',
  image: '图片',
  audio: '音频',
  video: '视频',
}

function ModelCard(props: { model: ModelInfo; isDefault: boolean }) {
  return (
    <div class={`rounded-xl border ${props.isDefault ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'} p-4`}>
      <strong class="text-sm text-slate-700">{props.model.label}</strong>
      <div class="mt-1.5 text-xs text-slate-500">{props.model.key}</div>
      <div class="mt-2 flex flex-wrap gap-1">
        {props.model.input.map((t) => (
          <span class="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            {INPUT_LABELS[t] || t}
          </span>
        ))}
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button
          class="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
          hx-post="/api/partials/models/default"
          hx-vals={JSON.stringify({ model: props.model.key })}
          hx-target="#model-list"
          hx-swap="innerHTML"
          hx-disabled-elt="this"
        >
          <span class="hx-ready">{props.isDefault ? '✓ 当前默认' : '设为默认'}</span>
          <span class="hx-loading items-center gap-1">
            <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
            切换中…
          </span>
        </button>
      </div>
    </div>
  )
}

function ModelList(props: { models: ModelInfo[]; defaultModel: string | null }) {
  if (!props.models.length) {
    return <p class="text-sm text-slate-500">暂无已配置模型</p>
  }
  const defaultLabel = props.defaultModel
    ? props.models.find((m) => m.key === props.defaultModel)?.label || props.defaultModel
    : null
  return (
    <>
      <div class="col-span-full mb-1 rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
        <span class="text-sm text-slate-600">当前默认模型：</span>
        {defaultLabel
          ? <strong class="text-sm text-indigo-700">{defaultLabel}</strong>
          : <span class="text-sm text-slate-400">未设置</span>
        }
      </div>
      {props.models.map((model) => (
        <ModelCard model={model} isDefault={model.key === props.defaultModel} />
      ))}
    </>
  )
}

partialsRouter.get('/models', async (c) => {
  try {
    const { models, defaultModel } = await fetchModels()
    return c.html(<ModelList models={models} defaultModel={defaultModel} />)
  } catch {
    return c.html(<p class="text-sm text-red-500">无法读取模型配置</p>)
  }
})

partialsRouter.post('/models/default', async (c) => {
  const body = await c.req.parseBody()
  const model = body.model as string
  if (!model) return c.html(<p class="text-sm text-red-500">缺少模型参数</p>, 400)
  try {
    await execa('openclaw', ['config', 'set', '--json', 'agents.defaults.model', JSON.stringify({ primary: model })])
    const { models, defaultModel } = await fetchModels()
    c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'success', message: '已切换默认模型' } }))
    return c.html(<ModelList models={models} defaultModel={defaultModel} />)
  } catch (err: any) {
    c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'error', message: '切换失败: ' + err.message } }))
    try {
      const { models, defaultModel } = await fetchModels()
      return c.html(<ModelList models={models} defaultModel={defaultModel} />)
    } catch {
      return c.html(<p class="text-sm text-red-500">切换失败</p>, 500)
    }
  }
})

// ─── 渠道管理 ───

const ALL_CHANNELS = [
  { id: 'telegram', label: 'Telegram', description: '通过 Telegram 机器人接收和发送消息' },
  { id: 'whatsapp', label: 'WhatsApp', description: '通过 WhatsApp Business 接收和发送消息' },
]

/** 判断渠道是否启用（不同渠道 schema 不同） */
function isChannelEnabled(id: string, value: any): boolean {
  if (id === 'whatsapp') {
    // WhatsApp 用 accounts.<accountId>.enabled 控制
    const accounts = value?.accounts || {}
    const ids = Object.keys(accounts)
    if (ids.length === 0) return false
    return ids.some((aid) => accounts[aid]?.enabled !== false)
  }
  // 其他渠道（Telegram 等）直接用顶层 enabled
  return value?.enabled !== false
}

/** 检查 WhatsApp 是否已经通过 QR 码完成链接（凭据目录是否有文件） */
function isWhatsAppLinked(accountId = 'default'): boolean {
  try {
    const home = os.homedir()
    const credDir = path.join(home, '.openclaw', 'credentials', 'whatsapp', accountId)
    if (!fs.existsSync(credDir)) return false
    const files = fs.readdirSync(credDir).filter((f) => !f.startsWith('.'))
    return files.length > 0
  } catch {
    return false
  }
}

async function fetchChannels() {
  const { stdout } = await execa('openclaw', ['config', 'get', '--json', 'channels'])
  const channelsJson = extractJson(stdout) || {}
  return Object.entries(channelsJson).map(([id, value]: any) => {
    const enabled = isChannelEnabled(id, value)
    // WhatsApp 额外检查是否已完成扫码链接
    const linked = id === 'whatsapp' ? isWhatsAppLinked() : undefined
    return { id, label: id.toUpperCase(), enabled, linked, config: value }
  })
}

async function fetchChannelConfig(channelId: string) {
  try {
    const { stdout } = await execa('openclaw', ['config', 'get', '--json', `channels.${channelId}`])
    return extractJson(stdout) || {}
  } catch {
    return {}
  }
}

/** 获取渠道的显示状态信息 */
function getChannelStatus(ch: { id: string; enabled: boolean; linked?: boolean }) {
  if (ch.id === 'whatsapp') {
    if (!ch.linked) return { text: '未链接', badgeCls: 'bg-amber-100 text-amber-700', cardCls: 'border-amber-200 bg-amber-50/50' }
    if (ch.enabled) return { text: '已链接', badgeCls: 'bg-emerald-100 text-emerald-700', cardCls: 'border-emerald-200 bg-emerald-50' }
    return { text: '已关闭', badgeCls: 'bg-slate-100 text-slate-500', cardCls: 'border-slate-200 bg-white' }
  }
  if (ch.enabled) return { text: '已启用', badgeCls: 'bg-emerald-100 text-emerald-700', cardCls: 'border-emerald-200 bg-emerald-50' }
  return { text: '已关闭', badgeCls: 'bg-slate-100 text-slate-500', cardCls: 'border-slate-200 bg-white' }
}

function ChannelList(props: { channels: Array<{ id: string; label: string; enabled: boolean; linked?: boolean }> }) {
  if (!props.channels.length) {
    return <p class="text-sm text-slate-500">暂无已配置渠道</p>
  }
  return (
    <>
      {props.channels.map((ch) => {
        const status = getChannelStatus(ch)
        const isWhatsAppUnlinked = ch.id === 'whatsapp' && !ch.linked
        return (
          <div class={`rounded-xl border p-4 ${status.cardCls}`}>
            <div class="flex items-center justify-between">
              <strong class="text-sm text-slate-700">{ch.label}</strong>
              <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.badgeCls}`}>
                {status.text}
              </span>
            </div>
            {isWhatsAppUnlinked && (
              <p class="mt-2 text-xs text-amber-600">尚未扫描二维码完成链接，请点击下方「添加 WhatsApp」开始配置。</p>
            )}
            <div class="mt-3 flex flex-wrap gap-2">
              {!isWhatsAppUnlinked && (
                <button
                  class="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
                  hx-get={`/api/partials/channels/${ch.id}/edit`}
                  hx-target="#channel-form-area"
                  hx-swap="innerHTML show:#channel-form-area:top"
                >
                  编辑
                </button>
              )}
              {isWhatsAppUnlinked ? (
                <button
                  class="rounded-lg border border-emerald-200 px-3 py-1 text-xs text-emerald-600 hover:bg-emerald-50"
                  hx-get="/api/partials/channels/add/whatsapp"
                  hx-target="#channel-form-area"
                  hx-swap="innerHTML show:#channel-form-area:top"
                >
                  扫码链接
                </button>
              ) : (
                <button
                  class={`rounded-lg border px-3 py-1 text-xs ${ch.enabled ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                  hx-post={`/api/partials/channels/${ch.id}/toggle`}
                  hx-target="#channel-list"
                  hx-swap="innerHTML"
                  hx-disabled-elt="this"
                >
                  <span class="hx-ready">{ch.enabled ? '关闭' : '启用'}</span>
                  <span class="hx-loading items-center gap-1">
                    <svg class="animate-spin h-3 w-3 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                    处理中…
                  </span>
                </button>
              )}
            </div>
          </div>
        )
      })}
    </>
  )
}

function AvailableChannelButtons(props: { available: Array<{ id: string; label: string; description: string }> }) {
  if (!props.available.length) {
    return <p class="mt-4 text-sm text-slate-500">所有支持的渠道均已配置</p>
  }
  return (
    <div class="mt-4 flex flex-wrap gap-3">
      {props.available.map((ch) => (
        <button
          class="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400"
          hx-get={`/api/partials/channels/add/${ch.id}`}
          hx-target="#channel-form-area"
          hx-swap="innerHTML show:#channel-form-area:top"
        >
          添加 {ch.label}
        </button>
      ))}
    </div>
  )
}

// 已配置渠道列表
partialsRouter.get('/channels', async (c) => {
  try {
    const channels = await fetchChannels()
    return c.html(<ChannelList channels={channels} />)
  } catch {
    return c.html(<p class="text-sm text-red-500">无法读取渠道配置</p>)
  }
})

// 可用（未配置）渠道列表
partialsRouter.get('/channels/available', async (c) => {
  try {
    const configured = await fetchChannels()
    const configuredIds = new Set(configured.map((ch) => ch.id))
    const available = ALL_CHANNELS.filter((ch) => !configuredIds.has(ch.id))
    return c.html(<AvailableChannelButtons available={available} />)
  } catch {
    return c.html(<p class="text-sm text-red-500">无法获取可用渠道</p>)
  }
})

// 添加渠道表单
partialsRouter.get('/channels/add/:type', async (c) => {
  const type = c.req.param('type')
  if (type === 'telegram') {
    const tgGuide = TelegramGuide({ withTokenInput: true, inputName: 'botToken' })
    return c.html(
      <div class="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6">
        <div class="flex items-center justify-between">
          <h4 class="text-lg font-semibold text-slate-800">添加 Telegram 渠道</h4>
          <button onclick="document.getElementById('channel-form-area').innerHTML=''" class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">✕ 关闭</button>
        </div>
        <form class="mt-4" hx-post="/api/partials/channels/add/telegram" hx-target="#channel-list" hx-swap="innerHTML">
          <div>{tgGuide}</div>
          <div class="mt-6">
            <label class="mb-2 block text-sm font-medium text-slate-600">Telegram 用户 ID</label>
            <input type="text" name="userId" placeholder="请输入用户 ID" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" onclick="document.getElementById('channel-form-area').innerHTML=''" class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100">取消</button>
            <button type="submit" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400">添加渠道</button>
          </div>
        </form>
      </div>
    )
  }
  if (type === 'whatsapp') {
    return c.html(
      <div class="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6" x-data="whatsappLinker">
        <div class="flex items-center justify-between">
          <h4 class="text-lg font-semibold text-slate-800">添加 WhatsApp 渠道</h4>
          <button x-on:click="close()" class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">✕ 关闭</button>
        </div>

        {/* ── 初始状态：显示说明和开始按钮 ── */}
        <div x-show="state === 'idle'" class="mt-4">
          <p class="text-sm text-slate-600">通过扫描二维码将 WhatsApp 连接到 OpenClaw。</p>
          <div class="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <p class="text-sm text-amber-700 font-medium">准备工作</p>
            <ul class="mt-1.5 text-sm text-amber-600 list-disc list-inside space-y-1">
              <li>确保 OpenClaw Gateway 已启动运行</li>
              <li>准备好你的手机，打开 WhatsApp</li>
              <li>建议使用备用手机号 + eSIM 注册 WhatsApp</li>
            </ul>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" x-on:click="close()" class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100">取消</button>
            <button type="button" x-on:click="startLinking()" class="rounded-lg bg-emerald-500 px-5 py-2 text-sm text-white hover:bg-emerald-400">开始连接 WhatsApp</button>
          </div>
        </div>

        {/* ── 加载状态：注销旧会话 + 生成 QR ── */}
        <div x-show="state === 'loading'" x-cloak class="mt-6 flex flex-col items-center py-8">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
          <p class="mt-4 text-sm text-slate-600 font-medium" x-text="loadingStep"></p>
          <p class="mt-1 text-xs text-slate-400">整个过程可能需要 10-30 秒</p>
        </div>

        {/* ── QR 码显示状态 ── */}
        <div x-show="state === 'qr'" x-cloak class="mt-4">
          <div class="flex flex-col items-center">
            <div class="rounded-2xl bg-white p-4 shadow-lg">
              <img x-bind:src="qrDataUrl" alt="WhatsApp QR Code" class="h-64 w-64" />
            </div>
            <div class="mt-4 text-center">
              <p class="text-sm font-medium text-slate-700">请使用手机扫描上方二维码</p>
              <p class="mt-1 text-xs text-slate-500">WhatsApp → 设置 → 已关联的设备 → 关联设备</p>
            </div>
            <div class="mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5">
              <div class="h-2 w-2 animate-pulse rounded-full bg-indigo-500"></div>
              <span class="text-sm text-indigo-600">等待扫码中...</span>
            </div>
          </div>
          <div class="mt-6 flex justify-center gap-3">
            <button type="button" x-on:click="startLinking()" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">刷新二维码</button>
            <button type="button" x-on:click="close()" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">取消</button>
          </div>
        </div>

        {/* ── 成功状态 ── */}
        <div x-show="state === 'success'" x-cloak class="mt-6 flex flex-col items-center py-8">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg class="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <p class="mt-4 text-lg font-semibold text-emerald-700">WhatsApp 连接成功！</p>
          <p class="mt-1 text-sm text-slate-500">你的 WhatsApp 已链接到 OpenClaw</p>
          <button type="button" x-on:click="close()" class="mt-6 rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400">完成</button>
        </div>

        {/* ── 错误状态 ── */}
        <div x-show="state === 'error'" x-cloak class="mt-4">
          <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p class="text-sm font-medium text-red-700">连接失败</p>
            <p class="mt-1 text-sm text-red-600" x-text="errorMsg"></p>
          </div>
          <div class="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p class="text-xs font-medium text-slate-600">排查建议</p>
            <ul class="mt-1 text-xs text-slate-500 list-disc list-inside space-y-0.5">
              <li>确认 Gateway 已启动：<code class="bg-slate-200 px-1 rounded">pgrep -f 'openclaw.*gateway'</code></li>
              <li>确认 WhatsApp 渠道插件已安装</li>
              <li>查看 Gateway 日志：<code class="bg-slate-200 px-1 rounded">tail -f ~/.openclaw/logs/gateway.log</code></li>
            </ul>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" x-on:click="close()" class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100">取消</button>
            <button type="button" x-on:click="startLinking()" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400">重试</button>
          </div>
        </div>
      </div>
    )
  }
  return c.html(<p class="text-sm text-red-500">不支持的渠道类型</p>, 400)
})

// 提交添加 Telegram
partialsRouter.post('/channels/add/telegram', async (c) => {
  try {
    const body = await c.req.parseBody()
    const botToken = (body.botToken as string || '').trim()
    const userId = (body.userId as string || '').trim()
    if (!botToken || !userId) {
      c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'error', message: '请填写 Bot Token 和用户 ID' } }))
      const channels = await fetchChannels()
      return c.html(<ChannelList channels={channels} />)
    }
    await execa('openclaw', ['config', 'set', '--json', 'channels.telegram.botToken', JSON.stringify(botToken)])
    await execa('openclaw', ['config', 'set', '--json', 'channels.telegram.allowFrom', JSON.stringify([userId])])
    // 重启 gateway
    try { await execa('pkill', ['-f', 'openclaw.*gateway']); await new Promise((r) => setTimeout(r, 2000)) } catch {}
    const logFile = `${process.env.HOME}/.openclaw/logs/gateway.log`
    execa('sh', ['-c', `nohup openclaw gateway run --bind loopback --port 18789 > ${logFile} 2>&1 &`])
    await new Promise((r) => setTimeout(r, 3000))

    const channels = await fetchChannels()
    const configuredIds = new Set(channels.map((ch) => ch.id))
    const available = ALL_CHANNELS.filter((ch) => !configuredIds.has(ch.id))
    c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'success', message: 'Telegram 渠道配置成功！' } }))
    return c.html(
      <>
        <ChannelList channels={channels} />
        <div id="channel-form-area" hx-swap-oob="innerHTML"></div>
        <div id="available-channels" hx-swap-oob="innerHTML"><AvailableChannelButtons available={available} /></div>
      </>
    )
  } catch (err: any) {
    c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'error', message: '配置失败: ' + err.message } }))
    try {
      const channels = await fetchChannels()
      return c.html(<ChannelList channels={channels} />)
    } catch {
      return c.html(<p class="text-sm text-red-500">配置失败</p>, 500)
    }
  }
})

// 编辑渠道表单
partialsRouter.get('/channels/:id/edit', async (c) => {
  const channelId = c.req.param('id')
  if (channelId === 'telegram') {
    const config = await fetchChannelConfig('telegram')
    const botToken = config.botToken || ''
    const userId = Array.isArray(config.allowFrom) ? config.allowFrom[0] || '' : ''
    const tgGuide = TelegramGuide({ withTokenInput: false })
    return c.html(
      <div class="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6">
        <div class="flex items-center justify-between">
          <h4 class="text-lg font-semibold text-slate-800">编辑 Telegram 渠道</h4>
          <button onclick="document.getElementById('channel-form-area').innerHTML=''" class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">✕ 关闭</button>
        </div>
        <form class="mt-4" hx-post="/api/partials/channels/telegram/save" hx-target="#channel-list" hx-swap="innerHTML">
          <details class="mt-2">
            <summary class="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-500">查看配置指南</summary>
            <div class="mt-2">{tgGuide}</div>
          </details>
          <div class="mt-6">
            <label class="mb-2 block text-sm font-medium text-slate-600">Telegram Bot Token</label>
            <input type="text" name="botToken" value={botToken} placeholder="请输入 Bot Token" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
          </div>
          <div class="mt-4">
            <label class="mb-2 block text-sm font-medium text-slate-600">Telegram 用户 ID</label>
            <input type="text" name="userId" value={userId} placeholder="请输入用户 ID" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" onclick="document.getElementById('channel-form-area').innerHTML=''" class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100">取消</button>
            <button type="submit" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400">保存修改</button>
          </div>
        </form>
      </div>
    )
  }
  if (channelId === 'whatsapp') {
    const config = await fetchChannelConfig('whatsapp')
    const linked = isWhatsAppLinked()
    return c.html(
      <div class="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6" x-data="whatsappLinker">
        <div class="flex items-center justify-between">
          <h4 class="text-lg font-semibold text-slate-800">WhatsApp 渠道管理</h4>
          <button x-on:click="close()" class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">✕ 关闭</button>
        </div>

        {/* 当前状态信息 */}
        <div class="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-slate-600">链接状态</span>
            <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${linked ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {linked ? '已链接' : '未链接'}
            </span>
          </div>
          {config.dmPolicy && (
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm text-slate-600">DM 策略</span>
              <span class="text-sm text-slate-800">{config.dmPolicy}</span>
            </div>
          )}
          {Array.isArray(config.allowFrom) && config.allowFrom.length > 0 && (
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm text-slate-600">允许号码</span>
              <span class="text-sm text-slate-800">{config.allowFrom.join(', ')}</span>
            </div>
          )}
        </div>

        {/* ── 初始状态：显示重新链接按钮 ── */}
        <div x-show="state === 'idle'" class="mt-4">
          <p class="text-sm text-slate-500">{linked ? '如需更换手机号或重新绑定，可点击下方按钮生成新的二维码。' : '尚未完成链接，请扫描二维码绑定 WhatsApp。'}</p>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" x-on:click="close()" class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100">取消</button>
            <button type="button" x-on:click="startLinking()" class="rounded-lg bg-emerald-500 px-5 py-2 text-sm text-white hover:bg-emerald-400">{linked ? '重新链接' : '扫码链接'}</button>
          </div>
        </div>

        {/* ── 加载状态 ── */}
        <div x-show="state === 'loading'" x-cloak class="mt-6 flex flex-col items-center py-8">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
          <p class="mt-4 text-sm text-slate-600 font-medium" x-text="loadingStep"></p>
          <p class="mt-1 text-xs text-slate-400">整个过程可能需要 10-30 秒</p>
        </div>

        {/* ── QR 码显示 ── */}
        <div x-show="state === 'qr'" x-cloak class="mt-4">
          <div class="flex flex-col items-center">
            <div class="rounded-2xl bg-white p-4 shadow-lg">
              <img x-bind:src="qrDataUrl" alt="WhatsApp QR Code" class="h-64 w-64" />
            </div>
            <div class="mt-4 text-center">
              <p class="text-sm font-medium text-slate-700">请使用手机扫描上方二维码</p>
              <p class="mt-1 text-xs text-slate-500">WhatsApp → 设置 → 已关联的设备 → 关联设备</p>
            </div>
            <div class="mt-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2.5">
              <div class="h-2 w-2 animate-pulse rounded-full bg-indigo-500"></div>
              <span class="text-sm text-indigo-600">等待扫码中...</span>
            </div>
          </div>
          <div class="mt-6 flex justify-center gap-3">
            <button type="button" x-on:click="startLinking()" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">刷新二维码</button>
            <button type="button" x-on:click="close()" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">取消</button>
          </div>
        </div>

        {/* ── 成功 ── */}
        <div x-show="state === 'success'" x-cloak class="mt-6 flex flex-col items-center py-8">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <svg class="h-8 w-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <p class="mt-4 text-lg font-semibold text-emerald-700">WhatsApp 链接成功！</p>
          <p class="mt-1 text-sm text-slate-500">你的 WhatsApp 已链接到 OpenClaw</p>
          <button type="button" x-on:click="close()" class="mt-6 rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400">完成</button>
        </div>

        {/* ── 错误 ── */}
        <div x-show="state === 'error'" x-cloak class="mt-4">
          <div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p class="text-sm font-medium text-red-700">连接失败</p>
            <p class="mt-1 text-sm text-red-600" x-text="errorMsg"></p>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" x-on:click="close()" class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100">取消</button>
            <button type="button" x-on:click="startLinking()" class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400">重试</button>
          </div>
        </div>
      </div>
    )
  }
  return c.html(<p class="text-sm text-red-500">不支持编辑此渠道</p>, 400)
})

// 保存渠道编辑
partialsRouter.post('/channels/:id/save', async (c) => {
  const channelId = c.req.param('id')
  if (channelId !== 'telegram') {
    return c.html(<p class="text-sm text-red-500">不支持编辑此渠道</p>, 400)
  }
  try {
    const body = await c.req.parseBody()
    const botToken = (body.botToken as string || '').trim()
    const userId = (body.userId as string || '').trim()
    if (!botToken || !userId) {
      c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'error', message: '请填写 Bot Token 和用户 ID' } }))
      const channels = await fetchChannels()
      return c.html(<ChannelList channels={channels} />)
    }
    await execa('openclaw', ['config', 'set', '--json', 'channels.telegram.botToken', JSON.stringify(botToken)])
    await execa('openclaw', ['config', 'set', '--json', 'channels.telegram.allowFrom', JSON.stringify([userId])])
    // 重启 gateway
    try { await execa('pkill', ['-f', 'openclaw.*gateway']); await new Promise((r) => setTimeout(r, 2000)) } catch {}
    const logFile = `${process.env.HOME}/.openclaw/logs/gateway.log`
    execa('sh', ['-c', `nohup openclaw gateway run --bind loopback --port 18789 > ${logFile} 2>&1 &`])
    await new Promise((r) => setTimeout(r, 3000))

    const channels = await fetchChannels()
    c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'success', message: 'Telegram 渠道已更新' } }))
    return c.html(
      <>
        <ChannelList channels={channels} />
        <div id="channel-form-area" hx-swap-oob="innerHTML"></div>
      </>
    )
  } catch (err: any) {
    c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'error', message: '保存失败: ' + err.message } }))
    try {
      const channels = await fetchChannels()
      return c.html(<ChannelList channels={channels} />)
    } catch {
      return c.html(<p class="text-sm text-red-500">保存失败</p>, 500)
    }
  }
})

// 切换渠道启用/关闭
partialsRouter.post('/channels/:id/toggle', async (c) => {
  const channelId = c.req.param('id')
  try {
    const channels = await fetchChannels()
    const channel = channels.find((ch) => ch.id === channelId)
    if (!channel) {
      c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'error', message: '渠道不存在' } }))
      return c.html(<ChannelList channels={channels} />)
    }
    const newEnabled = !channel.enabled
    if (channelId === 'whatsapp') {
      // WhatsApp 用 accounts.<accountId>.enabled 控制
      const accounts = channel.config?.accounts || {}
      const accountIds = Object.keys(accounts)
      const targetAccount = accountIds.length > 0 ? accountIds[0] : 'default'
      await execa('openclaw', ['config', 'set', '--json', `channels.whatsapp.accounts.${targetAccount}.enabled`, String(newEnabled)])
    } else {
      await execa('openclaw', ['config', 'set', `channels.${channelId}.enabled`, String(newEnabled)])
    }
    // 重启 gateway
    try { await execa('pkill', ['-f', 'openclaw.*gateway']); await new Promise((r) => setTimeout(r, 2000)) } catch {}
    const logFile = `${process.env.HOME}/.openclaw/logs/gateway.log`
    execa('sh', ['-c', `nohup openclaw gateway run --bind loopback --port 18789 > ${logFile} 2>&1 &`])
    await new Promise((r) => setTimeout(r, 3000))

    const updatedChannels = await fetchChannels()
    c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'success', message: `${channel.label} 已${newEnabled ? '启用' : '关闭'}` } }))
    return c.html(<ChannelList channels={updatedChannels} />)
  } catch (err: any) {
    c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'error', message: '操作失败: ' + err.message } }))
    try {
      const channels = await fetchChannels()
      return c.html(<ChannelList channels={channels} />)
    } catch {
      return c.html(<p class="text-sm text-red-500">操作失败</p>, 500)
    }
  }
})

// ─── 远程支持表单片段 ───

function resolveRemoteSupportPath() {
  const home = process.env.HOME || process.cwd()
  return path.join(home, '.openclaw-helper', 'remote-support.json')
}

partialsRouter.get('/remote-support/form', async (c) => {
  let data = { sshKey: '', cpolarToken: '', region: 'en' }
  try {
    const filePath = resolveRemoteSupportPath()
    if (fs.existsSync(filePath)) {
      data = { ...data, ...JSON.parse(fs.readFileSync(filePath, 'utf-8')) }
    }
  } catch {}
  const alpineInit = JSON.stringify({ sshKey: data.sshKey || '', cpolarToken: data.cpolarToken || '', region: data.region || 'en' })
  return c.html(
    <form x-data={alpineInit} id="remote-form-inner">
      <div class="mt-4">
        <label for="ssh-key" class="mb-2 block text-sm font-medium text-slate-600">SSH Key</label>
        <textarea id="ssh-key" name="sshKey" rows={4} x-model="sshKey" placeholder="粘贴 SSH 公钥" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"></textarea>
      </div>
      <div class="mt-4">
        <label for="cpolar-token" class="mb-2 block text-sm font-medium text-slate-600">cpolar AuthToken</label>
        <input type="text" id="cpolar-token" name="cpolarToken" x-model="cpolarToken" placeholder="输入 cpolar Authtoken" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
      </div>
      <div class="mt-4">
        <label for="region-select" class="mb-2 block text-sm font-medium text-slate-600">区域</label>
        <select id="region-select" name="region" x-model="region" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none">
          <option value="cn">中国 (cn)</option>
          <option value="uk">美国 (uk)</option>
          <option value="en">欧洲 (en)</option>
        </select>
      </div>
      <div class="mt-6 flex flex-wrap gap-3" id="remote-alert"></div>
      <div class="mt-4 flex flex-wrap gap-3">
        <button type="button" hx-post="/api/partials/remote-support/save" hx-include="#remote-form-inner" hx-target="#remote-alert" hx-swap="innerHTML" class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">保存配置</button>
        <button type="button" hx-post="/api/partials/remote-support/start" hx-include="#remote-form-inner" hx-target="#remote-alert" hx-swap="innerHTML" x-bind="{ disabled: !sshKey.trim() || !cpolarToken.trim() }" class="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400">打开远程支持</button>
      </div>
    </form>
  )
})

partialsRouter.post('/remote-support/save', async (c) => {
  try {
    const body = await c.req.parseBody()
    const filePath = resolveRemoteSupportPath()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify({ sshKey: body.sshKey || '', cpolarToken: body.cpolarToken || '', region: body.region || 'en' }, null, 2))
    return c.html(<div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">已保存远程支持配置</div>)
  } catch (err: any) {
    return c.html(<div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">保存失败: {err.message}</div>)
  }
})

partialsRouter.post('/remote-support/start', async (c) => {
  try {
    const body = await c.req.parseBody()
    const sshKey = (body.sshKey as string || '').trim()
    const cpolarToken = (body.cpolarToken as string || '').trim()
    const region = (body.region as string || 'en')
    if (!sshKey || !cpolarToken) {
      return c.html(<div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">请填写 SSH Key 和 cpolar AuthToken</div>)
    }
    // 先保存
    const filePath = resolveRemoteSupportPath()
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify({ sshKey, cpolarToken, region }, null, 2))
    // 启动
    const mappedRegion = region === 'en' ? 'eu' : region
    await execa('cpolar', ['authtoken', cpolarToken])
    await execa('sh', ['-c', `nohup cpolar tcp -region=${mappedRegion} 22 > ${process.env.HOME}/.openclaw/logs/cpolar.log 2>&1 &`])
    return c.html(<div class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">远程支持已启动</div>)
  } catch (err: any) {
    return c.html(<div class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">启动失败: {err.message}</div>)
  }
})
