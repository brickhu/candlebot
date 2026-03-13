import { defineConfig, loadEnv } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [solid(), tailwindcss()],
    server: {
      port: 5173,
      host: true,
      // 允许通过自定义域名访问
      allowedHosts: ['local.yourdomain.com'],
    },
    // 环境变量前缀
    envPrefix: 'VITE_',
    // 构建配置
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['solid-js', '@solidjs/router'],
          },
        },
      },
    },
  }
})
