import { Fragment } from 'hono/jsx'

/**
 * Telegram 配置指南组件
 * @param withTokenInput - 显示 Token 输入框
 * @param alpineTokenModel - Alpine.js x-model 绑定名（如 'tgToken'），不传则用普通 input
 */
export function TelegramGuide(props: { withTokenInput?: boolean; alpineTokenModel?: string; inputName?: string; tokenPlaceholder?: string }) {
  return (
    <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h3 class="text-lg font-semibold text-slate-700">配置指南</h3>
      <div class="mt-4 space-y-6 text-sm text-slate-600">
        <div>
          <h4 class="font-semibold text-slate-700">1. 找到 BotFather</h4>
          <p class="mt-2">在 Telegram 中搜索 <strong>@BotFather</strong>,确认其名称旁边有蓝色认证标记。</p>
          <img src="/assets/image-1.png" alt="搜索 BotFather" class="mt-3 w-full max-w-lg rounded-xl" />
          <p class="mt-3">点击 <strong>Start</strong>(或输入 <code class="rounded bg-slate-200 px-2 py-1 text-xs">/start</code>)。</p>
          <img src="/assets/image-2.png" alt="启动 BotFather" class="mt-3 w-full max-w-lg rounded-xl" />
        </div>
        <div>
          <h4 class="font-semibold text-slate-700">2. 创建新机器人</h4>
          <p class="mt-2">在对话框中输入指令: <code class="rounded bg-slate-200 px-2 py-1 text-xs">/newbot</code></p>
          <img src="/assets/image-3.png" alt="创建机器人" class="mt-3 w-full max-w-lg rounded-xl" />
          <p class="mt-3"><strong>设定名称 (Name)</strong>: 这是你的机器人显示的昵称(例如: My Assistant),可以随时更改。</p>
          <img src="/assets/image-4.png" alt="设置名称" class="mt-3 w-full max-w-lg rounded-xl" />
          <p class="mt-3"><strong>设定用户名 (Username)</strong>: 这是用户搜索你的机器人时使用的唯一 ID。必须以 <code class="rounded bg-slate-200 px-2 py-1 text-xs">bot</code> 结尾(例如: my_assistant_2026_bot),且不能与他人重复。</p>
          <img src="/assets/image-5.png" alt="设置用户名" class="mt-3 w-full max-w-lg rounded-xl" />
        </div>
        <div>
          <h4 class="font-semibold text-slate-700">3. 复制 Token</h4>
          <p class="mt-2">完成上述步骤后,BotFather 会发送一条包含 <strong>HTTP API Token</strong> 的消息。</p>
          <p class="mt-2">Token 的格式通常类似于: <code class="rounded bg-slate-200 px-2 py-1 text-xs">123456789:ABCDefghIJKLmnopQRSTuvwxYZ</code></p>
          <p class="mt-2">直接点击该 Token 即可复制。</p>
          <img src="/assets/image-6.png" alt="复制 Token" class="mt-3 w-full max-w-lg rounded-xl" />
          {props.withTokenInput ? (
            <Fragment>
              <div class="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-amber-700 font-semibold">在这里输入 Token</div>
              <div class="mt-3">
                <label for="tg-token" class="mb-2 block text-sm font-medium text-slate-600">Telegram Bot Token</label>
                {props.alpineTokenModel ? (
                  <input type="text" x-model={props.alpineTokenModel} name={props.inputName} placeholder={props.tokenPlaceholder || '请输入 Bot Token'} class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                ) : (
                  <input type="text" id="tg-token" name={props.inputName} placeholder={props.tokenPlaceholder || '请输入 Bot Token'} class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                )}
              </div>
            </Fragment>
          ) : null}
        </div>
        <div>
          <h4 class="font-semibold text-slate-700">4. 绑定 TG 用户 ID</h4>
          <p class="mt-2">在 Telegram 搜索机器人 <strong>@username_to_id_bot</strong>,发送消息获取你的用户 ID。</p>
          <img src="/assets/image-7.png" alt="获取用户 ID" class="mt-3 w-full max-w-lg rounded-xl" />
        </div>
      </div>
    </div>
  )
}
