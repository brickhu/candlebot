// 根据环境配置API基础URL
const getApiBaseUrl = () => {
  const mode = import.meta.env.MODE

  switch (mode) {
    case 'development':
      // 开发环境使用代理
      return '/api'
    case 'production':
      // 生产环境使用环境变量配置的URL
      return import.meta.env.VITE_API_URL || 'https://candelbot-backend-dev.up.railway.app'
    default:
      // 其他环境（如测试）
      return import.meta.env.VITE_API_URL || 'https://candelbot-backend-dev.up.railway.app'
  }
}

const API_BASE_URL = getApiBaseUrl()

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl
    this.token = localStorage.getItem('auth_token')
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const url = `${this.baseUrl}${endpoint}`
    console.log(`🌐 API请求: ${url}`)
    console.log(`环境: ${import.meta.env.DEV ? '开发' : '生产'}`)
    console.log(`baseUrl: ${this.baseUrl}`)

    try {
      console.log(`📡 发送请求到: ${url}`)
      console.log(`请求方法: ${options.method || 'GET'}`)
      console.log(`请求头:`, headers)
      console.log(`请求体:`, options.body || '无')

      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log(`📨 收到响应: ${response.status} ${response.statusText}`)
      console.log(`响应头:`, Object.fromEntries(response.headers.entries()))

      // 尝试解析响应体
      let data
      try {
        const text = await response.text()
        console.log(`响应体原始文本:`, text.substring(0, 500) + (text.length > 500 ? '...' : ''))

        if (text) {
          data = JSON.parse(text)
          console.log(`解析后的响应数据:`, data)
        } else {
          console.log('响应体为空')
          data = {}
        }
      } catch (parseError) {
        console.error('❌ 解析响应体失败:', parseError)
        data = {}
      }

      if (!response.ok) {
        console.error(`❌ 请求失败: ${response.status} ${response.statusText}`)
        return {
          success: false,
          error: {
            message: data.detail?.message || data.detail || `Server error: ${response.status}`,
            code: data.detail?.error || 'server_error',
            details: data.detail,
            status: response.status,
          },
        }
      }

      console.log('✅ 请求成功')
      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('❌ API请求失败:', error)
      return {
        success: false,
        error: {
          message: 'Network error. Please check your connection.',
          code: 'network_error',
          details: error.message,
        },
      }
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async register(data) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    })
  }

  // OAuth endpoints
  async handleOAuthCallback(provider, code, redirectUri) {
    return this.request(`/auth/oauth/${provider}/callback`, {
      method: 'POST',
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    })
  }

  // Analysis endpoints
  async getAnalyses(page = 1, limit = 20) {
    return this.request(`/analysis?page=${page}&limit=${limit}`)
  }

  async getAnalysis(id) {
    return this.request(`/analysis/${id}`)
  }

  // Utility methods
  setToken(token) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  isAuthenticated() {
    console.log("isAuthenticated():",this.token)
    return !!this.token
  }
}

export const api = new ApiClient()