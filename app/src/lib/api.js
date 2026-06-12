let mode = import.meta.env.MODE || "development"
let app_name = import.meta.env.APP_NAME || "candlebot"
let KEYS = Object.freeze({
  AUTH_TOKEN : app_name+"_auth_token_"+mode,
  
})

// 根据环境配置API基础URL
const getApiBaseUrl = () => {
  

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
    this.token = localStorage.getItem(KEYS.AUTH_TOKEN)
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
    // console.log(`🌐 API请求: ${url}`)
    // console.log(`环境: ${import.meta.env.DEV ? '开发' : '生产'}`)
    // console.log(`baseUrl: ${this.baseUrl}`)

    try {
      // console.log(`📡 发送请求到: ${url}`)
      // console.log(`请求方法: ${options.method || 'GET'}`)
      // console.log(`请求头:`, headers)
      // console.log(`请求体:`, options.body || '无')

      const response = await fetch(url, {
        ...options,
        headers,
      })

      // console.log(`📨 收到响应: ${response.status} ${response.statusText}`)
      // console.log(`响应头:`, Object.fromEntries(response.headers.entries()))

      // 尝试解析响应体
      let data
      try {
        const text = await response.text()
        // console.log(`响应体原始文本:`, text.substring(0, 500) + (text.length > 500 ? '...' : ''))

        if (text) {
          data = JSON.parse(text)
          // console.log(`解析后的响应数据:`, data)
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
        console.error(`❌ 错误响应数据:`, data)
        console.error(`❌ 错误详情:`, data.detail)
        console.error(`❌ 完整响应:`, response)
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
    console.log('🔐 登录请求数据:', credentials)
    // 使用 /login-json 端点，它接受 email 和 password 字段
    return this.request('/auth/login-json', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async register(data) {
    console.log('📝 注册请求数据:', data)
    console.log('📝 注册请求JSON:', JSON.stringify(data))
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  async logout() {
    console.log('🚪 发送登出请求...')
    const result = await this.request('/auth/logout', {
      method: 'POST',
    })

    if (result.success) {
      console.log('✅ 登出成功:', result.data)
    } else {
      console.warn('⚠️ 登出请求失败，但客户端仍会清除token:', result.error)
    }

    return result
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
    // 使用 /analysis/history 端点，它支持分页
    return this.request(`/analysis/history?page=${page}&per_page=${limit}`)
  }

  async getAnalysis(id) {
    return this.request(`/analysis/${id}`)
  }

  async getAnalysisImage(id) {
    return this.request(`/analysis/${id}/image`)
  }

  async analyzeImage(imageBase64, platform = "tradingview", lang = "zh") {
    // console.log('📸 提交图片分析请求')
    // console.log('平台:', platform)
    // console.log('语言:', lang)
    // console.log('图片大小:', imageBase64.length, '字符')

    return this.request('/analyze', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: imageBase64,
        platform: platform,
        lang: lang
      }),
    })
  }

  // Utility methods
  setToken(token) {
    this.token = token
    localStorage.setItem(KEYS.AUTH_TOKEN, token)
    // console.log("setToken(): 已设置token，长度:", token?.length || 0)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem(KEYS.AUTH_TOKEN)
  }

  isAuthenticated() {
    // 每次都从localStorage检查，确保获取最新的token状态
    const currentToken = localStorage.getItem(KEYS.AUTH_TOKEN)
    // console.log("isAuthenticated(): localStorage token:", currentToken ? "有" : "无", "实例token:", this.token ? "有" : "无")

    // 如果localStorage有token但实例没有，更新实例
    if (currentToken && !this.token) {
      this.token = currentToken
    }

    return !!currentToken
  }
}

export const api = new ApiClient()