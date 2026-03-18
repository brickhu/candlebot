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
      const response = await api.login({ email, password })
      if (response.success && response.data) {
        api.setToken(response.data.access_token)
        setUser(response.data.user)
        return true
      }
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
      const response = await api.register({ email, username, password })
      if (response.success && response.data) {
        api.setToken(response.data.access_token)
        setUser(response.data.user)
        return true
      }
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

  return (
    <AuthContext.Provider value={value}>
      {props.children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)