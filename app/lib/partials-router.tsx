import { Hono } from 'hono'
import { execa } from 'execa'
import { extractJson, extractPlainValue } from './utils'
import { TelegramGuide } from '../components/TelegramGuide'
import fs from 'node:fs'
import path from 'node:path'

export const partialsRouter = new Hono()

/** 将对象序列化为纯 ASCII 的 JSON 字符串（非 ASCII 字符用 \uXXXX 转义），避免 HTTP header ByteString 报错 */
function asciiJson(obj: any): string {
  return JSON.stringify(obj).replace(/[\u0080-\uffff]/g, (ch) => {
    return '\\u' + ch.charCodeAt(0).toString(16).padStart(4, '0')
  })
}

// ─── 模型列表片段 ───

async function fetchModels() {
  // 使用 openclaw models list 获取所有可用模型（包括内置提供商如 openai-codex）
  let models: Array<{ key: string; label: string }> = []
  try {
    const { stdout: modelsRaw } = await execa('openclaw', ['models', 'list', '--json'])
    const modelsJson = extractJson(modelsRaw)
    if (modelsJson && Array.isArray(modelsJson.models)) {
      models = modelsJson.models.map((m: any) => ({
        key: m.key || 'unknown',
        label: `${m.name || m.key} (${(m.key || '').split('/')[0]})`,
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
          models.push({ key: `${providerId}/${id}`, label: `${name} (${providerId})` })
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

function ModelList(props: { models: Array<{ key: string; label: string }>; defaultModel: string | null }) {
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
      {props.models.map((model) => {
        const active = model.key === props.defaultModel
        return (
          <div class={`rounded-xl border ${active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'} p-4`}>
            <strong class="text-sm text-slate-700">{model.label}</strong>
            <div class="mt-2 text-xs text-slate-500">{model.key}</div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                class="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                hx-post="/api/partials/models/default"
                hx-vals={JSON.stringify({ model: model.key })}
                hx-target="#model-list"
                hx-swap="innerHTML"
                hx-disabled-elt="this"
              >
                <span class="hx-ready">{active ? '✓ 当前默认' : '设为默认'}</span>
                <span class="hx-loading items-center gap-1">
                  <svg class="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                  切换中…
                </span>
              </button>
            </div>
          </div>
        )
      })}
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
    // 返回更新后的列表
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

async function fetchChannels() {
  const { stdout } = await execa('openclaw', ['config', 'get', '--json', 'channels'])
  const channelsJson = extractJson(stdout) || {}
  return Object.entries(channelsJson).map(([id, value]: any) => ({
    id,
    label: id.toUpperCase(),
    enabled: value?.enabled !== false,
    config: value,
  }))
}

async function fetchChannelConfig(channelId: string) {
  try {
    const { stdout } = await execa('openclaw', ['config', 'get', '--json', `channels.${channelId}`])
    return extractJson(stdout) || {}
  } catch {
    return {}
  }
}

function ChannelList(props: { channels: Array<{ id: string; label: string; enabled: boolean }> }) {
  if (!props.channels.length) {
    return <p class="text-sm text-slate-500">暂无已配置渠道</p>
  }
  return (
    <>
      {props.channels.map((ch) => (
        <div class={`rounded-xl border p-4 ${ch.enabled ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
          <div class="flex items-center justify-between">
            <strong class="text-sm text-slate-700">{ch.label}</strong>
            <span class={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ch.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {ch.enabled ? '已启用' : '已关闭'}
            </span>
          </div>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              class="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
              hx-get={`/api/partials/channels/${ch.id}/edit`}
              hx-target="#channel-form-area"
              hx-swap="innerHTML show:#channel-form-area:top"
            >
              编辑
            </button>
            <button
              class={`rounded-lg border px-3 py-1 text-xs ${ch.enabled ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
              hx-post={`/api/partials/channels/${ch.id}/toggle`}
              hx-target="#channel-list"
              hx-swap="innerHTML"
            >
              {ch.enabled ? '关闭' : '启用'}
            </button>
          </div>
        </div>
      ))}
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
      <div class="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-6">
        <div class="flex items-center justify-between">
          <h4 class="text-lg font-semibold text-slate-800">添加 WhatsApp 渠道</h4>
          <button onclick="document.getElementById('channel-form-area').innerHTML=''" class="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">✕ 关闭</button>
        </div>
        <p class="mt-4 text-sm text-slate-500">WhatsApp 渠道配置即将推出，敬请期待。</p>
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
    const maskedToken = config.botToken ? config.botToken.substring(0, 10) + '...' : ''
    const userId = Array.isArray(config.allowFrom) ? config.allowFrom[0] || '' : ''
    const tgGuide = TelegramGuide({
      withTokenInput: true,
      inputName: 'botToken',
      tokenPlaceholder: maskedToken ? `当前: ${maskedToken} (留空保持不变)` : '请输入 Bot Token',
    })
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
            <input type="text" name="botToken" placeholder={maskedToken ? `当前: ${maskedToken} (留空保持不变)` : '请输入 Bot Token'} class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
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
    if (!userId) {
      c.header('HX-Trigger', asciiJson({ 'show-alert': { type: 'error', message: '请填写用户 ID' } }))
      const channels = await fetchChannels()
      return c.html(<ChannelList channels={channels} />)
    }
    if (botToken) {
      await execa('openclaw', ['config', 'set', '--json', 'channels.telegram.botToken', JSON.stringify(botToken)])
    }
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
    await execa('openclaw', ['config', 'set', `channels.${channelId}.enabled`, String(newEnabled)])
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
