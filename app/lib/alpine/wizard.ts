/**
 * Wizard 页面 Alpine.js 组件定义
 * 替代原来 ~480 行命令式 DOM 操作脚本
 */
export const wizardAlpine = `
document.addEventListener('alpine:init', () => {
  Alpine.data('wizard', () => ({
    step: 1,
    provider: '',
    minimaxToken: '',
    customBaseUrl: '',
    customApiKey: '',
    customModelId: '',
    customInputTypes: ['text'],
    customSetDefault: false,
    tgToken: '',
    tgUserId: '',
    tgLoaded: false,
    loading: false,
    alert: null,
    _alertTimer: null,
    oauth: { show: false, title: '', output: '', showOpen: false, showDone: false, openUrl: '', ws: null },

    init() {
      this.$watch('step', (val) => {
        if (val === 2) this.loadTelegramConfig();
      });
    },

    get canStep1() {
      if (this.provider === 'minimax') return !!this.minimaxToken;
      if (this.provider === 'custom') return !!this.customBaseUrl.trim() && !!this.customApiKey.trim() && !!this.customModelId.trim();
      return !!this.provider;
    },
    get canStep2() {
      return !!this.tgToken.trim() && !!this.tgUserId.trim();
    },
    get step1Class() {
      return this.step > 1 || this.step === 'success' ? 'text-emerald-300' : (this.step === 1 ? 'text-indigo-300' : 'text-slate-300');
    },
    get step1NumClass() {
      return this.step > 1 || this.step === 'success' ? 'bg-emerald-500 text-white' : (this.step === 1 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-100');
    },
    get step2Class() {
      return this.step === 'success' ? 'text-emerald-300' : (this.step === 2 ? 'text-indigo-300' : 'text-slate-300');
    },
    get step2NumClass() {
      return this.step === 'success' ? 'bg-emerald-500 text-white' : (this.step === 2 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-100');
    },

    showAlert(type, message) {
      if (this._alertTimer) clearTimeout(this._alertTimer);
      this.alert = { type, message };
      this._alertTimer = setTimeout(() => { this.alert = null; }, 5000);
    },

    closeOAuth() {
      this.oauth.show = false;
      if (this.oauth.ws) { this.oauth.ws.close(); this.oauth.ws = null; }
    },

    async submitStep1() {
      if (!this.canStep1) return;
      this.loading = true;
      try {
        const payload = { provider: this.provider, token: this.minimaxToken || undefined };
        if (this.provider === 'custom') {
          payload.custom = {
            baseUrl: this.customBaseUrl.trim(),
            apiKey: this.customApiKey.trim(),
            modelId: this.customModelId.trim(),
            inputTypes: this.customInputTypes.length > 0 ? this.customInputTypes : ['text'],
            setDefault: this.customSetDefault
          };
        }
        const res = await fetch('/api/config/model', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        this.loading = false;
        if (result.success && result.data.requiresOAuth) {
          if (result.data.oauthMode === 'auto') this.startGptOAuth();
          else if (result.data.oauthMode === 'device') this.startQwenDevice();
          else if (result.data.manualOAuth) this.showManualOAuth(result.data.command);
          else this.startWsOAuth(this.provider);
        } else if (result.success) {
          this.showAlert('success', '模型配置成功!');
          setTimeout(() => this.step = 2, 1000);
        } else {
          this.showAlert('error', result.error || '配置失败');
        }
      } catch (err) {
        this.loading = false;
        this.showAlert('error', '网络错误: ' + err.message);
      }
    },

    async startGptOAuth() {
      this.oauth = { show: true, title: 'GPT OAuth 登录', output: '正在启动 GPT OAuth 授权...', showOpen: true, showDone: false, openUrl: '', ws: null };
      try {
        const res = await fetch('/api/config/gpt-oauth/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const result = await res.json();
        if (!result.success) { this.oauth.output = '<div class="text-red-400">✗ ' + (result.error || '启动失败') + '</div>'; return; }
        const { sessionId, authUrl } = result.data;
        this.oauth.openUrl = authUrl;
        this.oauth.output = '<div style="color:#fbbf24;font-weight:bold;margin-bottom:12px">⏳ 等待授权中...</div>\\n请在浏览器中打开以下链接完成授权：\\n\\n' + authUrl + '\\n\\n<div style="color:#10b981;font-weight:bold;margin-top:12px">✓ 授权完成后将自动跳转到下一步</div>';
        window.open(authUrl, '_blank');
        this.pollOAuth('/api/config/gpt-oauth/poll', sessionId, 2000);
      } catch (err) { this.oauth.output = '<div class="text-red-400">✗ 网络错误: ' + err.message + '</div>'; }
    },

    async startQwenDevice() {
      this.oauth = { show: true, title: '千问 OAuth 登录', output: '正在请求授权链接...', showOpen: true, showDone: false, openUrl: '', ws: null };
      try {
        const res = await fetch('/api/config/qwen-oauth/start', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        const result = await res.json();
        if (!result.success) { this.oauth.output = '<div class="text-red-400">✗ ' + (result.error || '启动失败') + '</div>'; return; }
        const { sessionId, verificationUrl, userCode, interval } = result.data;
        this.oauth.openUrl = verificationUrl;
        this.oauth.output = '<div style="color:#fbbf24;font-weight:bold;margin-bottom:12px">⏳ 等待授权中...</div>\\n\\n请在浏览器打开以下链接完成授权：\\n\\n' + verificationUrl + '\\n\\n<div style="color:#8b5cf6;font-weight:bold;margin:12px 0">验证码：' + userCode + '</div>\\n\\n<div style="color:#10b981;font-weight:bold;margin-top:12px">✓ 授权完成后将自动跳转到下一步</div>';
        window.open(verificationUrl, '_blank');
        this.pollOAuth('/api/config/qwen-oauth/poll', sessionId, Math.max(2000, (interval || 2) * 1000));
      } catch (err) { this.oauth.output = '<div class="text-red-400">✗ 网络错误: ' + err.message + '</div>'; }
    },

    async pollOAuth(url, sessionId, ms) {
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) });
        const r = await res.json();
        if (r.success && r.data?.status === 'pending') { setTimeout(() => this.pollOAuth(url, sessionId, ms), ms); return; }
        if (r.success && r.data?.status === 'success') {
          this.oauth.output += '\\n<div class="text-emerald-400">✓ 登录成功</div>';
          setTimeout(() => { this.closeOAuth(); this.showAlert('success', '模型配置成功!'); setTimeout(() => this.step = 2, 1000); }, 1000);
          return;
        }
        this.oauth.output += '\\n<div class="text-red-400">✗ ' + (r.error || '登录失败') + '</div>';
      } catch { this.oauth.output += '\\n<div class="text-red-400">✗ 轮询失败</div>'; }
    },

    showManualOAuth(command) {
      this.oauth = { show: true, title: 'OAuth 登录', output: '当前环境无法创建交互式终端。\\n请在你的本地终端执行以下命令完成登录：\\n\\n' + (command || '') + '\\n\\n完成后点击"已完成登录"。', showOpen: false, showDone: true, openUrl: '', ws: null };
    },
    manualOAuthDone() {
      this.closeOAuth();
      this.showAlert('success', '模型配置完成，请继续下一步');
      setTimeout(() => this.step = 2, 500);
    },

    startWsOAuth(provider) {
      const label = provider === 'gpt' ? 'GPT' : '千问';
      this.oauth = { show: true, title: label + ' OAuth 登录', output: '正在启动 ' + label + ' OAuth 登录...\\n\\n', showOpen: false, showDone: false, openUrl: '', ws: null };
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(protocol + '//' + window.location.host + '/ws/oauth-login');
      this.oauth.ws = ws;
      ws.onopen = () => ws.send(JSON.stringify({ provider }));
      ws.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.type === 'output') this.oauth.output += d.data;
        else if (d.type === 'success') {
          this.oauth.output += '\\n<div class="text-emerald-400">✓ ' + d.message + '</div>';
          setTimeout(() => { this.closeOAuth(); this.showAlert('success', '模型配置成功!'); setTimeout(() => this.step = 2, 1000); }, 2000);
        } else if (d.type === 'error') {
          this.oauth.output += '\\n<div class="text-red-400">✗ ' + d.message + '</div>';
          setTimeout(() => { this.closeOAuth(); this.showAlert('error', '登录失败: ' + d.message); }, 2000);
        }
      };
      ws.onerror = () => {
        this.oauth.output += '\\n<div class="text-red-400">✗ 连接错误</div>';
        setTimeout(() => { this.closeOAuth(); this.showAlert('error', 'WebSocket 连接失败'); }, 2000);
      };
    },

    async loadTelegramConfig() {
      if (this.tgLoaded) return;
      this.tgLoaded = true;
      try {
        const res = await fetch('/api/config/telegram');
        const r = await res.json();
        if (r.success && r.data.configured) {
          this.tgToken = r.data.botToken || '';
          this.tgUserId = r.data.userId || '';
        }
      } catch {}
    },

    async submitStep2() {
      if (!this.tgToken.trim() || !this.tgUserId.trim()) return;
      this.loading = true;
      try {
        const res = await fetch('/api/config/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: this.tgToken.trim(), userId: this.tgUserId.trim() }) });
        const r = await res.json();
        if (r.success) { this.showAlert('success', 'Telegram 配置成功!'); setTimeout(() => this.step = 'success', 1000); }
        else this.showAlert('error', r.error || '配置失败');
      } catch (err) { this.showAlert('error', '网络错误: ' + err.message); }
      finally { this.loading = false; }
    },

    async skipTelegram() {
      this.loading = true;
      try {
        const res = await fetch('/api/config/telegram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ skip: true }) });
        const r = await res.json();
        if (r.success) { this.showAlert('success', '已跳过 Telegram 配置'); setTimeout(() => this.step = 'success', 1000); }
        else this.showAlert('error', r.error || '操作失败');
      } catch (err) { this.showAlert('error', '网络错误: ' + err.message); }
      finally { this.loading = false; }
    },

    async openDashboard() {
      try {
        const res = await fetch('/api/config/status');
        const r = await res.json();
        if (r.success && r.data.gatewayRunning) {
          let url = 'http://127.0.0.1:18789';
          if (r.data.gatewayToken) url += '?token=' + encodeURIComponent(r.data.gatewayToken);
          window.open(url, '_blank');
        } else {
          this.showAlert('error', 'Gateway 未运行,请先启动 Gateway');
        }
      } catch { window.open('http://127.0.0.1:18789', '_blank'); }
    }
  }))
})
`
