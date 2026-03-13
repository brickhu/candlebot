// 模拟认证API，用于在没有后端的情况下测试登录功能

// 模拟用户数据
const mockUsers = [
  {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    avatar_url: '',
    plan_type: 'free',
    quota_total: 5,
    quota_used: 0,
    quota_remaining: 5,
    settings: {}
  }
]

// 模拟token
const mockToken = 'mock_jwt_token_1234567890'

// 模拟API响应延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 模拟登录API
export const mockLogin = async (email, password) => {
  await delay(1000) // 模拟网络延迟

  // 简单的验证逻辑
  if (email === 'test@example.com' && password === 'password123') {
    const user = mockUsers.find(u => u.email === email)
    return {
      success: true,
      access_token: mockToken,
      user: user
    }
  } else {
    return {
      success: false,
      error: '邮箱或密码错误'
    }
  }
}

// 模拟获取用户信息API
export const mockGetUserInfo = async (token) => {
  await delay(500)

  if (token === mockToken) {
    return mockUsers[0]
  } else {
    throw new Error('无效的token')
  }
}

// 模拟注册API
export const mockRegister = async (email, password, username) => {
  await delay(1500)

  // 检查邮箱是否已存在
  if (mockUsers.some(u => u.email === email)) {
    return {
      success: false,
      error: '邮箱已被注册'
    }
  }

  // 创建新用户
  const newUser = {
    id: mockUsers.length + 1,
    email,
    username: username || email.split('@')[0],
    avatar_url: '',
    plan_type: 'free',
    quota_total: 5,
    quota_used: 0,
    quota_remaining: 5,
    settings: {}
  }

  mockUsers.push(newUser)

  return {
    success: true,
    access_token: mockToken,
    user: newUser
  }
}

// 检查是否使用模拟API
export const shouldUseMockAPI = () => {
  // 检查环境变量或URL参数
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.has('mock') || import.meta.env.VITE_USE_MOCK_API === 'true'
}