/**
 * 浏览器扩展集成工具
 * 处理从Candlebot浏览器扩展跳转过来的数据
 */

/**
 * 从data URL中提取纯base64数据
 * 输入: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
 * 输出: "iVBORw0KGgoAAAANSUhEUg..." (纯base64)
 */
function extractPureBase64(dataUrl) {
  if (!dataUrl) return null

  // 如果已经是纯base64（不包含data:前缀），直接返回
  if (!dataUrl.startsWith('data:')) {
    return dataUrl
  }

  // 提取base64部分
  // 使用更灵活的正则表达式匹配各种格式
  const base64Match = dataUrl.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/)
  if (base64Match && base64Match[1]) {
    return base64Match[1]
  }

  console.warn('无法从data URL提取base64数据:', dataUrl.substring(0, 100))
  return dataUrl
}

/**
 * 检查是否从浏览器扩展跳转
 * 扩展可以通过以下方式传递数据：
 * 1. URL查询参数（适合小数据）
 * 2. localStorage（适合大数据如图片）
 * 3. sessionStorage（临时数据）
 * 4. 本地中转API（新方案）
 */
export function checkExtensionRedirect() {
  console.log('🔍 检查浏览器扩展跳转')

  // 检查URL参数
  const urlParams = new URLSearchParams(window.location.search)
  const fromExtension = urlParams.get('from_extension')
  const imageData = urlParams.get('image_data')
  const pendingImageId = urlParams.get('pending_image_id')

  console.log('URL参数检查结果:', {
    fromExtension,
    hasImageDataParam: !!imageData,
    imageDataLength: imageData?.length || 0,
    pendingImageId
  })

  // 检查所有可能的存储位置
  const localStorageData = localStorage.getItem('candlebot_extension_image')
  const sessionStorageData = sessionStorage.getItem('candlebot_extension_image')

  console.log('存储位置检查结果:', {
    localStorage: localStorageData ? `有数据，长度: ${localStorageData.length}` : '无数据',
    sessionStorage: sessionStorageData ? `有数据，长度: ${sessionStorageData.length}` : '无数据'
  })

  // 如果有URL标记、存储位置数据或pending_image_id，都认为是扩展跳转
  const hasExtensionData = fromExtension === 'true' || localStorageData || sessionStorageData || pendingImageId

  if (hasExtensionData) {
    console.log('✅ 检测到从浏览器扩展跳转或有扩展数据')

    // 优先检查pending_image_id（本地中转API方案）
    if (pendingImageId) {
      console.log('📸 检测到pending_image_id，将从本地中转API获取图片:', pendingImageId)

      // 清理URL参数中的pending_image_id（避免重复使用）
      const url = new URL(window.location)
      url.searchParams.delete('pending_image_id')
      window.history.replaceState({}, '', url.toString())

      return {
        fromExtension: true,
        pendingImageId: pendingImageId,
        source: 'local_api',
        imageData: null, // 需要从API获取
        imageFormat: null
      }
    }

    // 优先检查URL参数（最新数据）
    if (imageData) {
      console.log('📸 从URL参数获取图片数据，长度:', imageData.length)
      const imageFormat = urlParams.get('image_format') || 'png'
      console.log('从URL参数获取图片格式:', imageFormat)

      // 清理URL参数中的图片数据（避免重复使用）
      const url = new URL(window.location)
      url.searchParams.delete('image_data')
      url.searchParams.delete('image_format')
      window.history.replaceState({}, '', url.toString())

      return {
        fromExtension: true,
        imageData: extractPureBase64(imageData),
        source: 'url_params',
        imageFormat: imageFormat
      }
    }

    // 检查sessionStorage（postMessage方式存储在这里）
    if (sessionStorageData) {
      console.log('📸 从sessionStorage获取图片数据，长度:', sessionStorageData.length)

      // 获取图片格式
      const imageFormat = sessionStorage.getItem('candlebot_extension_image_format') || 'png'

      // 清理存储的数据（避免重复使用）
      sessionStorage.removeItem('candlebot_extension_image')
      sessionStorage.removeItem('candlebot_extension_image_format')

      return {
        fromExtension: true,
        imageData: extractPureBase64(sessionStorageData),
        source: 'session_storage',
        imageFormat: imageFormat
      }
    }

    // 检查localStorage（备用方案）
    if (localStorageData) {
      console.log('📸 从localStorage获取图片数据，长度:', localStorageData.length)

      // 获取元数据
      const storedMetadata = localStorage.getItem('candlebot_extension_metadata')
      let imageFormat = 'png'
      if (storedMetadata) {
        try {
          const metadata = JSON.parse(storedMetadata)
          imageFormat = metadata.imageFormat || 'png'
          console.log('从localStorage获取图片格式:', imageFormat)
        } catch (e) {
          console.warn('解析localStorage元数据失败:', e)
        }
      }

      // 清理存储的数据
      localStorage.removeItem('candlebot_extension_image')
      localStorage.removeItem('candlebot_extension_metadata')

      return {
        fromExtension: true,
        imageData: extractPureBase64(localStorageData),
        source: 'local_storage',
        imageFormat: imageFormat
      }
    }

    console.log('⚠️ 从扩展跳转但未找到图片数据（只有标记）')
    return {
      fromExtension: true,
      imageData: null,
      source: 'no_data'
    }
  }

  console.log('❌ 未检测到扩展跳转')
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

        // 存储图片格式信息
        const imageFormat = data.metadata?.imageFormat || 'png'
        sessionStorage.setItem('candlebot_extension_image_format', imageFormat)

        // 设置URL标记
        const url = new URL(window.location)
        url.searchParams.set('from_extension', 'true')
        window.history.replaceState({}, '', url.toString())

        console.log('✅ 已设置扩展数据，图片格式:', imageFormat)

        // 触发自定义事件，通知页面有新的扩展数据
        window.dispatchEvent(new CustomEvent('candlebot_extension_data_received', {
          detail: {
            imageData: data.imageData,
            metadata: data.metadata,
            imageFormat: imageFormat,
            timestamp: Date.now()
          }
        }))

        // 根据当前页面处理数据
        if (window.location.pathname.includes('/new')) {
          // 在/new页面，自动刷新以显示图片
          console.log('🔄 在/new页面，自动刷新以显示扩展图片')
          window.location.reload()
        } else if (window.location.pathname.includes('/dashboard')) {
          // 在Dashboard页面，自动跳转到/new页面
          console.log('📍 在Dashboard页面，自动跳转到/new页面')
          window.location.href = '/new?from_extension=true'
        } else {
          // 在其他页面，设置标记并提示用户
          console.log('ℹ️ 在其他页面收到扩展数据，请手动前往/new页面')
        }
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
  localStorage.removeItem('candlebot_extension_metadata')
  sessionStorage.removeItem('candlebot_extension_image')
  sessionStorage.removeItem('candlebot_extension_image_format')

  // 清理URL参数
  const url = new URL(window.location)
  url.searchParams.delete('from_extension')
  url.searchParams.delete('image_data')
  url.searchParams.delete('image_format')
  url.searchParams.delete('pending_image_id')
  window.history.replaceState({}, '', url.toString())

  console.log('🧹 已清理扩展数据')
}

/**
 * 从本地中转API获取图片数据
 */
export async function fetchPendingImage(imageId) {
  console.log(`📡 从本地中转API获取图片数据，ID: ${imageId}`)

  try {
    const response = await fetch(`/api/pending-image?id=${imageId}`)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API请求失败: ${response.status} ${errorText}`)
    }

    const result = await response.json()

    if (!result.success) {
      throw new Error(`API返回错误: ${result.error || '未知错误'}`)
    }

    console.log(`✅ 成功获取图片数据，格式: ${result.imageFormat}, 数据长度: ${result.imageData?.length || 0}`)

    return {
      success: true,
      imageData: result.imageData,
      imageFormat: result.imageFormat,
      metadata: result.metadata,
      timestamp: result.timestamp
    }
  } catch (error) {
    console.error('❌ 从本地中转API获取图片数据失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

export default {
  checkExtensionRedirect,
  setupExtensionReceiver,
  getExtensionRedirectUrl,
  handleAutoAnalysis,
  cleanupExtensionData,
  fetchPendingImage
}