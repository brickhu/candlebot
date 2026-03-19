import { createContext, createSignal, useContext, onMount } from 'solid-js'
import { api } from './api'

const AuthContext = createContext()

export const AuthProvider = (props) => {
  const [user, setUser] = createSignal(null)
  const [isLoading, setIsLoading] = createSignal(true)

  const loadUser = async () => {
    console.log('🔄 loadUser() 被调用')
    console.log('api.isAuthenticated():', api.isAuthenticated())

    if (!api.isAuthenticated()) {
      console.log('❌ 没有认证token，跳过用户加载')
      setIsLoading(false)
      return
    }

    console.log('✅ 有认证token，尝试加载用户信息')

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
    console.log('🔧 AuthProvider mounted, 开始加载用户')
    // console.log('初始token状态:', api.isAuthenticated() ? '已认证' : '未认证')
    loadUser()
  })

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
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      api.clearToken()
      setUser(null)
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
  }

  console.log('AuthProvider渲染，value包含:', Object.keys(value))
  console.log('register函数:', typeof value.register)

  return (
    <AuthContext.Provider value={value}>
      {props.children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    console.error('❌ useAuth must be used within an AuthProvider')
    console.trace('useAuth called outside AuthProvider')
    // 返回一个安全的默认对象，但标记为无效
    return {
      _isValid: false,
      user: () => null,
      isLoading: () => false,
      login: () => {
        console.error('login called but auth not available - component outside AuthProvider')
        return Promise.resolve(false)
      },
      register: () => {
        console.error('register called but auth not available - component outside AuthProvider')
        return Promise.resolve(false)
      },
      logout: () => {
        console.error('logout called but auth not available - component outside AuthProvider')
      },
      refreshUser: () => {
        console.error('refreshUser called but auth not available - component outside AuthProvider')
      },
    }
  }
  console.log('✅ useAuth返回有效的AuthContext')
  return context
}