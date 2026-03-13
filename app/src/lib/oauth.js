// OAuth工具函数
const OAUTH_CONFIG = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '825821602627-gbr3dpccu2r42rptp114feb6igjmrjan.apps.googleusercontent.com',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'email profile',
    responseType: 'code',
    accessType: 'offline'
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || 'Ov23lijNBXmMNJLxE0lc',
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'user:email'
  }
}

// 获取OAuth授权URL
export function getOAuthAuthUrl(provider, redirectUri) {
  const config = OAUTH_CONFIG[provider]
  if (!config) {
    throw new Error(`Unsupported OAuth provider: ${provider}`)
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: config.scope,
    response_type: config.responseType || 'code'
  })

  if (config.accessType) {
    params.append('access_type', config.accessType)
  }

  // 添加state参数防止CSRF攻击
  const state = generateState()
  localStorage.setItem(`oauth_state_${provider}`, state)
  params.append('state', state)

  return `${config.authUrl}?${params.toString()}`
}

// 验证state参数
export function verifyOAuthState(provider, state) {
  const savedState = localStorage.getItem(`oauth_state_${provider}`)
  localStorage.removeItem(`oauth_state_${provider}`)
  return savedState === state
}

// 生成随机state
function generateState() {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// 从URL中提取授权码和state
export function extractOAuthCodeFromUrl() {
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')
  const state = urlParams.get('state')
  const provider = urlParams.get('provider') || localStorage.getItem('oauth_provider')

  return { code, state, provider }
}

// 设置当前OAuth provider
export function setOAuthProvider(provider) {
  localStorage.setItem('oauth_provider', provider)
}

// 清除OAuth provider
export function clearOAuthProvider() {
  localStorage.removeItem('oauth_provider')
}

// 获取重定向URI（根据当前环境）
export function getRedirectUri() {
  const baseUrl = window.location.origin
  return `${baseUrl}/oauth/callback`
}