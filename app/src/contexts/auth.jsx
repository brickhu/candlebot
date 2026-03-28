import { createContext, createSignal, useContext, onMount, createEffect, Suspense } from 'solid-js'
import { api } from '../lib/api'
import { getLoginRedirectUrl, getRegisterRedirectUrl } from '../lib/redirect'
import Spinner from '../components/Spinner'

const AuthContext = createContext()

export const AuthProvider = (props) => {
  const [user, setUser] = createSignal(null)
  const [isLoading, setIsLoading] = createSignal(true)
  
  const loadUser = async () => {
    console.log('🔄 loadUser() 被调用')
   
    const isAuthenticated = await api?.isAuthenticated() || false
    console.log('api.isAuthenticated():', isAuthenticated)

    if (!isAuthenticated) {
      console.log('❌ 没有认证token，跳过用户加载')
      setIsLoading(false)
      
      return
    }

    try {
      console.log('📡 调用 api.getCurrentUser()...')
      const response = await api.getCurrentUser()
      console.log('📡 api.getCurrentUser() 响应:', response)

      if (response.success && response.data) {
        console.log('✅ 用户加载成功:', response.data)
        setUser(response.data)
      } else {
        console.log('❌ 用户加载失败，清除token')
        console.log('错误详情:', response.error)
        api.clearToken()
      }
    } catch (error) {
      console.error('❌ Failed to load user:', error)
      api.clearToken()
    } finally {
      console.log('🏁 loadUser() 完成')
      setIsLoading(false)
    }
  }

  onMount(() => {
    setIsLoading(true)
    console.log('🔧 AuthProvider mounted, 开始加载用户')
    loadUser()
  })

  // 全局认证检查 - 全站需要登录（除了特定公开页面）
  // createEffect(() => {
  //   if (isLoading()) return // 还在加载中，不进行检查

  //   const currentPath = window.location.pathname

  //   // 定义公开页面（不需要登录的页面）
  //   const publicPages = [
  //     '/',           // 首页 - 公开
  //     '/login',      // 登录页 - 公开
  //     '/register',   // 注册页 - 公开
  //     '/oauth/callback', // OAuth回调 - 公开
  //     '/new',        // 新建分析页面 - 公开（允许扩展跳转）
  //     // 测试页面现在也需要登录
  //     // '/test-upload',   // 测试上传 - 需要登录
  //     // '/test-proxy',    // 测试代理 - 需要登录
  //     // '/user-test',     // 用户测试 - 需要登录
  //     // '/test-redirect', // 重定向测试 - 需要登录
  //   ]

  //   const isPublicPage = publicPages.includes(currentPath)
  //   const isLoginPage = currentPath === '/login'
  //   const isRegisterPage = currentPath === '/register'

  //   console.log('🔍 全局认证检查:', {
  //     path: currentPath,
  //     isPublicPage,
  //     hasUser: !!user(),
  //     hasToken: api.isAuthenticated(),
  //     isLoading: isLoading()
  //   })

  //   // 如果不是公开页面且没有用户，重定向到登录页
  //   if (!isPublicPage && !user()) {
  //     console.log('🚫 访问非公开页面但未认证，重定向到登录页')
  //     // 使用window.location进行重定向，因为AuthProvider不在Router内部
  //     const redirectUrl = getLoginRedirectUrl()
  //     console.log('重定向到:', redirectUrl)
  //     window.location.href = redirectUrl
  //     return
  //   }

  //   // 如果已登录但访问登录/注册页面，重定向到仪表板
  //   if (user() && (isLoginPage || isRegisterPage)) {
  //     console.log('✅ 已登录用户访问登录页，重定向到仪表板')
  //     window.location.href = '/dashboard'
  //     return
  //   }
  // })

  const login = async (email, password) => {
    setIsLoading(true)
    try {
      // 1. 登录获取token
      const loginResponse = await api.login({ email, password })
      if (loginResponse.success && loginResponse.data) {
        api.setToken(loginResponse.data.access_token)

        // 2. 获取用户信息
        const userResponse = await api.getCurrentUser()
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data)
          return true
        }
      }

      console.error('Login failed:', loginResponse.error)
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email, username, password) => {
    setIsLoading(true)
    try {
      // 1. 准备注册数据 - 总是包含username字段，即使为空
      const registerData = {
        email: email.trim(),
        password: password,
        username: username ? username.trim() : null, // 显式发送null
      }

      console.log('📝 发送注册数据:', registerData)
      console.log('📝 注册数据JSON:', JSON.stringify(registerData))

      // 2. 先注册
      const registerResponse = await api.register(registerData)
      if (!registerResponse.success) {
        console.error('Registration failed:', registerResponse.error)
        return false
      }

      // 3. 注册成功后自动登录
      const loginResponse = await api.login({ email: email.trim(), password })
      if (loginResponse.success && loginResponse.data) {
        api.setToken(loginResponse.data.access_token)

        // 4. 获取用户信息
        const userResponse = await api.getCurrentUser()
        if (userResponse.success && userResponse.data) {
          setUser(userResponse.data)
          return true
        }
      }

      console.error('Auto-login after registration failed:')
      console.error('登录响应:', loginResponse)
      console.error('错误详情:', loginResponse.error)
      console.error('错误消息:', loginResponse.error?.message)
      console.error('错误代码:', loginResponse.error?.code)
      return false
    } catch (error) {
      console.error('Registration failed:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await api.logout()
      await api.clearToken()
      setUser(null)
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshUser = async () => {
    await loadUser()
  }

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated : api?.isAuthenticated() 
  }

  console.log('AuthProvider渲染，value包含:', Object.keys(value))
  console.log('register函数:', typeof value.register)

  return (
    <AuthContext.Provider value={value}>
      <Suspense fallback={ <div className='flex w-full h-full items-center justify-center'> <Spinner/> 用户加载中...</div>}>{props.children}</Suspense>
      {/* <Show when={!isLoading()} fallback={ <div className=''> <Spinner/> 用户加载中...</div>}>{props.children}</Show>       */}
    </AuthContext.Provider>
  )
}

export const useAuth = ()=>useContext(AuthContext)