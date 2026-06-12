import { Show, createSignal, onMount } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useAuth } from '../contexts/auth'
import NewAnalysisModal from '../components/NewAnalysisModal'
import { setupExtensionReceiver } from '../lib/extension'

const NewAnalysisPage = () => {
  const auth = useAuth()
  const navigate = useNavigate()
  const [authInitialized, setAuthInitialized] = createSignal(false)
  const [showAnalysisModal, setShowAnalysisModal] = createSignal(true)

  onMount(() => {
    console.log('=== NewAnalysis页面 mounted ===')
    console.log('认证状态:', {
      hasToken: localStorage.getItem('auth_token') ? '有' : '无',
      currentPath: window.location.pathname
    })

    // 设置浏览器扩展接收器
    setupExtensionReceiver()

    // 认证检查由AuthProvider全局处理
    // 如果用户未认证，AuthProvider会自动重定向到/login
    // 如果执行到这里，说明用户已认证

    console.log('✅ 页面已加载，显示分析弹窗')
    setAuthInitialized(true)
  })

  const handleAnalysisSuccess = (recordId) => {
    console.log('✅ 分析成功，记录ID:', recordId)
    if (recordId) {
      // 跳转到分析结果页面
      navigate(`/analysis/${recordId}`)
    } else {
      // 跳转回仪表板
      navigate('/dashboard')
    }
  }

  const handleCloseModal = () => {
    console.log('🔙 关闭分析弹窗，返回仪表板')
    navigate('/dashboard')
  }

  return (
    <div class="animate-fade-in min-h-screen bg-bg">
      <Show when={!authInitialized()}>
        <div class="text-center py-20">
          <div class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-muted">检查认证状态...</p>
        </div>
      </Show>

      <Show when={authInitialized()}>
        {/* 分析弹窗 */}
        <NewAnalysisModal
          isOpen={showAnalysisModal}
          onClose={handleCloseModal}
          onSuccess={handleAnalysisSuccess}
        />

        {/* 页面背景内容（可选） */}
        <div class="fixed inset-0 bg-gradient-to-br from-bg via-surface to-bg opacity-50 -z-10"></div>

        {/* 加载状态提示 */}
        <div class="fixed bottom-6 right-6 bg-surface border border-border rounded-lg p-4 shadow-lg">
          <div class="flex items-center gap-3">
            <div class="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div class="text-sm">
              <div class="font-medium">准备分析环境</div>
              <div class="text-muted text-xs">正在加载分析工具...</div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  )
}

export default NewAnalysisPage