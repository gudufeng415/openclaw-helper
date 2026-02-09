/**
 * 配置中心 — WhatsApp QR 码链接 Alpine.js 组件
 * 通过 Gateway WebSocket RPC 获取二维码，扫码后自动完成链接
 */
export const whatsappLinkerAlpine = `
document.addEventListener('alpine:init', () => {
  Alpine.data('whatsappLinker', () => ({
    // 状态: idle | loading | qr | success | error
    state: 'idle',
    loadingStep: '',
    qrDataUrl: '',
    errorMsg: '',
    pollCount: 0,
    maxPolls: 60,
    _pollTimer: null,

    destroy() {
      if (this._pollTimer) {
        clearTimeout(this._pollTimer);
        this._pollTimer = null;
      }
    },

    async startLinking() {
      this.state = 'loading';
      this.loadingStep = '正在注销旧会话并生成新的二维码...';
      this.errorMsg = '';
      this.qrDataUrl = '';
      this.pollCount = 0;

      try {
        this.loadingStep = '① 注销旧 WhatsApp 会话...';
        const res = await fetch('/api/config/whatsapp/link/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        this.loadingStep = '② 生成二维码中...';
        const result = await res.json();

        if (!result.success) {
          this.state = 'error';
          this.errorMsg = result.error || 'WhatsApp 链接启动失败';
          return;
        }

        if (!result.data.qrDataUrl) {
          this.state = 'error';
          this.errorMsg = '未能获取二维码，请确认 Gateway 已启动且 WhatsApp 插件已安装';
          return;
        }

        this.qrDataUrl = result.data.qrDataUrl;
        this.state = 'qr';
        // 开始轮询扫码状态
        this.pollLinkStatus();
      } catch (err) {
        this.state = 'error';
        this.errorMsg = '网络错误: ' + (err.message || '请检查网络连接');
      }
    },

    async pollLinkStatus() {
      if (this.state !== 'qr') return;
      if (this.pollCount >= this.maxPolls) {
        this.state = 'error';
        this.errorMsg = '等待超时，请重新生成二维码';
        return;
      }

      this.pollCount++;
      try {
        const res = await fetch('/api/config/whatsapp/link/poll', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        const result = await res.json();

        if (result.success && result.data.connected) {
          this.state = 'success';
          // 触发全局提示
          window.dispatchEvent(new CustomEvent('show-alert', {
            detail: { type: 'success', message: 'WhatsApp 连接成功！' }
          }));
          // 刷新渠道列表
          if (typeof htmx !== 'undefined') {
            htmx.ajax('GET', '/api/partials/channels', { target: '#channel-list', swap: 'innerHTML' });
            htmx.ajax('GET', '/api/partials/channels/available', { target: '#available-channels', swap: 'innerHTML' });
          }
          return;
        }

        // 继续轮询
        this._pollTimer = setTimeout(() => this.pollLinkStatus(), 3000);
      } catch {
        // 网络错误时继续尝试
        this._pollTimer = setTimeout(() => this.pollLinkStatus(), 5000);
      }
    },

    reset() {
      if (this._pollTimer) {
        clearTimeout(this._pollTimer);
        this._pollTimer = null;
      }
      this.state = 'idle';
      this.qrDataUrl = '';
      this.errorMsg = '';
      this.pollCount = 0;
    },

    close() {
      this.reset();
      const area = document.getElementById('channel-form-area');
      if (area) area.innerHTML = '';
    }
  }))
})
`
