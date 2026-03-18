import { createSignal, onMount } from 'solid-js'
import { useNavigate } from '@solidjs/router'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { extractOAuthCodeFromUrl, verifyOAuthState, clearOAuthProvider, getRedirectUri } from '../lib/oauth'

const OAuthCallbackPage = () => {
  const [status, setStatus] = createSignal('processing')
  const [error, setError] = createSignal('')
  const navigate = useNavigate()
  const auth = useAuth()

  onMount(async () => {
    try {
      // 从URL中提取参数
      const { code, state, provider } = extractOAuthCodeFromUrl()

      if (!code || !state || !provider) {
        throw new Error('缺少必要的OAuth参数')
      }

      // 验证state参数
      if (!verifyOAuthState(provider, state)) {
        throw new Error('OAuth状态验证失败，可能存在安全风险')
      }

      // 获取重定向URI
      const redirectUri = getRedirectUri()

      // 调用后端OAuth回调
      setStatus('exchanging_token')
      const response = await api.handleOAuthCallback(provider, code, redirectUri)

      if (!response.success) {
        throw new Error(response.error?.message || 'OAuth认证失败')
      }

      // 保存token和用户信息
      console.log('完整的OAuth响应:', response)

      if (!response.data) {
        throw new Error('OAuth响应中没有数据')
      }

      const { access_token, user } = response.data
      console.log('OAuth响应数据:', response.data)
      console.log('用户信息:', user)

      if (!access_token) {
        throw new Error('OAuth响应中没有access_token')
      }

      api.setToken(access_token)

      // 直接设置用户信息到auth上下文
      console.log('OAuthCallback中的auth对象:', auth)
      console.log('auth类型:', typeof auth)
      console.log('auth.refreshUser类型:', typeof auth?.refreshUser)
      console.log('auth.user类型:', typeof auth?.user)

      // 尝试多次获取auth上下文，因为可能异步加载
      let retryCount = 0
      const maxRetries = 5
      const retryDelay = 200 // 毫秒

      const tryRefreshUser = async () => {
        if (auth && typeof auth.refreshUser === 'function') {
          console.log('调用 auth.refreshUser()')
          await auth.refreshUser()
          console.log('auth.refreshUser() 完成')

          // 检查用户是否已加载
          console.log('当前用户:', auth.user ? auth.user() : '未设置')
          return true
        }
        return false
      }

      let success = await tryRefreshUser()

      while (!success && retryCount < maxRetries) {
        console.log(`等待auth上下文初始化... 重试 ${retryCount + 1}/${maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
        success = await tryRefreshUser()
        retryCount++
      }

      if (!success) {
        console.warn('auth上下文不可用或没有refreshUser方法')
        console.log('完整的auth对象结构:', JSON.stringify(auth, null, 2))

        // 即使没有auth上下文，也尝试直接加载用户
        console.log('尝试直接调用api.getCurrentUser()')
        try {
          const userResponse = await api.getCurrentUser()
          if (userResponse.success && userResponse.data) {
            console.log('直接加载用户成功:', userResponse.data)
            // 如果auth上下文后来可用，用户数据应该已经设置
          }
        } catch (error) {
          console.error('直接加载用户失败:', error)
        }
      }

      setStatus('success')

      // 2秒后跳转到仪表板
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)

    } catch (err) {
      console.error('OAuth回调错误:', err)
      setError(err.message || 'OAuth认证失败')
      setStatus('error')

      // 5秒后跳转到登录页
      setTimeout(() => {
        navigate('/login')
      }, 5000)
    } finally {
      clearOAuthProvider()
    }
  })

  return (
    <div class="min-h-screen flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-md text-center">
        <div class="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
          <span class="text-bg font-bold text-2xl">C</span>
        </div>

        {status() === 'processing' && (
          <>
            <h1 class="text-2xl font-bold mb-3">处理OAuth回调</h1>
            <p class="text-muted mb-6">正在验证OAuth响应...</p>
            <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </>
        )}

        {status() === 'exchanging_token' && (
          <>
            <h1 class="text-2xl font-bold mb-3">交换令牌</h1>
            <p class="text-muted mb-6">正在与服务器交换认证令牌...</p>
            <div class="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </>
        )}

        {status() === 'success' && (
          <>
            <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 class="text-2xl font-bold mb-3">登录成功！</h1>
            <p class="text-muted mb-6">正在跳转到仪表板...</p>
            <div class="w-full bg-gray-200 rounded-full h-1">
              <div class="bg-primary h-1 rounded-full animate-progress"></div>
            </div>
          </>
        )}

        {status() === 'error' && (
          <>
            <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 class="text-2xl font-bold mb-3">登录失败</h1>
            <p class="text-red-400 mb-4">{error()}</p>
            <p class="text-muted mb-6">5秒后跳转到登录页面...</p>
            <div class="w-full bg-gray-200 rounded-full h-1">
              <div class="bg-red-500 h-1 rounded-full animate-progress"></div>
            </div>
          </>
        )}

        <div class="mt-8">
          <button
            onClick={() => navigate('/login')}
            class="px-4 py-2 bg-surface border border-border rounded-lg hover:bg-bg transition-colors"
          >
            返回登录页
          </button>
        </div>
      </div>
    </div>
  )
}

export default OAuthCallbackPage