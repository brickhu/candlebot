const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: {
            message: data.detail?.message || data.detail || 'An error occurred',
            code: data.detail?.error || 'unknown_error',
            details: data.detail,
          },
        }
      }

      return {
        success: true,
        data,
      }
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: {
          message: 'Network error. Please check your connection.',
          code: 'network_error',
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
  getOAuthUrl(provider) {
    return `${this.baseUrl}/auth/${provider}/login`
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
    return !!this.token
  }
}

export const api = new ApiClient()