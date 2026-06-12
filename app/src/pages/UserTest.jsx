import { createSignal } from 'solid-js'
import { useAuth } from '../contexts/auth'
import { api } from '../lib/api'

const UserTestPage = () => {
  const auth = useAuth()
  const [testResult, setTestResult] = createSignal('')

  const testAuth = async () => {
    const results = []

    // 1. 检查auth上下文
    results.push('=== Auth上下文检查 ===')
    results.push(`auth对象: ${auth ? '存在' : '不存在'}`)
    results.push(`用户: ${auth?.user ? JSON.stringify(auth.user(), null, 2) : '未设置'}`)
    results.push(`加载中: ${auth?.isLoading ? auth.isLoading() : 'N/A'}`)

    // 2. 检查localStorage
    results.push('\n=== localStorage检查 ===')
    const token = localStorage.getItem('auth_token')
    results.push(`auth_token: ${token ? `存在 (${token.substring(0, 20)}...)` : '不存在'}`)

    // 3. 测试API认证
    results.push('\n=== API测试 ===')
    try {
      const response = await api.getCurrentUser()
      results.push(`/auth/me 响应: ${response.success ? '成功' : '失败'}`)
      if (response.success) {
        results.push(`用户数据: ${JSON.stringify(response.data, null, 2)}`)
      } else {
        results.push(`错误: ${response.error?.message}`)
      }
    } catch (error) {
      results.push(`API错误: ${error.message}`)
    }

    setTestResult(results.join('\n'))
  }

  const clearAuth = () => {
    localStorage.removeItem('auth_token')
    api.clearToken()
    if (auth?.refreshUser) {
      auth.refreshUser()
    }
    setTestResult('已清除认证信息')
  }

  return (
    <div class="min-h-screen flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-2xl">
        <h1 class="text-3xl font-bold mb-8 text-center">用户认证测试</h1>

        <div class="bg-surface border border-border rounded-2xl p-8 mb-6">
          <div class="flex gap-4 mb-6">
            <button
              onClick={testAuth}
              class="flex-1 px-4 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              测试认证状态
            </button>
            <button
              onClick={clearAuth}
              class="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              清除认证
            </button>
          </div>

          <div>
            <h3 class="text-sm font-medium text-muted mb-2">测试结果</h3>
            <pre class="p-3 bg-bg border border-border rounded-lg font-mono text-sm overflow-auto max-h-96 whitespace-pre-wrap">
              {testResult() || '点击上方按钮测试'}
            </pre>
          </div>
        </div>

        <div class="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <h3 class="text-lg font-medium text-blue-400 mb-3">预期结果</h3>
          <ul class="space-y-2 text-sm text-muted">
            <li class="flex items-center gap-2">
              <span>✅</span>
              <span>localStorage中应有 auth_token</span>
            </li>
            <li class="flex items-center gap-2">
              <span>✅</span>
              <span>auth.user() 应返回用户对象</span>
            </li>
            <li class="flex items-center gap-2">
              <span>✅</span>
              <span>/auth/me API 应返回用户信息</span>
            </li>
            <li class="flex items-center gap-2">
              <span>ℹ️</span>
              <span>如果失败，检查后端 /auth/me 端点</span>
            </li>
          </ul>
        </div>

        <div class="mt-6 text-center">
          <a href="/dashboard" class="text-primary hover:text-primary-dark mr-4">
            前往仪表板
          </a>
          <a href={`/login?from=${encodeURIComponent(window.location.href)}`} class="text-primary hover:text-primary-dark">
            前往登录页
          </a>
        </div>
      </div>
    </div>
  )
}

export default UserTestPage