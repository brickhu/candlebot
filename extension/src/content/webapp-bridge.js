/**
 * Candlebot Web App Bridge
 *
 * 作用：
 * 1. 检测用户在 web app 上的登录状态
 * 2. 自动将 auth token 同步到 chrome.storage
 * 3. 供 background script 使用（用于浮动组件的 API 调用）
 */

console.log('[Candlebot Bridge] 已加载 (web app bridge)')

// 检测环境：如果当前是 chat.candlebot.app 则为 production，否则 development
const IS_PRODUCTION = window.location.hostname === 'chat.candlebot.app'
const MODE = IS_PRODUCTION ? 'production' : 'development'

// Token key 格式：candlebot_auth_token_{mode}
const AUTH_TOKEN_KEY = `candlebot_auth_token_${MODE}`

/**
 * 将 auth token 从 localStorage 同步到 chrome.storage
 */
function syncAuthToken() {
  const localToken = localStorage.getItem(AUTH_TOKEN_KEY)

  if (localToken) {
    console.log('[Candlebot Bridge] 检测到登录 token，长度:', localToken.length)

    chrome.storage.local.set({ candlebot_auth_token: localToken }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[Candlebot Bridge] 保存 token 到 chrome.storage 失败:', chrome.runtime.lastError.message)
      } else {
        console.log('[Candlebot Bridge] ✅ Token 已同步到扩展存储')
        // 通知 background 脚本 token 已更新
        chrome.runtime.sendMessage({
          type: 'AUTH_TOKEN_UPDATED',
          hasToken: true
        }).catch(() => {}) // 忽略连接错误
      }
    })
  } else {
    // token 被清除时也同步清除
    chrome.storage.local.remove(['candlebot_auth_token'], () => {
      console.log('[Candlebot Bridge] 🧹 Token 已清除')
      chrome.runtime.sendMessage({
        type: 'AUTH_TOKEN_UPDATED',
        hasToken: false
      }).catch(() => {})
    })
  }
}

/**
 * 监控 localStorage 变化（检测 token 变更）
 */
function monitorAuthChanges() {
  // 定时检查（localStorage 无法直接监听跨标签变化）
  let lastToken = localStorage.getItem(AUTH_TOKEN_KEY)

  setInterval(() => {
    const currentToken = localStorage.getItem(AUTH_TOKEN_KEY)
    if (currentToken !== lastToken) {
      lastToken = currentToken
      console.log('[Candlebot Bridge] 检测到 token 变化')
      syncAuthToken()
    }
  }, 3000) // 每 3 秒检查一次
}

/**
 * 监听来自 background 的 token 查询请求
 */
function setupMessageListeners() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYNC_AUTH_TOKEN') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY)
      sendResponse({
        success: true,
        hasToken: !!token,
        token: token || null
      })
      // 如果检测到 token，同步到 chrome.storage
      if (token) {
        syncAuthToken()
      }
      return true
    }
  })
}

// 初始化
function initialize() {
  // 立即同步一次
  syncAuthToken()

  // 设置监听器
  setupMessageListeners()

  // 开始监控
  monitorAuthChanges()

  // 页面可见性变化时也检查（用户切换到其他标签又回来时）
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      syncAuthToken()
    }
  })

  console.log('[Candlebot Bridge] 初始化完成，环境:', MODE)
}

// 确保在就绪后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize)
} else {
  initialize()
}
