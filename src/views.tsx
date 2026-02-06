/** @jsx jsx */
import { jsx, Fragment } from 'hono/jsx';


const wizardScript = `
let currentStep = 1;
let selectedProvider = null;
let minimaxToken = null;
let oauthWebSocket = null;

function showStep(step) {
  document.querySelectorAll('.content').forEach(el => {
    el.classList.add('hidden');
  });
  if (step === 'success') {
    const target = document.getElementById('success');
    if (target) target.classList.remove('hidden');
    for (let i = 1; i <= 2; i++) {
      const indicator = document.getElementById(\`step-indicator-\${i}\`);
      if (!indicator) continue;
      indicator.classList.remove('text-slate-300', 'text-indigo-300');
      indicator.classList.add('text-emerald-300');
      const number = indicator.querySelector('.step-number');
      if (number) {
        number.classList.remove('bg-slate-700', 'bg-indigo-500');
        number.classList.add('bg-emerald-500', 'text-white');
      }
    }
    currentStep = step;
    return;
  }
  const active = document.getElementById(\`step-\${step}\`);
  if (active) active.classList.remove('hidden');
  for (let i = 1; i <= 2; i++) {
    const indicator = document.getElementById(\`step-indicator-\${i}\`);
    if (!indicator) continue;
    const number = indicator.querySelector('.step-number');
    if (i < step) {
      indicator.classList.remove('text-slate-300', 'text-indigo-300');
      indicator.classList.add('text-emerald-300');
      if (number) {
        number.classList.remove('bg-slate-700', 'bg-indigo-500');
        number.classList.add('bg-emerald-500', 'text-white');
      }
    } else if (i === step) {
      indicator.classList.remove('text-slate-300', 'text-emerald-300');
      indicator.classList.add('text-indigo-300');
      if (number) {
        number.classList.remove('bg-slate-700', 'bg-emerald-500');
        number.classList.add('bg-indigo-500', 'text-white');
      }
    } else {
      indicator.classList.remove('text-indigo-300', 'text-emerald-300');
      indicator.classList.add('text-slate-300');
      if (number) {
        number.classList.remove('bg-indigo-500', 'bg-emerald-500');
        number.classList.add('bg-slate-700', 'text-slate-100');
      }
    }
  }
  currentStep = step;
}

function showAlert(type, message) {
  const alert = document.getElementById(type === 'error' ? 'error-alert' : 'success-alert');
  if (!alert) return;
  alert.textContent = message;
  alert.classList.remove('hidden');
  setTimeout(() => alert.classList.add('hidden'), 5000);
}

function showLoading(show) {
  const loading = document.getElementById('loading');
  if (!loading) return;
  loading.classList.toggle('hidden', !show);
  loading.classList.toggle('flex', show);
}

const providerSelect = document.getElementById('model-provider');
const minimaxTokenGroup = document.getElementById('minimax-token-group');
const minimaxTokenInput = document.getElementById('minimax-token');
const nextStep1Btn = document.getElementById('next-step-1');

function refreshProviderSelection() {
  if (!providerSelect || !minimaxTokenGroup || !nextStep1Btn) return;
  selectedProvider = providerSelect.value || null;
  if (selectedProvider === 'minimax') {
    minimaxTokenGroup.classList.remove('hidden');
    nextStep1Btn.disabled = !minimaxTokenInput?.value;
  } else {
    minimaxTokenGroup.classList.add('hidden');
    nextStep1Btn.disabled = !selectedProvider;
  }
}

if (providerSelect) {
  providerSelect.addEventListener('change', refreshProviderSelection);
  providerSelect.addEventListener('input', refreshProviderSelection);
  window.addEventListener('pageshow', refreshProviderSelection);
  setTimeout(refreshProviderSelection, 0);
  refreshProviderSelection();
}

minimaxTokenInput.addEventListener('input', (e) => {
  minimaxToken = e.target.value;
  nextStep1Btn.disabled = !minimaxToken;
});

function showOAuthTerminal(provider, options = {}) {
  const modal = document.getElementById('terminal-modal');
  const output = document.getElementById('terminal-output');
  const title = document.getElementById('terminal-title');
  const actions = document.getElementById('terminal-actions');
  const doneBtn = document.getElementById('terminal-done');
  const openBtn = document.getElementById('terminal-open');
  const isManual = !!options.manualOAuth;
  const isDevice = options.oauthMode === 'device';
  const isAuto = options.oauthMode === 'auto';

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  output.innerHTML = \`正在启动 \${provider === 'gpt' ? 'GPT' : '千问'} OAuth 登录...\\n\\n\`;
  title.textContent = \`\${provider === 'gpt' ? 'GPT' : '千问'} OAuth 登录\`;

  // GPT 自动化 OAuth 流程
  if (isAuto && provider === 'gpt') {
    actions.classList.remove('hidden');
    openBtn.style.display = 'inline-block';
    doneBtn.style.display = 'none';
    output.innerHTML = '正在启动 GPT OAuth 授权...';

    const startGptFlow = async () => {
      try {
        const response = await fetch('/api/config/gpt-oauth/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (!result.success) {
          output.innerHTML = \`\\n<div class="terminal-error">✗ \${result.error || '启动失败'}</div>\`;
          return;
        }

        const { sessionId, authUrl } = result.data;
        output.innerHTML =
          \`<div style="color: #fbbf24; font-weight: bold; margin-bottom: 12px;">⏳ 等待授权中...</div>\\n\` +
          \`请在浏览器中打开以下链接完成授权：\\n\\n\${authUrl}\\n\\n\` +
          \`<div style="color: #10b981; font-weight: bold; margin-top: 12px;">✓ 授权完成后将自动跳转到下一步</div>\`;

        // 自动打开授权页面
        window.open(authUrl, '_blank');

        openBtn.onclick = () => {
          window.open(authUrl, '_blank');
        };

        // 自动开始轮询
        const poll = async () => {
          try {
            const pollResp = await fetch('/api/config/gpt-oauth/poll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId })
            });
            const pollResult = await pollResp.json();

            if (pollResult.success && pollResult.data?.status === 'pending') {
              setTimeout(poll, 2000);
              return;
            }

            if (pollResult.success && pollResult.data?.status === 'success') {
              output.innerHTML += \`\\n<div class="terminal-success">✓ 登录成功</div>\`;
              setTimeout(() => {
                closeOAuthTerminal();
                showAlert('success', '模型配置成功!');
                setTimeout(() => showStep(2), 1000);
              }, 1000);
              return;
            }

            output.innerHTML += \`\\n<div class="terminal-error">✗ \${pollResult.error || '登录失败'}</div>\`;
          } catch (e) {
            output.innerHTML += '\\n<div class="terminal-error">✗ 轮询失败</div>';
          }
        };

        // 开始轮询
        setTimeout(poll, 2000);
      } catch (error) {
        output.innerHTML = \`\\n<div class="terminal-error">✗ 网络错误: \${error.message}</div>\`;
      }
    };

    startGptFlow();
    return;
  }

  // 千问设备码流程
  if (isDevice) {
    actions.classList.remove('hidden');
    openBtn.style.display = 'inline-block';
    doneBtn.style.display = 'none';
    output.innerHTML = '正在请求授权链接...';

    const startDeviceFlow = async () => {
      try {
        const response = await fetch('/api/config/qwen-oauth/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (!result.success) {
          output.innerHTML = \`\\n<div class="terminal-error">✗ \${result.error || '启动失败'}</div>\`;
          return;
        }

        const { sessionId, verificationUrl, userCode, interval } = result.data;
        output.innerHTML =
          \`<div style="color: #fbbf24; font-weight: bold; margin-bottom: 12px;">⏳ 等待授权中...</div>\\n\\n\` +
          \`请在浏览器打开以下链接完成授权：\\n\\n\${verificationUrl}\\n\\n\` +
          \`<div style="color: #8b5cf6; font-weight: bold; margin: 12px 0;">验证码：\${userCode}</div>\\n\\n\` +
          \`<div style="color: #10b981; font-weight: bold; margin-top: 12px;">✓ 授权完成后将自动跳转到下一步</div>\`;

        // 自动打开授权页面
        window.open(verificationUrl, '_blank');

        openBtn.onclick = () => {
          window.open(verificationUrl, '_blank');
        };

        const poll = async () => {
          try {
            const pollResp = await fetch('/api/config/qwen-oauth/poll', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sessionId })
            });
            const pollResult = await pollResp.json();

            if (pollResult.success && pollResult.data?.status === 'pending') {
              setTimeout(poll, Math.max(2000, (interval || 2) * 1000));
              return;
            }

            if (pollResult.success && pollResult.data?.status === 'success') {
              output.innerHTML += \`\\n<div class="terminal-success">✓ 登录成功</div>\`;
              setTimeout(() => {
                closeOAuthTerminal();
                showAlert('success', '模型配置成功!');
                setTimeout(() => showStep(2), 1000);
              }, 1000);
              return;
            }

            output.innerHTML += \`\\n<div class="terminal-error">✗ \${pollResult.error || '登录失败'}</div>\`;
          } catch (e) {
            output.innerHTML += '\\n<div class="terminal-error">✗ 轮询失败</div>';
          }
        };

        // 自动开始轮询
        setTimeout(poll, 2000);
      } catch (error) {
        output.innerHTML = \`\\n<div class="terminal-error">✗ 网络错误: \${error.message}</div>\`;
      }
    };

    startDeviceFlow();
    return;
  }

  if (isManual) {
    const command = options.command || '';
    output.innerHTML = \`当前环境无法创建交互式终端。\\n请在你的本地终端执行以下命令完成登录：\\n\\n\${command}\\n\\n完成后点击“已完成登录”。\`;
    actions.classList.remove('hidden');
    openBtn.style.display = 'none';
    doneBtn.onclick = () => {
      closeOAuthTerminal();
      showAlert('success', '模型配置完成，请继续下一步');
      setTimeout(() => showStep(2), 500);
    };
    return;
  }

  actions.classList.add('hidden');
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  oauthWebSocket = new WebSocket(\`\${protocol}//\${window.location.host}/ws/oauth-login\`);

  oauthWebSocket.onopen = () => {
    oauthWebSocket.send(JSON.stringify({ provider }));
  };

  oauthWebSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'output') {
      output.innerHTML += data.data;
      output.scrollTop = output.scrollHeight;
    } else if (data.type === 'success') {
      output.innerHTML += \`\\n<div class="terminal-success">✓ \${data.message}</div>\`;
      setTimeout(() => {
        closeOAuthTerminal();
        showAlert('success', '模型配置成功!');
        setTimeout(() => showStep(2), 1000);
      }, 2000);
    } else if (data.type === 'error') {
      output.innerHTML += \`\\n<div class="terminal-error">✗ \${data.message}</div>\`;
      setTimeout(() => {
        closeOAuthTerminal();
        showAlert('error', '登录失败: ' + data.message);
      }, 2000);
    }
  };

  oauthWebSocket.onerror = () => {
    output.innerHTML += '\\n<div class="terminal-error">✗ 连接错误</div>';
    setTimeout(() => {
      closeOAuthTerminal();
      showAlert('error', 'WebSocket 连接失败');
    }, 2000);
  };
};

function closeOAuthTerminal() {
  const modal = document.getElementById('terminal-modal');
  const actions = document.getElementById('terminal-actions');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
  if (actions) actions.classList.add('hidden');
  if (oauthWebSocket) {
    oauthWebSocket.close();
    oauthWebSocket = null;
  }
}

document.getElementById('terminal-close').addEventListener('click', closeOAuthTerminal);

nextStep1Btn.addEventListener('click', async () => {
  if (!selectedProvider) {
    showAlert('error', '请选择模型提供商');
    return;
  }
  if (selectedProvider === 'minimax' && !minimaxToken) {
    showAlert('error', '请输入 MiniMax API Key');
    return;
  }
  if (selectedProvider === 'gpt' || selectedProvider === 'qwen') {
    showLoading(true);
    try {
      const response = await fetch('/api/config/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider })
      });
      const result = await response.json();
      if (result.success && result.data.requiresOAuth) {
        showLoading(false);
        showOAuthTerminal(selectedProvider, result.data);
      } else if (result.success) {
        showAlert('success', '模型配置成功!');
        setTimeout(() => showStep(2), 1000);
      } else {
        showAlert('error', result.error || '配置失败');
      }
    } catch (error) {
      showAlert('error', '网络错误: ' + error.message);
    } finally {
      if (selectedProvider !== 'gpt' && selectedProvider !== 'qwen') {
        showLoading(false);
      }
    }
    return;
  }

  showLoading(true);
  try {
    const response = await fetch('/api/config/model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: selectedProvider,
        token: minimaxToken
      })
    });
    const result = await response.json();
    if (result.success) {
      showAlert('success', '模型配置成功!');
      setTimeout(() => showStep(2), 1000);
    } else {
      showAlert('error', result.error || '配置失败');
    }
  } catch (error) {
    showAlert('error', '网络错误: ' + error.message);
  } finally {
    showLoading(false);
  }
});

const tgTokenInput = document.getElementById('tg-token');
const tgUserIdInput = document.getElementById('tg-user-id');
const nextStep2Btn = document.getElementById('next-step-2');
const skipTgBtn = document.getElementById('skip-tg');

function checkTgInputs() {
  nextStep2Btn.disabled = !tgTokenInput.value || !tgUserIdInput.value;
}

tgTokenInput.addEventListener('input', checkTgInputs);
tgUserIdInput.addEventListener('input', checkTgInputs);

skipTgBtn.addEventListener('click', async () => {
  showLoading(true);
  try {
    const response = await fetch('/api/config/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skip: true })
    });
    const result = await response.json();
    if (result.success) {
      showAlert('success', '已跳过 Telegram 配置');
      setTimeout(() => showStep('success'), 1000);
    } else {
      showAlert('error', result.error || '操作失败');
    }
  } catch (error) {
    showAlert('error', '网络错误: ' + error.message);
  } finally {
    showLoading(false);
  }
});

nextStep2Btn.addEventListener('click', async () => {
  const token = tgTokenInput.value.trim();
  const userId = tgUserIdInput.value.trim();
  if (!token || !userId) {
    showAlert('error', '请填写所有必填项');
    return;
  }
  showLoading(true);
  try {
    const response = await fetch('/api/config/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId })
    });
    const result = await response.json();
    if (result.success) {
      showAlert('success', 'Telegram 配置成功!');
      setTimeout(() => showStep('success'), 1000);
    } else {
      showAlert('error', result.error || '配置失败');
    }
  } catch (error) {
    showAlert('error', '网络错误: ' + error.message);
  } finally {
    showLoading(false);
  }
});

document.getElementById('open-dashboard').addEventListener('click', async () => {
  try {
    const response = await fetch('/api/config/status');
    const result = await response.json();
    if (result.success && result.data.gatewayRunning) {
      window.open('http://127.0.0.1:18789', '_blank');
    } else {
      showAlert('error', 'Gateway 未运行,请先启动 Gateway');
    }
  } catch (error) {
    window.open('http://127.0.0.1:18789', '_blank');
  }
});

showStep(1);
`;

const configScript = `
const tabs = document.querySelectorAll('.admin-tab');
const sections = document.querySelectorAll('.config-section');

function activateTab(name) {
  tabs.forEach(tab => {
    const isActive = tab.dataset.tab === name;
    tab.classList.toggle('bg-slate-800', isActive);
    tab.classList.toggle('text-white', isActive);
    tab.classList.toggle('text-slate-300', !isActive);
  });
  sections.forEach(section => {
    const isActive = section.dataset.section === name;
    section.classList.toggle('hidden', !isActive);
  });
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => activateTab(tab.dataset.tab));
});

activateTab('models');

function showConfigAlert(type, message) {
  const alert = document.getElementById(type === 'error' ? 'error-alert' : 'success-alert');
  if (!alert) return;
  alert.textContent = message;
  alert.classList.remove('hidden');
  setTimeout(() => alert.classList.add('hidden'), 5000);
}

function showLoading(show) {
  const loading = document.getElementById('loading');
  if (!loading) return;
  loading.classList.toggle('hidden', !show);
  loading.classList.toggle('flex', show);
}

async function loadModels() {
  const container = document.getElementById('model-list');
  container.innerHTML = '';
  try {
    const response = await fetch('/api/config/models');
    const result = await response.json();
    if (!result.success) {
      container.innerHTML = '<p>无法读取模型配置</p>';
      return;
    }
    const { models, defaultModel } = result.data;
    models.forEach((model) => {
      const div = document.createElement('div');
      const active = model.key === defaultModel;
      div.className = \`rounded-xl border \${active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'} p-4\`;
      div.innerHTML = \`
        <strong class="text-sm text-slate-700">\${model.label}</strong>
        <div class="mt-2 text-xs text-slate-500">\${model.key}</div>
        <div class="mt-3 flex flex-wrap gap-2">
          <button class="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100" data-model="\${model.key}">设为默认</button>
        </div>
      \`;
      const btn = div.querySelector('button');
      btn.addEventListener('click', async () => {
        showLoading(true);
        try {
          const res = await fetch('/api/config/models/default', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: model.key })
          });
          const data = await res.json();
          if (data.success) {
            showConfigAlert('success', '已切换默认模型');
            await loadModels();
          } else {
            showConfigAlert('error', data.error || '切换失败');
          }
        } catch (err) {
          showConfigAlert('error', '切换失败');
        } finally {
          showLoading(false);
        }
      });
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = '<p>无法读取模型配置</p>';
  }
}

async function loadChannels() {
  const container = document.getElementById('channel-list');
  container.innerHTML = '';
  try {
    const response = await fetch('/api/config/channels');
    const result = await response.json();
    if (!result.success) {
      container.innerHTML = '<p>无法读取渠道配置</p>';
      return;
    }
    const { channels } = result.data;
    if (!channels.length) {
      container.innerHTML = '<p class="text-sm text-slate-500">暂无已配置渠道</p>';
      return;
    }
    channels.forEach((channel) => {
      const div = document.createElement('div');
      div.className = 'rounded-xl border border-slate-200 bg-white p-4';
      div.innerHTML = \`
        <strong class="text-sm text-slate-700">\${channel.label}</strong>
        <div class="mt-2 text-xs text-slate-500">状态: \${channel.enabled ? '已启用' : '未启用'}</div>
      \`;
      container.appendChild(div);
    });
  } catch (err) {
    container.innerHTML = '<p>无法读取渠道配置</p>';
  }
}

async function loadRemoteSupport() {
  try {
    const response = await fetch('/api/remote-support');
    const result = await response.json();
    if (!result.success) return;
    document.getElementById('ssh-key').value = result.data.sshKey || '';
    document.getElementById('cpolar-token').value = result.data.cpolarToken || '';
    document.getElementById('region-select').value = result.data.region || 'en';
    toggleRemoteButton();
  } catch {}
}

function toggleRemoteButton() {
  const sshKey = document.getElementById('ssh-key').value.trim();
  const cpolarToken = document.getElementById('cpolar-token').value.trim();
  const btn = document.getElementById('start-remote');
  btn.disabled = !(sshKey && cpolarToken);
}

document.getElementById('ssh-key').addEventListener('input', toggleRemoteButton);
document.getElementById('cpolar-token').addEventListener('input', toggleRemoteButton);

document.getElementById('save-remote').addEventListener('click', async () => {
  const sshKey = document.getElementById('ssh-key').value.trim();
  const cpolarToken = document.getElementById('cpolar-token').value.trim();
  const region = document.getElementById('region-select').value;
  showLoading(true);
  try {
    const response = await fetch('/api/remote-support', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sshKey, cpolarToken, region })
    });
    const result = await response.json();
    if (result.success) {
      showConfigAlert('success', '已保存远程支持配置');
      toggleRemoteButton();
    } else {
      showConfigAlert('error', result.error || '保存失败');
    }
  } catch {
    showConfigAlert('error', '保存失败');
  } finally {
    showLoading(false);
  }
});

document.getElementById('start-remote').addEventListener('click', async () => {
  const sshKey = document.getElementById('ssh-key').value.trim();
  const cpolarToken = document.getElementById('cpolar-token').value.trim();
  const region = document.getElementById('region-select').value;
  showLoading(true);
  try {
    const response = await fetch('/api/remote-support/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sshKey, cpolarToken, region })
    });
    const result = await response.json();
    if (result.success) {
      showConfigAlert('success', '远程支持已启动');
    } else {
      showConfigAlert('error', result.error || '启动失败');
    }
  } catch {
    showConfigAlert('error', '启动失败');
  } finally {
    showLoading(false);
  }
});

document.getElementById('add-tg').addEventListener('click', () => {
  const section = document.querySelector('[data-section="channels"]');
  const target = document.getElementById('tg-guide');
  if (section && target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
});

document.getElementById('add-whatsapp').addEventListener('click', () => {
  const target = document.getElementById('whatsapp-guide');
  if (target) target.scrollIntoView({ behavior: 'smooth' });
});

loadModels();
loadChannels();
loadRemoteSupport();
`;

function Layout(props: { title: string; children: any; script?: string }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{props.title}</title>
        <link rel="stylesheet" href="/tailwind.css" />
      </head>
      <body class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900 text-slate-100 font-sans">
        {props.children}
        <script dangerouslySetInnerHTML={{ __html: props.script || '' }} />
      </body>
    </html>
  );
}

function TelegramGuide(props: { withTokenInput?: boolean }) {
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
                <input type="text" id="tg-token" placeholder="请输入 Bot Token" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
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
  );
}

export function WizardPage() {
  return (
    <Layout title="OpenClaw 配置助手" script={wizardScript}>
      <div id="terminal-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/70">
        <div class="w-full max-w-2xl rounded-2xl bg-slate-900 text-slate-100 shadow-2xl">
          <div class="flex items-center justify-between border-b border-slate-700 px-5 py-3">
            <div class="text-sm" id="terminal-title">OAuth 登录</div>
            <button class="text-xl text-slate-400 hover:text-white" id="terminal-close">×</button>
          </div>
          <div class="max-h-[520px] overflow-y-auto px-5 py-4 font-mono text-sm">
            <div id="terminal-output" class="whitespace-pre-wrap"></div>
            <div class="mt-4 hidden flex justify-end gap-2" id="terminal-actions">
              <button class="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800" id="terminal-open">打开授权页面</button>
              <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400" id="terminal-done">已完成登录</button>
            </div>
          </div>
        </div>
      </div>

      <div class="h-screen w-full flex items-center justify-center p-6 overflow-hidden">
        <div class="w-full max-w-5xl rounded-3xl bg-white/95 p-10 shadow-2xl overflow-y-auto max-h-[calc(100vh-3rem)]">
          <div class="text-center">
            <h1 class="text-3xl font-semibold text-indigo-500">OpenClaw 配置助手</h1>
            <p class="mt-2 text-sm text-slate-500">按照步骤完成模型和 Telegram 配置</p>
          </div>

          <div class="mt-10 flex items-center justify-center gap-6 text-sm">
            <div class="flex items-center gap-3 text-indigo-300" id="step-indicator-1">
              <div class="step-number flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white">1</div>
              <span>选择模型</span>
            </div>
            <div class="h-[2px] w-12 bg-slate-200"></div>
            <div class="flex items-center gap-3 text-slate-300" id="step-indicator-2">
              <div class="step-number flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-slate-100">2</div>
              <span>配置 Telegram</span>
            </div>
          </div>

          <div class="mt-8 hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" id="error-alert"></div>
          <div class="mt-8 hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" id="success-alert"></div>
          <div class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/40" id="loading">
            <div class="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
              <div class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
              <p class="text-sm text-slate-600">正在配置中,请稍候...</p>
            </div>
          </div>

          <div class="content mt-10" id="step-1">
            <h2 class="mb-6 text-xl font-semibold text-slate-700">步骤 1: 选择模型</h2>
            <div>
              <label class="mb-2 block text-sm font-medium text-slate-600" for="model-provider">选择模型提供商</label>
              <select id="model-provider" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none">
                <option value="">-- 请选择 --</option>
                <option value="minimax">MiniMax (需要 API Key)</option>
                <option value="gpt">GPT (通过 OAuth 登录)</option>
                <option value="qwen">千问 (通过 OAuth 登录)</option>
              </select>
            </div>
            <div id="minimax-token-group" class="mt-6 hidden">
              <label class="mb-2 block text-sm font-medium text-slate-600" for="minimax-token">MiniMax API Key</label>
              <input type="text" id="minimax-token" placeholder="请输入 MiniMax API Key" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
            </div>
            <div class="mt-8 flex justify-end gap-3">
              <button class="rounded-lg bg-slate-100 px-5 py-2 text-sm text-slate-400" disabled>上一步</button>
              <button class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400" id="next-step-1" disabled>下一步</button>
            </div>
          </div>

          <div class="content mt-10 hidden" id="step-2">
            <h2 class="mb-6 text-xl font-semibold text-slate-700">步骤 2: 配置 Telegram 机器人</h2>
            <TelegramGuide withTokenInput />
            <div class="mt-6">
              <label class="mb-2 block text-sm font-medium text-slate-600" for="tg-user-id">Telegram 用户 ID</label>
              <input type="text" id="tg-user-id" placeholder="请输入用户 ID" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
            </div>
            <div class="mt-8 flex justify-end gap-3">
              <button class="rounded-lg bg-slate-100 px-5 py-2 text-sm text-slate-600 hover:bg-slate-200" id="skip-tg">跳过</button>
              <button class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400" id="next-step-2" disabled>完成配置</button>
            </div>
          </div>

          <div class="content mt-10 hidden" id="success">
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
                <button class="rounded-lg bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-400" id="open-dashboard">开始体验 OpenClaw</button>
                <a class="rounded-lg border border-slate-200 px-5 py-2 text-sm text-slate-600 hover:bg-slate-100" href="/config">更多配置指引</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export function ConfigPage() {
  return (
    <Layout title="OpenClaw 配置指引" script={configScript}>
      <div class="h-screen w-full px-6 py-10 overflow-y-auto">
        <div class="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside class="rounded-2xl bg-slate-900/80 p-6 text-slate-200 shadow-xl">
            <div class="text-sm font-semibold text-white">OpenClaw 控制台</div>
            <div class="mt-1 text-xs text-slate-400">更多配置指引</div>
            <div class="mt-6 flex flex-col gap-2">
              <button class="admin-tab rounded-lg px-3 py-2 text-left text-sm text-slate-300" data-tab="models">模型</button>
              <button class="admin-tab rounded-lg px-3 py-2 text-left text-sm text-slate-300" data-tab="channels">渠道</button>
              <button class="admin-tab rounded-lg px-3 py-2 text-left text-sm text-slate-300" data-tab="skills">技能</button>
              <button class="admin-tab rounded-lg px-3 py-2 text-left text-sm text-slate-300" data-tab="remote">远程支持</button>
            </div>
          </aside>

          <main class="rounded-2xl bg-white p-8 text-slate-700 shadow-2xl">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 class="text-2xl font-semibold text-slate-800">配置中心</h1>
                <p class="mt-1 text-sm text-slate-500">集中管理模型、渠道、技能与远程支持</p>
              </div>
              <a class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" href="/">返回配置助手</a>
            </div>

            <div class="mt-6 hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" id="error-alert"></div>
            <div class="mt-6 hidden rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" id="success-alert"></div>
            <div class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/40" id="loading">
              <div class="rounded-2xl bg-white px-6 py-5 text-center shadow-xl">
                <div class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-500"></div>
                <p class="text-sm text-slate-600">正在处理中,请稍候...</p>
              </div>
            </div>

            <div class="config-section" data-section="models">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">已配置模型</h4>
                <p class="mt-2 text-sm text-slate-500">下方显示当前 OpenClaw 配置的模型，点击可快速切换默认模型。</p>
                <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3" id="model-list"></div>
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

            <div class="config-section hidden" data-section="channels">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">已配置渠道</h4>
                <div class="mt-4 grid gap-3 md:grid-cols-2" id="channel-list"></div>
              </div>
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h4 class="text-lg font-semibold text-slate-800">新增渠道</h4>
                <p class="mt-2 text-sm text-slate-500">支持 Telegram 与 WhatsApp，点击对应按钮查看指引。</p>
                <div class="mt-4 flex flex-wrap gap-3">
                  <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400" id="add-tg">添加 Telegram</button>
                  <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" id="add-whatsapp">添加 WhatsApp</button>
                </div>
              </div>
              <div class="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6" id="tg-guide">
                <h4 class="text-lg font-semibold text-slate-800">Telegram 配置指引</h4>
                <div class="mt-4"><TelegramGuide /></div>
              </div>
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6" id="whatsapp-guide">
                <h4 class="text-lg font-semibold text-slate-800">WhatsApp 配置指引</h4>
                <p class="mt-2 text-sm text-slate-500">请先在 WhatsApp Business 平台创建应用并获取 Token，随后在 OpenClaw Dashboard 中配置。</p>
              </div>
            </div>

            <div class="config-section hidden" data-section="skills">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">预装技能说明</h4>
                <p class="mt-2 text-sm text-slate-500">install.sh 默认安装以下技能，便于快速使用常见能力。</p>
                <div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <strong>blogwatcher</strong>
                    <div class="mt-2 text-xs text-slate-500">监控博客更新并推送摘要</div>
                  </div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <strong>nano-pdf</strong>
                    <div class="mt-2 text-xs text-slate-500">快速读取与处理 PDF 内容</div>
                  </div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <strong>obsidian</strong>
                    <div class="mt-2 text-xs text-slate-500">Obsidian 笔记协作工具</div>
                  </div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <strong>gifgrep</strong>
                    <div class="mt-2 text-xs text-slate-500">快速检索 GIF 与短视频帧</div>
                  </div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <strong>model-usage</strong>
                    <div class="mt-2 text-xs text-slate-500">统计模型调用与用量</div>
                  </div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <strong>video-frames</strong>
                    <div class="mt-2 text-xs text-slate-500">提取视频关键帧</div>
                  </div>
                  <div class="rounded-xl border border-slate-200 bg-white p-4">
                    <strong>peekaboo</strong>
                    <div class="mt-2 text-xs text-slate-500">快速预览内容与格式检查</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="config-section hidden" data-section="remote">
              <div class="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h4 class="text-lg font-semibold text-slate-800">开启共享登录</h4>
                <p class="mt-2 text-sm text-slate-500">打开设置 → 通用 → 共享 → 打开“共享登录”。</p>
                <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <img src="/assets/remote-login-1.png" alt="共享登录步骤 1" class="w-full rounded-2xl border border-slate-200" />
                  <img src="/assets/remote-login-2.png" alt="共享登录步骤 2" class="w-full rounded-2xl border border-slate-200" />
                </div>
              </div>
              <div class="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
                <h4 class="text-lg font-semibold text-slate-800">远程支持配置</h4>
                <div class="mt-4">
                  <label for="ssh-key" class="mb-2 block text-sm font-medium text-slate-600">SSH Key</label>
                  <textarea id="ssh-key" rows="4" placeholder="粘贴 SSH 公钥" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"></textarea>
                </div>
                <div class="mt-4">
                  <label for="cpolar-token" class="mb-2 block text-sm font-medium text-slate-600">cpolar AuthToken</label>
                  <input type="text" id="cpolar-token" placeholder="输入 cpolar Authtoken" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none" />
                </div>
                <div class="mt-4">
                  <label for="region-select" class="mb-2 block text-sm font-medium text-slate-600">区域</label>
                  <select id="region-select" class="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none">
                    <option value="cn">中国 (cn)</option>
                    <option value="uk">美国 (uk)</option>
                    <option value="en" selected>欧洲 (en)</option>
                  </select>
                </div>
                <div class="mt-6 flex flex-wrap gap-3">
                  <button class="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100" id="save-remote">保存配置</button>
                  <button class="rounded-lg bg-indigo-500 px-4 py-2 text-sm text-white hover:bg-indigo-400 disabled:bg-slate-200 disabled:text-slate-400" id="start-remote" disabled>打开远程支持</button>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}
