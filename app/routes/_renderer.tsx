import { jsxRenderer } from 'hono/jsx-renderer'

export default jsxRenderer(({ children, title }) => {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title || 'OpenClaw Helper'}</title>
        <link rel="stylesheet" href="/tailwind.css" />
        <style dangerouslySetInnerHTML={{ __html: '[x-cloak]{display:none!important}.hx-loading{display:none!important}.htmx-request.hx-loading,.htmx-request .hx-loading{display:inline-flex!important}.htmx-request>.hx-ready{display:none!important}' }} />
        <script src="https://unpkg.com/htmx.org@2.0.4" />
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/cdn.min.js" />
      </head>
      <body class="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-900 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  )
})
