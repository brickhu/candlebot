// 测试上传页面 - 不需要认证
import { createSignal, onMount } from 'solid-js'
import { checkExtensionRedirect, cleanupExtensionData } from '../lib/extension'

const TestUploadPage = () => {
  const [imageData, setImageData] = createSignal(null)
  const [status, setStatus] = createSignal('检查扩展数据...')

  onMount(() => {
    console.log('=== TestUpload页面 mounted ===')
    console.log('这个页面不需要认证，用于测试扩展跳转')

    // 检查扩展数据
    const redirectInfo = checkExtensionRedirect()
    console.log('扩展跳转信息:', redirectInfo)

    if (redirectInfo.fromExtension) {
      if (redirectInfo.imageData) {
        setStatus(`✅ 收到扩展图片数据 (${redirectInfo.source})`)
        setImageData(redirectInfo.imageData)
        console.log('图片数据长度:', redirectInfo.imageData.length)

        // 清理数据
        cleanupExtensionData()
      } else {
        setStatus('⚠️ 从扩展跳转但未找到图片数据')
      }
    } else {
      setStatus('ℹ️ 不是从扩展跳转')
    }
  })

  const handleTestAuth = () => {
    console.log('=== 测试认证状态 ===')
    console.log('localStorage auth_token:', localStorage.getItem('auth_token'))
    console.log('尝试访问 /new 页面...')
    window.location.href = '/new'
  }

  return (
    <div class="min-h-screen bg-bg p-8">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-text mb-6">🔄 扩展跳转测试页面</h1>

        <div class="bg-surface border border-border rounded-lg p-6 mb-6">
          <h2 class="text-xl font-semibold text-text mb-4">测试说明</h2>
          <p class="text-muted mb-4">
            这个页面不需要登录认证，用于测试浏览器扩展的截图数据传递功能。
          </p>
          <div class="mb-4">
            <div class="text-sm font-medium text-muted mb-1">状态</div>
            <div class={`text-lg ${status().includes('✅') ? 'text-green' : status().includes('⚠️') ? 'text-yellow' : 'text-muted'}`}>
              {status()}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 图片显示区域 */}
          <div class="bg-surface border border-border rounded-lg p-6">
            <h3 class="text-lg font-semibold text-text mb-4">📸 接收到的图片</h3>
            <Show when={imageData()} fallback={
              <div class="text-center py-12">
                <div class="text-4xl mb-4">🖼️</div>
                <p class="text-muted">等待扩展发送图片数据...</p>
                <p class="text-sm text-muted mt-2">
                  请使用扩展在支持的网站上截图
                </p>
              </div>
            }>
              <div class="space-y-4">
                <div class="text-sm text-muted">
                  图片数据大小: {Math.round(imageData().length / 1024)} KB
                </div>
                <div class="border border-border rounded overflow-hidden">
                  <img
                    src={`data:image/jpeg;base64,${imageData()}`}
                    alt="扩展截图"
                    class="w-full h-auto"
                  />
                </div>
                <div class="text-xs text-muted">
                  这是从浏览器扩展接收到的截图
                </div>
              </div>
            </Show>
          </div>

          {/* 测试工具区域 */}
          <div class="bg-surface border border-border rounded-lg p-6">
            <h3 class="text-lg font-semibold text-text mb-4">🔧 测试工具</h3>

            <div class="space-y-4">
              <div class="p-4 bg-bg border border-border rounded">
                <h4 class="font-medium text-text mb-2">测试认证状态</h4>
                <p class="text-sm text-muted mb-3">
                  检查当前认证状态并尝试访问 /new 页面
                </p>
                <button
                  onClick={handleTestAuth}
                  class="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                >
                  测试 /new 页面访问
                </button>
              </div>

              <div class="p-4 bg-bg border border-border rounded">
                <h4 class="font-medium text-text mb-2">调试信息</h4>
                <div class="text-sm space-y-2">
                  <div class="flex justify-between">
                    <span class="text-muted">认证Token:</span>
                    <span class="font-mono text-xs">
                      {localStorage.getItem('auth_token') ? '存在' : '不存在'}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">当前路径:</span>
                    <span class="font-mono text-xs">{window.location.pathname}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-muted">页面标题:</span>
                    <span class="font-mono text-xs">{document.title}</span>
                  </div>
                </div>
              </div>

              <div class="p-4 bg-bg border border-border rounded">
                <h4 class="font-medium text-text mb-2">下一步操作</h4>
                <ul class="text-sm text-muted space-y-1">
                  <li>1. 使用扩展截图并跳转到此页面</li>
                  <li>2. 确认图片数据是否正确接收</li>
                  <li>3. 点击"测试 /new 页面访问"</li>
                  <li>4. 观察是否被重定向到 /login</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div class="mt-8 p-4 bg-surface border border-border rounded-lg">
          <h4 class="font-medium text-text mb-2">📋 问题诊断</h4>
          <p class="text-sm text-muted">
            如果 /new 页面被重定向到 /login，说明认证系统有问题。
            检查控制台查看详细的认证状态信息。
          </p>
        </div>
      </div>
    </div>
  )
}

// 临时添加 Show 组件
const Show = (props) => {
  return props.when ? props.children : props.fallback || null
}

export default TestUploadPage