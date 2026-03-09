// 认证上下文
import { createContext, createSignal, useContext, createEffect } from 'solid-js'
import { createStore } from 'solid-js/store'

// API配置
const API_BASE = 'https://candelbot-backend-production.up.railway.app'

// 创建上下文
const AuthContext = createContext()

// 认证提供者组件
export function AuthProvider(props) {
  const [isAuthenticated, setIsAuthenticated] = createSignal(false)
  const [user, setUser] = createStore({
    id: null,
    email: '',
    username: '',
    avatar_url: '',
    plan_type: 'free',
    quota_total: 5,
    quota_used: 0,
    quota_remaining: 5,
    settings: {}
  })
  const [loading, setLoading] = createSignal(true)
  const [token, setToken] = createSignal(null)

  // 从存储加载token
  createEffect(() => {
    chrome.storage.local.get(['auth_token', 'user_info'], (result) => {
      if (result.auth_token) {
        setToken(result.auth_token)
        if (result.user_info) {
          setUser(result.user_info)
          setIsAuthenticated(true)
        } else {
          // 如果有token但没有用户信息，尝试获取用户信息
          fetchUserInfo(result.auth_token)
        }
      }
      setLoading(false)
    })
  })

  // 获取用户信息
  const fetchUserInfo = async (authToken) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)

        // 保存到存储
        chrome.storage.local.set({
          user_info: userData
        })
      } else {
        // token可能已过期，清除存储
        chrome.storage.local.remove(['auth_token', 'user_info'])
        setIsAuthenticated(false)
        setToken(null)
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      setIsAuthenticated(false)
    }
  }

  // 登录
  const login = async (email, password) => {
    try {
      const formData = new FormData()
      formData.append('username', email)
      formData.append('password', password)

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '登录失败')
      }

      const data = await response.json()
      const authToken = data.access_token

      // 保存token
      setToken(authToken)
      chrome.storage.local.set({
        auth_token: authToken
      })

      // 获取用户信息
      await fetchUserInfo(authToken)

      return { success: true }
    } catch (error) {
      console.error('登录错误:', error)
      return { success: false, error: error.message }
    }
  }

  // JSON格式登录
  const loginJson = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login-json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '登录失败')
      }

      const data = await response.json()
      const authToken = data.access_token

      // 保存token
      setToken(authToken)
      chrome.storage.local.set({
        auth_token: authToken
      })

      // 获取用户信息
      await fetchUserInfo(authToken)

      return { success: true }
    } catch (error) {
      console.error('登录错误:', error)
      return { success: false, error: error.message }
    }
  }

  // 注册
  const register = async (email, password, username) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          username: username || email.split('@')[0]
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '注册失败')
      }

      // 注册成功后自动登录
      return await login(email, password)
    } catch (error) {
      console.error('注册错误:', error)
      return { success: false, error: error.message }
    }
  }

  // 登出
  const logout = () => {
    chrome.storage.local.remove(['auth_token', 'user_info'])
    setIsAuthenticated(false)
    setToken(null)
    setUser({
      id: null,
      email: '',
      username: '',
      avatar_url: '',
      plan_type: 'free',
      quota_total: 5,
      quota_used: 0,
      quota_remaining: 5,
      settings: {}
    })
  }

  // 更新用户信息
  const updateUser = async (userData) => {
    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '更新失败')
      }

      const updatedUser = await response.json()
      setUser(updatedUser)

      // 保存到存储
      chrome.storage.local.set({
        user_info: updatedUser
      })

      return { success: true }
    } catch (error) {
      console.error('更新用户信息错误:', error)
      return { success: false, error: error.message }
    }
  }

  // 刷新用户配额信息
  const refreshUserQuota = async () => {
    if (!token()) return

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token()}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)

        // 保存到存储
        chrome.storage.local.set({
          user_info: userData
        })
      }
    } catch (error) {
      console.error('刷新用户配额失败:', error)
    }
  }

  // 上下文值
  const auth = {
    isAuthenticated,
    user,
    loading,
    token,
    login,
    loginJson,
    register,
    logout,
    updateUser,
    refreshUserQuota
  }

  return (
    <AuthContext.Provider value={auth}>
      {props.children}
    </AuthContext.Provider>
  )
}

// 使用认证上下文的钩子
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用')
  }
  return context
}