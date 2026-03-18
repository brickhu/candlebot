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
      // 代理配置，解决开发环境CORS问题
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'https://candelbot-backend-dev.up.railway.app',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          secure: false, // 如果后端使用自签名证书，需要设置为false
        },
      },
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
