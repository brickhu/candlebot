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
export function setOAuthProvider(provider, fromUrl = null) {
  localStorage.setItem('oauth_provider', provider)

  // 保存登录前的页面URL，用于OAuth登录成功后重定向
  // 优先使用传入的fromUrl，否则使用当前页面URL
  let redirectUrl = fromUrl || window.location.href

  // 如果fromUrl是相对路径，转换为完整URL
  if (fromUrl && !fromUrl.startsWith('http://') && !fromUrl.startsWith('https://')) {
    // 如果是相对路径，添加当前origin
    redirectUrl = window.location.origin + (fromUrl.startsWith('/') ? fromUrl : '/' + fromUrl)
    console.log('将相对路径转换为完整URL:', fromUrl, '->', redirectUrl)
  }

  localStorage.setItem('oauth_redirect_url', redirectUrl)
  console.log('保存OAuth重定向URL:', redirectUrl)
}

// 清除OAuth provider
export function clearOAuthProvider() {
  localStorage.removeItem('oauth_provider')
  localStorage.removeItem('oauth_redirect_url')
}

// 获取重定向URI（根据当前环境）
export function getRedirectUri() {
  // 1. 优先使用环境变量配置的回调地址
  const envRedirectUri = import.meta.env.VITE_OAUTH_REDIRECT_URI
  if (envRedirectUri) {
    return envRedirectUri
  }

  // 2. 根据当前环境自动选择
  const baseUrl = window.location.origin
  const isLocalhost = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')

  if (isLocalhost) {
    // 开发环境
    return `${baseUrl}/oauth/callback`
  } else {
    // 生产环境 - 使用HTTPS
    const protocol = baseUrl.startsWith('https') ? 'https' : 'http'
    const domain = window.location.hostname

    // 如果是IP地址，保持原样
    if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
      return `${baseUrl}/oauth/callback`
    }

    // 否则使用当前域名
    return `${protocol}://${domain}/oauth/callback`
  }
}