// 认证上下文
import { createContext, createSignal, useContext, createEffect } from 'solid-js'
import { createStore } from 'solid-js/store'
import { mockLogin, mockGetUserInfo, mockRegister, shouldUseMockAPI } from '../utils/mockAuth'

// API配置
const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.candlebot.app'

// OAuth配置
const OAUTH_CONFIG = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: chrome.identity ? chrome.identity.getRedirectURL('oauth2') : `${window.location.origin}/oauth/callback`,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'profile email',
    responseType: 'code'
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
    redirectUri: chrome.identity ? chrome.identity.getRedirectURL('oauth2') : `${window.location.origin}/oauth/callback`,
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'user:email',
    responseType: 'code'
  }
}

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
    const loadAuthData = async () => {
      try {
        // 检查chrome.storage是否可用
        if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
          console.warn('chrome.storage.local不可用，跳过认证检查')
          setLoading(false)
          return
        }

        // 使用Promise包装chrome.storage API
        const result = await new Promise((resolve, reject) => {
          chrome.storage.local.get(['auth_token', 'user_info'], (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError)
            } else {
              resolve(result)
            }
          })
        })

        if (result.auth_token) {
          setToken(result.auth_token)
          if (result.user_info) {
            setUser(result.user_info)
            setIsAuthenticated(true)
            setLoading(false)
          } else {
            // 如果有token但没有用户信息，尝试获取用户信息
            await fetchUserInfo(result.auth_token)
          }
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('加载认证数据时出错:', error)
        setLoading(false)
      }
    }

    // 立即加载认证数据
    loadAuthData()
  })

  // 获取用户信息
  const fetchUserInfo = async (authToken) => {
    // 检查是否使用模拟API
    if (shouldUseMockAPI()) {
      try {
        const userData = await mockGetUserInfo(authToken)
        setUser(userData)
        setIsAuthenticated(true)

        // 保存到存储
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            user_info: userData
          })
        }
      } catch (error) {
        console.error('获取模拟用户信息失败:', error)
        setIsAuthenticated(false)
        setToken(null)

        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove(['auth_token', 'user_info'])
        }
      } finally {
        setLoading(false)
      }
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)

        // 保存到存储
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({
            user_info: userData
          })
        }
      } else {
        // token可能已过期，清除存储
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove(['auth_token', 'user_info'])
        }
        setIsAuthenticated(false)
        setToken(null)
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('获取用户信息失败:', error)
      setIsAuthenticated(false)

      // 如果是网络错误，清除无效的token
      if (error.name === 'AbortError' || error.name === 'TypeError') {
        if (chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove(['auth_token', 'user_info'])
        }
        setToken(null)
      }
    } finally {
      setLoading(false)
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
    // 检查是否使用模拟API
    if (shouldUseMockAPI()) {
      try {
        const result = await mockLogin(email, password)

        if (result.success) {
          const authToken = result.access_token

          // 保存token
          setToken(authToken)
          if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({
              auth_token: authToken
            })
          }

          // 获取用户信息
          await fetchUserInfo(authToken)

          return { success: true }
        } else {
          return { success: false, error: result.error }
        }
      } catch (error) {
        console.error('模拟登录错误:', error)
        return { success: false, error: error.message }
      }
    }

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
      if (chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({
          auth_token: authToken
        })
      }

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
    // 检查是否使用模拟API
    if (shouldUseMockAPI()) {
      try {
        const result = await mockRegister(email, password, username)

        if (result.success) {
          const authToken = result.access_token

          // 保存token
          setToken(authToken)
          if (chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({
              auth_token: authToken
            })
          }

          // 获取用户信息
          await fetchUserInfo(authToken)

          return { success: true }
        } else {
          return { success: false, error: result.error }
        }
      } catch (error) {
        console.error('模拟注册错误:', error)
        return { success: false, error: error.message }
      }
    }

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

  // OAuth登录
  const loginWithOAuth = async (provider) => {
    try {
      const config = OAUTH_CONFIG[provider]
      if (!config) {
        throw new Error(`不支持的登录方式: ${provider}`)
      }

      // 生成并存储state token
      const stateToken = generateStateToken()
      sessionStorage.setItem(`oauth_state_${provider}`, stateToken)

      // 构建OAuth授权URL
      const authUrl = new URL(config.authUrl)
      authUrl.searchParams.append('client_id', config.clientId)
      authUrl.searchParams.append('redirect_uri', config.redirectUri)
      authUrl.searchParams.append('response_type', config.responseType)
      authUrl.searchParams.append('scope', config.scope)
      authUrl.searchParams.append('state', stateToken)

      // 在Chrome扩展中使用chrome.identity.launchWebAuthFlow
      if (chrome.identity && chrome.identity.launchWebAuthFlow) {
        return new Promise((resolve, reject) => {
          chrome.identity.launchWebAuthFlow({
            url: authUrl.toString(),
            interactive: true
          }, (redirectUrl) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
              return
            }

            if (!redirectUrl) {
              reject(new Error('授权流程被取消'))
              return
            }

            // 从重定向URL中提取授权码
            const url = new URL(redirectUrl)
            const code = url.searchParams.get('code')
            const receivedState = url.searchParams.get('state')
            const error = url.searchParams.get('error')

            if (error) {
              reject(new Error(`OAuth错误: ${error}`))
              return
            }

            if (!code) {
              reject(new Error('未收到授权码'))
              return
            }

            // 验证state token防止CSRF攻击
            const storedState = sessionStorage.getItem(`oauth_state_${provider}`)
            sessionStorage.removeItem(`oauth_state_${provider}`)

            if (!storedState || storedState !== receivedState) {
              reject(new Error('安全验证失败，请重试'))
              return
            }

            // 使用授权码交换token
            exchangeCodeForToken(provider, code, config.redirectUri)
              .then(resolve)
              .catch(reject)
          })
        })
      } else {
        // 在Web环境中直接重定向
        window.location.href = authUrl.toString()
        return { success: true, pending: true }
      }
    } catch (error) {
      console.error(`${provider}登录错误:`, error)
      return { success: false, error: error.message }
    }
  }

  // 使用授权码交换token
  const exchangeCodeForToken = async (provider, code, redirectUri) => {
    try {
      const response = await fetch(`${API_BASE}/auth/oauth/${provider}/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          redirect_uri: redirectUri
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Token交换失败')
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
      console.error('Token交换错误:', error)
      return { success: false, error: error.message }
    }
  }

  // 生成state token防止CSRF攻击
  const generateStateToken = () => {
    const array = new Uint8Array(32)
    window.crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
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
    loginWithOAuth,
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