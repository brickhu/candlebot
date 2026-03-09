// API 上下文
import { createContext, useContext } from 'solid-js'
import { useAuth } from './AuthContext'

// API配置
const API_BASE = 'https://candelbot-backend-production.up.railway.app'

// 创建上下文
const APIContext = createContext()

// API提供者组件
export function APIProvider(props) {
  const auth = useAuth()

  // 获取认证头
  const getAuthHeaders = () => {
    const headers = {
      'Content-Type': 'application/json'
    }

    if (auth.token()) {
      headers['Authorization'] = `Bearer ${auth.token()}`
    }

    return headers
  }

  // 处理API响应
  const handleResponse = async (response) => {
    if (!response.ok) {
      let errorMessage = `API错误: ${response.status}`

      try {
        const errorData = await response.json()
        errorMessage = errorData.detail || errorData.error || errorMessage
      } catch {
        // 无法解析JSON错误
      }

      throw new Error(errorMessage)
    }

    return response.json()
  }

  // 分析相关API
  const analysisAPI = {
    // 获取分析历史
    getHistory: async (params = {}) => {
      const queryParams = new URLSearchParams({
        page: params.page || 1,
        per_page: params.per_page || 20,
        ...params
      }).toString()

      const response = await fetch(`${API_BASE}/analysis/history?${queryParams}`, {
        headers: getAuthHeaders()
      })

      return handleResponse(response)
    },

    // 获取单个分析记录
    getAnalysis: async (id) => {
      const response = await fetch(`${API_BASE}/analysis/${id}`, {
        headers: getAuthHeaders()
      })

      return handleResponse(response)
    },

    // 获取分析图片
    getAnalysisImage: async (id) => {
      const response = await fetch(`${API_BASE}/analysis/${id}/image`, {
        headers: getAuthHeaders()
      })

      return handleResponse(response)
    },

    // 删除分析记录
    deleteAnalysis: async (id) => {
      const response = await fetch(`${API_BASE}/analysis/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      return handleResponse(response)
    },

    // 获取分析统计
    getStats: async () => {
      const response = await fetch(`${API_BASE}/analysis/stats/summary`, {
        headers: getAuthHeaders()
      })

      return handleResponse(response)
    }
  }

  // 对话相关API
  const conversationAPI = {
    // 获取或创建对话
    getConversation: async (analysisId) => {
      const response = await fetch(`${API_BASE}/conversation/${analysisId}`, {
        headers: getAuthHeaders()
      })

      return handleResponse(response)
    },

    // 提问
    askQuestion: async (analysisId, question, lang = 'zh') => {
      const response = await fetch(`${API_BASE}/conversation/${analysisId}/ask`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          analysis_id: analysisId,
          question,
          lang
        })
      })

      return handleResponse(response)
    },

    // 删除对话
    deleteConversation: async (conversationId) => {
      const response = await fetch(`${API_BASE}/conversation/${conversationId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      })

      return handleResponse(response)
    }
  }

  // 分析功能API（调用AI分析）
  const analyzeAPI = {
    // 分析图表
    analyzeChart: async (imageBase64, platform = 'tradingview', lang = 'zh') => {
      const response = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          image_base64: imageBase64,
          platform,
          lang
        })
      })

      return handleResponse(response)
    },

    // 提问关于分析报告
    askAboutAnalysis: async (analysisId, question, lang = 'zh') => {
      const response = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          analysis_id: analysisId,
          question,
          lang
        })
      })

      return handleResponse(response)
    }
  }

  // 通用API
  const api = {
    // 健康检查
    healthCheck: async () => {
      const response = await fetch(`${API_BASE}/health`)
      return handleResponse(response)
    },

    // 获取API信息
    getAPIInfo: async () => {
      const response = await fetch(`${API_BASE}/`)
      return handleResponse(response)
    }
  }

  // 上下文值
  const apiContext = {
    analysis: analysisAPI,
    conversation: conversationAPI,
    analyze: analyzeAPI,
    ...api
  }

  return (
    <APIContext.Provider value={apiContext}>
      {props.children}
    </APIContext.Provider>
  )
}

// 使用API上下文的钩子
export function useAPI() {
  const context = useContext(APIContext)
  if (!context) {
    throw new Error('useAPI必须在APIProvider内部使用')
  }
  return context
}