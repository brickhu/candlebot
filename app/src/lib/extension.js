/**
 * 浏览器扩展集成工具
 * 处理从Candlebot浏览器扩展跳转过来的数据
 */

/**
 * 检查是否从浏览器扩展跳转
 * 扩展可以通过以下方式传递数据：
 * 1. URL查询参数（适合小数据）
 * 2. localStorage（适合大数据如图片）
 * 3. sessionStorage（临时数据）
 */
export function checkExtensionRedirect() {
  console.log('🔍 检查浏览器扩展跳转')

  // 检查URL参数
  const urlParams = new URLSearchParams(window.location.search)
  const fromExtension = urlParams.get('from_extension')
  const imageData = urlParams.get('image_data')

  if (fromExtension === 'true') {
    console.log('✅ 检测到从浏览器扩展跳转')

    // 如果有URL参数中的图片数据（base64编码，可能被截断）
    if (imageData) {
      console.log('📸 从URL参数获取图片数据，长度:', imageData.length)
      return {
        fromExtension: true,
        imageData: imageData,
        source: 'url_params'
      }
    }

    // 检查localStorage（扩展可能存储了大图）
    const storedImageData = localStorage.getItem('candlebot_extension_image')
    if (storedImageData) {
      console.log('📸 从localStorage获取图片数据，长度:', storedImageData.length)

      // 清理存储的数据
      localStorage.removeItem('candlebot_extension_image')

      return {
        fromExtension: true,
        imageData: storedImageData,
        source: 'local_storage'
      }
    }

    // 检查sessionStorage
    const sessionImageData = sessionStorage.getItem('candlebot_extension_image')
    if (sessionImageData) {
      console.log('📸 从sessionStorage获取图片数据，长度:', sessionImageData.length)

      // 清理存储的数据
      sessionStorage.removeItem('candlebot_extension_image')

      return {
        fromExtension: true,
        imageData: sessionImageData,
        source: 'session_storage'
      }
    }

    console.log('⚠️ 从扩展跳转但未找到图片数据')
    return {
      fromExtension: true,
      imageData: null,
      source: 'no_data'
    }
  }

  return {
    fromExtension: false,
    imageData: null,
    source: 'not_extension'
  }
}

/**
 * 准备从扩展接收数据
 * 扩展可以调用这个函数来设置数据接收方式
 */
export function setupExtensionReceiver() {
  console.log('🛠️ 设置浏览器扩展数据接收器')

  // 监听来自扩展的消息
  window.addEventListener('message', (event) => {
    // 安全检查：只接受来自可信源的消息
    if (event.origin !== window.location.origin) {
      console.log('⚠️ 忽略来自不同源的消息:', event.origin)
      return
    }

    const data = event.data
    if (data.type === 'candlebot_extension_image') {
      console.log('📸 收到扩展消息中的图片数据，长度:', data.imageData?.length || 0)

      // 存储图片数据
      if (data.imageData) {
        // 使用sessionStorage临时存储
        sessionStorage.setItem('candlebot_extension_image', data.imageData)

        // 设置URL标记
        const url = new URL(window.location)
        url.searchParams.set('from_extension', 'true')
        window.history.replaceState({}, '', url.toString())

        console.log('✅ 已设置扩展数据，准备跳转')
      }
    }
  })

  // 向扩展发送准备就绪信号
  window.postMessage(
    {
      type: 'candlebot_web_ready',
      version: '1.0.0',
      features: ['image_upload', 'analysis']
    },
    window.location.origin
  )
}

/**
 * 生成扩展跳转URL
 * 扩展可以使用这个URL格式进行跳转
 */
export function getExtensionRedirectUrl(baseUrl = window.location.origin) {
  const url = new URL('/dashboard', baseUrl)
  url.searchParams.set('from_extension', 'true')
  return url.toString()
}

/**
 * 处理扩展跳转的自动分析
 * 如果从扩展跳转且有图片数据，自动打开分析弹窗
 */
export function handleAutoAnalysis(navigate, openModalCallback) {
  const redirectInfo = checkExtensionRedirect()

  if (redirectInfo.fromExtension && redirectInfo.imageData) {
    console.log('🚀 执行自动分析流程')

    // 确保在Dashboard页面
    if (!window.location.pathname.includes('/dashboard')) {
      console.log('📍 跳转到Dashboard页面')
      navigate('/dashboard')

      // 稍后打开弹窗（等待页面加载）
      setTimeout(() => {
        if (openModalCallback) {
          openModalCallback(redirectInfo.imageData)
        }
      }, 1000)
    } else {
      // 已经在Dashboard，直接打开弹窗
      if (openModalCallback) {
        openModalCallback(redirectInfo.imageData)
      }
    }

    return true
  }

  return false
}

/**
 * 清理扩展相关数据
 */
export function cleanupExtensionData() {
  localStorage.removeItem('candlebot_extension_image')
  sessionStorage.removeItem('candlebot_extension_image')

  // 清理URL参数
  const url = new URL(window.location)
  url.searchParams.delete('from_extension')
  url.searchParams.delete('image_data')
  window.history.replaceState({}, '', url.toString())

  console.log('🧹 已清理扩展数据')
}

export default {
  checkExtensionRedirect,
  setupExtensionReceiver,
  getExtensionRedirectUrl,
  handleAutoAnalysis,
  cleanupExtensionData
}