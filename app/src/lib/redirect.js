/**
 * 重定向工具函数
 * 用于处理登录/注册页面的来源重定向逻辑
 */

/**
 * 获取当前页面的完整URL（包括查询参数）
 * @returns {string} 完整的URL
 */
export const getCurrentFullUrl = () => {
  return window.location.href
}

/**
 * 从完整URL中提取路径和查询参数
 * @param {string} fullUrl - 完整URL
 * @returns {Object} 包含path和search的对象
 */
export const parseFullUrl = (fullUrl) => {
  try {
    const url = new URL(fullUrl)
    return {
      path: url.pathname,
      search: url.search,
      hash: url.hash,
      fullPath: url.pathname + url.search + url.hash
    }
  } catch (error) {
    console.error('解析URL失败:', error)
    return {
      path: '/',
      search: '',
      hash: '',
      fullPath: '/'
    }
  }
}

/**
 * 获取重定向目标URL
 * 优先从URL参数中获取，然后检查OAuth保存的URL，最后使用默认值
 * @param {string} defaultPath - 默认重定向路径
 * @returns {string} 重定向目标URL
 */
export const getRedirectTarget = (defaultPath = '/dashboard') => {
  // 1. 优先从URL参数中获取
  const urlParams = new URLSearchParams(window.location.search)
  const from = urlParams.get('from')

  if (from) {
    console.log('从URL参数获取重定向目标:', from)
    // 解码URL参数（from参数是经过encodeURIComponent编码的）
    try {
      const decodedFrom = decodeURIComponent(from)
      console.log('解码后的重定向目标:', decodedFrom)
      return decodedFrom
    } catch (error) {
      console.error('解码from参数失败:', error)
      return from // 返回原始值
    }
  }

  // 2. 检查OAuth保存的重定向URL
  const oauthRedirectUrl = localStorage.getItem('oauth_redirect_url')
  if (oauthRedirectUrl) {
    console.log('从OAuth保存的URL获取重定向目标:', oauthRedirectUrl)
    localStorage.removeItem('oauth_redirect_url') // 使用后清除
    return oauthRedirectUrl
  }

  console.log('使用默认重定向目标:', defaultPath)
  return defaultPath
}

/**
 * 生成重定向到登录页的URL
 * 保存当前页面的完整URL作为from参数
 * @returns {string} 重定向到登录页的URL
 */
export const getLoginRedirectUrl = () => {
  const currentUrl = getCurrentFullUrl()
  const currentPath = window.location.pathname

  // 如果是登录/注册页面，不保存当前URL
  if (currentPath === '/login' || currentPath === '/register') {
    return '/login'
  }

  // 编码完整URL作为from参数
  const encodedFrom = encodeURIComponent(currentUrl)
  return `/login?from=${encodedFrom}`
}

/**
 * 生成重定向到注册页的URL
 * 保存当前页面的完整URL作为from参数
 * @returns {string} 重定向到注册页的URL
 */
export const getRegisterRedirectUrl = () => {
  const currentUrl = getCurrentFullUrl()
  const currentPath = window.location.pathname

  // 如果是登录/注册页面，不保存当前URL
  if (currentPath === '/login' || currentPath === '/register') {
    return '/register'
  }

  // 编码完整URL作为from参数
  const encodedFrom = encodeURIComponent(currentUrl)
  return `/register?from=${encodedFrom}`
}

/**
 * 执行重定向
 * @param {Function} navigate - SolidJS的navigate函数
 * @param {string} target - 目标URL
 */
export const performRedirect = (navigate, target) => {
  console.log('执行重定向到:', target)

  try {
    // 解析目标URL
    const { path, search, hash } = parseFullUrl(target)
    const redirectPath = path + search + hash

    console.log('解析后的重定向路径:', redirectPath)
    navigate(redirectPath)
  } catch (error) {
    console.error('重定向失败，使用默认路径:', error)
    navigate('/dashboard')
  }
}

/**
 * 在登录/注册成功后执行重定向
 * @param {Function} navigate - SolidJS的navigate函数
 */
export const redirectAfterAuth = (navigate) => {
  const target = getRedirectTarget()
  performRedirect(navigate, target)
}

/**
 * 检查并处理重定向逻辑
 * 用于在页面加载时检查是否需要重定向
 * @param {Function} navigate - SolidJS的navigate函数
 * @returns {boolean} 是否执行了重定向
 */
export const checkAndHandleRedirect = (navigate) => {
  const urlParams = new URLSearchParams(window.location.search)
  const from = urlParams.get('from')

  if (from) {
    console.log('检测到from参数，执行重定向:', from)
    // 解码URL参数（from参数是经过encodeURIComponent编码的）
    try {
      const decodedFrom = decodeURIComponent(from)
      console.log('解码后的重定向目标:', decodedFrom)
      performRedirect(navigate, decodedFrom)
    } catch (error) {
      console.error('解码from参数失败:', error)
      performRedirect(navigate, from) // 使用原始值
    }
    return true
  }

  return false
}