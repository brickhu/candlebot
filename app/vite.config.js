import { defineConfig, loadEnv } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite'

// 内存存储用于中转图片数据
const pendingImages = new Map()
const MAX_IMAGE_AGE = 5 * 60 * 1000 // 5分钟

// 清理过期图片的定时器
setInterval(() => {
  const now = Date.now()
  for (const [id, data] of pendingImages.entries()) {
    if (now - data.timestamp > MAX_IMAGE_AGE) {
      pendingImages.delete(id)
      console.log(`清理过期图片: ${id}`)
    }
  }
}, 60000) // 每分钟清理一次

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [solid(), tailwindcss()],
    optimizeDeps: {
      include: ['debug'],
      esbuildOptions: {
        // 确保 ES 模块兼容性
        mainFields: ['module', 'main'],
      },
    },
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
      // 自定义中间件处理本地中转API
      middlewareMode: false,
      // 添加自定义中间件
      setupMiddlewares: (middlewares, devServer) => {
        // 处理本地中转API
        devServer.middlewares.use('/api/pending-image', (req, res, next) => {
          // 设置CORS头
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

          // 处理预检请求
          if (req.method === 'OPTIONS') {
            res.statusCode = 200
            res.end()
            return
          }

          // 处理POST请求（保存图片）
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', () => {
              try {
                const data = JSON.parse(body)
                const { imageData, imageFormat = 'png', metadata = {} } = data

                if (!imageData) {
                  res.statusCode = 400
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: '缺少图片数据' }))
                  return
                }

                // 生成唯一ID
                const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

                // 保存图片数据
                pendingImages.set(id, {
                  imageData,
                  imageFormat,
                  metadata,
                  timestamp: Date.now()
                })

                console.log(`保存中转图片: ${id}, 数据长度: ${imageData.length}`)

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  success: true,
                  id,
                  message: '图片已保存'
                }))
              } catch (error) {
                console.error('处理POST请求失败:', error)
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: '无效的请求数据' }))
              }
            })
            return
          }

          // 处理GET请求（获取图片）
          if (req.method === 'GET') {
            const url = new URL(req.url, `http://${req.headers.host}`)
            const id = url.searchParams.get('id')

            if (!id) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '缺少图片ID' }))
              return
            }

            const imageData = pendingImages.get(id)
            if (!imageData) {
              res.statusCode = 404
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '图片不存在或已过期' }))
              return
            }

            // 检查是否过期
            if (Date.now() - imageData.timestamp > MAX_IMAGE_AGE) {
              pendingImages.delete(id)
              res.statusCode = 410
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: '图片已过期' }))
              return
            }

            console.log(`获取中转图片: ${id}`)

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              success: true,
              imageData: imageData.imageData,
              imageFormat: imageData.imageFormat,
              metadata: imageData.metadata,
              timestamp: imageData.timestamp
            }))
            return
          }

          // 其他方法不支持
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: '方法不支持' }))
        })

        // 继续使用其他中间件
        return middlewares
      }
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
