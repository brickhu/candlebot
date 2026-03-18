import { createSignal, onMount } from 'solid-js'
import { api } from '../lib/api'

const TestProxyPage = () => {
  const [testResult, setTestResult] = createSignal('')
  const [isLoading, setIsLoading] = createSignal(false)

  const testApiConnection = async () => {
    setIsLoading(true)
    setTestResult('')

    try {
      // 测试0: 检查token状态
      setTestResult(prev => prev + '=== 测试0: 检查认证状态 ===\n')
      const token = localStorage.getItem('auth_token')
      setTestResult(prev => prev + `localStorage auth_token: ${token ? `存在 (${token.substring(0, 30)}...)` : '不存在'}\n`)
      setTestResult(prev => prev + `api.token: ${api.token ? `存在 (${api.token.substring(0, 30)}...)` : '不存在'}\n`)
      setTestResult(prev => prev + `api.isAuthenticated(): ${api.isAuthenticated() ? '是' : '否'}\n`)

      // 测试1: 检查API基础连接
      setTestResult(prev => prev + '\n=== 测试1: API基础连接 ===\n')
      const testUrl = '/auth/me'
      setTestResult(prev => prev + `请求URL: ${testUrl}\n`)
      setTestResult(prev => prev + `API_BASE_URL: ${api.baseUrl}\n`)
      setTestResult(prev => prev + `环境: ${import.meta.env.DEV ? '开发' : '生产'}\n`)

      // 测试2: 尝试调用API
      setTestResult(prev => prev + '\n=== 测试2: 调用/auth/me端点 ===\n')
      const response = await api.getCurrentUser()
      setTestResult(prev => prev + `响应状态: ${response.success ? '成功' : '失败'}\n`)

      if (response.success) {
        setTestResult(prev => prev + `响应数据: ${JSON.stringify(response.data, null, 2)}\n`)
      } else {
        setTestResult(prev => prev + `错误: ${response.error?.message || '未知错误'}\n`)
        setTestResult(prev => prev + `错误代码: ${response.error?.code || 'N/A'}\n`)
        setTestResult(prev => prev + `HTTP状态码: ${response.error?.status || 'N/A'}\n`)
      }

      // 测试3: 检查CORS头
      setTestResult(prev => prev + '\n=== 测试3: 手动测试fetch ===\n')
      try {
        const directResponse = await fetch('/api/auth/me', {
          headers: {
            'Content-Type': 'application/json',
          }
        })
        setTestResult(prev => prev + `直接fetch状态: ${directResponse.status}\n`)
        setTestResult(prev => prev + `CORS头: ${directResponse.headers.get('Access-Control-Allow-Origin') || '未设置'}\n`)
      } catch (error) {
        setTestResult(prev => prev + `直接fetch错误: ${error.message}\n`)
      }

    } catch (error) {
      setTestResult(prev => prev + `\n❌ 测试过程中发生错误: ${error.message}\n`)
      console.error('测试错误:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('auth_token')
    api.clearToken()
    setTestResult('已清除localStorage中的auth_token')
  }

  onMount(() => {
    testApiConnection()
  })

  return (
    <div class="min-h-screen flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-2xl">
        <h1 class="text-3xl font-bold mb-8 text-center">API代理测试</h1>

        <div class="bg-surface border border-border rounded-2xl p-8 mb-6">
          <div class="flex gap-4 mb-6">
            <button
              onClick={testApiConnection}
              disabled={isLoading()}
              class="flex-1 px-4 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {isLoading() ? '测试中...' : '重新测试API连接'}
            </button>
            <button
              onClick={clearLocalStorage}
              class="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
            >
              清除认证
            </button>
          </div>

          <div>
            <h3 class="text-sm font-medium text-muted mb-2">测试结果</h3>
            <pre class="p-3 bg-bg border border-border rounded-lg font-mono text-sm overflow-auto max-h-96 whitespace-pre-wrap">
              {testResult() || '正在测试...'}
            </pre>
          </div>
        </div>

        <div class="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
          <h3 class="text-lg font-medium text-blue-400 mb-3">预期结果</h3>
          <ul class="space-y-2 text-sm text-muted">
            <li class="flex items-center gap-2">
              <span>✅</span>
              <span>API请求应该通过代理发送到 <code>/api/*</code></span>
            </li>
            <li class="flex items-center gap-2">
              <span>✅</span>
              <span>代理应该转发请求到 <code>{import.meta.env.VITE_API_URL || 'https://candelbot-backend-dev.up.railway.app'}</code></span>
            </li>
            <li class="flex items-center gap-2">
              <span>✅</span>
              <span>不应该出现CORS错误</span>
            </li>
            <li class="flex items-center gap-2">
              <span>ℹ️</span>
              <span>如果测试失败，检查Vite代理配置和后端CORS设置</span>
            </li>
          </ul>
        </div>

        <div class="mt-6 text-center">
          <a href="/dashboard" class="text-primary hover:text-primary-dark mr-4">
            前往仪表板
          </a>
          <a href="/login" class="text-primary hover:text-primary-dark">
            前往登录页
          </a>
        </div>
      </div>
    </div>
  )
}

export default TestProxyPage