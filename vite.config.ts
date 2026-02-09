import honox from 'honox/vite'
import build from '@hono/vite-build/node'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  if (mode === 'client') {
    return {
      plugins: [honox.client()],
    }
  }
  return {
    plugins: [
      honox(),
      build({
        entry: './app/server.ts',
        port: 17543,
      }),
    ],
    server: {
      port: 17543,
    },
    ssr: {
      external: ['node-pty', 'ws', 'execa'],
    },
  }
})
