import { createSignal, Show, onMount } from 'solid-js'
import { api } from '../lib/api'
import { checkExtensionRedirect, fetchPendingImage } from '../lib/extension'
import { useAuth } from '../contexts/auth'

const NewAnalysisModal = ({ isOpen, onClose, onSuccess }) => {
  const auth = useAuth()
  const [selectedImage, setSelectedImage] = createSignal(null)
  const [imagePreview, setImagePreview] = createSignal(null)
  const [platform, setPlatform] = createSignal('tradingview')
  const [language, setLanguage] = createSignal('zh')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [error, setError] = createSignal(null)
  const [fromExtension, setFromExtension] = createSignal(false)
  const [showLoginPrompt, setShowLoginPrompt] = createSignal(false)

  // 处理扩展图片数据的函数
  const processExtensionImage = (imageData, imageFormat = 'png', source = 'unknown') => {
    console.log('📸 处理扩展图片数据，来源:', source, '数据长度:', imageData?.length, '图片格式:', imageFormat)

    if (!imageData) {
      console.error('❌ 没有图片数据可处理')
      return false
    }

    // 创建虚拟文件对象用于预览
    const base64ToBlob = (base64, format = 'png') => {
      console.log('base64ToBlob输入长度:', base64.length, '前50字符:', base64.substring(0, 50), '图片格式:', format)
      try {
        const byteCharacters = atob(base64)
        const byteArrays = []

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512)
          const byteNumbers = new Array(slice.length)
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          byteArrays.push(byteArray)
        }

        const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
        const blob = new Blob(byteArrays, { type: mimeType })
        console.log('创建的Blob大小:', blob.size, '类型:', blob.type)
        return blob
      } catch (err) {
        console.error('base64ToBlob错误:', err)
        throw err
      }
    }

    try {
      console.log('开始处理扩展图片数据，数据长度:', imageData.length)
      console.log('数据前100字符:', imageData.substring(0, 100))

      const format = imageFormat || 'png'
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
      const fileName = format === 'jpeg' ? 'extension_screenshot.jpg' : 'extension_screenshot.png'

      console.log('使用的图片格式:', format, 'MIME类型:', mimeType)

      const blob = base64ToBlob(imageData, format)

      const file = new File([blob], fileName, { type: mimeType })
      console.log('创建的File:', file.name, '大小:', file.size, '类型:', file.type)

      setSelectedImage(file)
      setFromExtension(true)
      // 重新构建完整的data URL用于预览
      const previewUrl = `data:${mimeType};base64,${imageData}`
      console.log('生成的预览URL长度:', previewUrl.length)
      setImagePreview(previewUrl)

      console.log('✅ 已设置扩展图片预览，来源:', source)
      return true
    } catch (err) {
      console.error('❌ 处理扩展图片数据失败:', err)
      console.error('错误详情:', err.message, err.stack)
      console.error('错误发生时数据长度:', imageData?.length)
      console.error('错误发生时数据前100字符:', imageData?.substring(0, 100))
      setError('处理扩展图片数据失败，请手动上传图片')
      return false
    }
  }

  // 检查是否从扩展跳转并预填充图片
  onMount(async () => {
    const redirectInfo = checkExtensionRedirect()
    console.log('扩展跳转检查结果:', redirectInfo)

    if (redirectInfo.fromExtension) {
      // 情况1：有直接的图片数据
      if (redirectInfo.imageData) {
        processExtensionImage(redirectInfo.imageData, redirectInfo.imageFormat, redirectInfo.source)
      }
      // 情况2：有pending_image_id，需要从本地中转API获取
      else if (redirectInfo.pendingImageId) {
        console.log(`🔄 从本地中转API获取图片，ID: ${redirectInfo.pendingImageId}`)

        try {
          const result = await fetchPendingImage(redirectInfo.pendingImageId)

          if (result.success && result.imageData) {
            const success = processExtensionImage(
              result.imageData,
              result.imageFormat,
              `local_api_${redirectInfo.pendingImageId}`
            )
            if (success) {
              setError(null)
              console.log('✅ 成功从本地中转API加载图片')
            }
          } else {
            console.error('❌ 从本地中转API获取图片失败:', result.error)
            setError('无法从服务器获取图片数据，请手动上传图片')
          }
        } catch (error) {
          console.error('❌ 获取图片数据时发生错误:', error)
          setError('获取图片数据时发生错误，请手动上传图片')
        }
      }
      // 情况3：从扩展跳转但没有图片数据
      else if (!redirectInfo.imageData && !redirectInfo.pendingImageId) {
        console.log('⚠️ 从扩展跳转但没有图片数据')
        setError('从扩展跳转但没有收到图片数据，请手动上传图片')
      }
    }

    // 检查是否从Dashboard跳转并预填充图片
    const dashboardImageData = sessionStorage.getItem('dashboard_selected_image')
    if (dashboardImageData) {
      console.log('📸 检测到从Dashboard传递的图片数据')

      try {
        // 创建File对象
        const fileName = sessionStorage.getItem('dashboard_selected_file_name') || 'dashboard_selected.png'
        const fileType = sessionStorage.getItem('dashboard_selected_file_type') || 'image/png'
        const fileSize = parseInt(sessionStorage.getItem('dashboard_selected_file_size') || '0')

        console.log('文件信息:', { fileName, fileType, fileSize })

        // 将base64转换为Blob
        const base64Data = dashboardImageData
        const byteCharacters = atob(base64Data.split(',')[1])
        const byteArrays = []

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512)
          const byteNumbers = new Array(slice.length)
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i)
          }
          const byteArray = new Uint8Array(byteNumbers)
          byteArrays.push(byteArray)
        }

        const blob = new Blob(byteArrays, { type: fileType })
        const file = new File([blob], fileName, { type: fileType })

        console.log('✅ 从Dashboard数据创建File对象:', file.name, '大小:', file.size, '类型:', file.type)

        // 设置图片
        setSelectedImage(file)
        setImagePreview(dashboardImageData)
        setError(null)

        // 清理sessionStorage
        sessionStorage.removeItem('dashboard_selected_image')
        sessionStorage.removeItem('dashboard_selected_file_name')
        sessionStorage.removeItem('dashboard_selected_file_type')
        sessionStorage.removeItem('dashboard_selected_file_size')

        console.log('✅ 已加载Dashboard传递的图片并清理sessionStorage')
      } catch (error) {
        console.error('❌ 处理Dashboard图片数据失败:', error)
        setError('处理图片数据失败，请手动上传图片')

        // 清理无效数据
        sessionStorage.removeItem('dashboard_selected_image')
        sessionStorage.removeItem('dashboard_selected_file_name')
        sessionStorage.removeItem('dashboard_selected_file_type')
        sessionStorage.removeItem('dashboard_selected_file_size')
      }
    }

    // 检查是否有待恢复的分析数据（用户登录后返回）
    const pendingImageData = sessionStorage.getItem('candlebot_pending_analysis_image')
    const pendingMetadata = sessionStorage.getItem('candlebot_pending_analysis_metadata')

    if (pendingImageData) {
      console.log('🔍 发现待恢复的分析图片数据')
      try {
        const metadata = pendingMetadata ? JSON.parse(pendingMetadata) : {}

        // 处理图片数据
        const success = processExtensionImage(
          pendingImageData,
          'png', // 默认格式
          'pending_restore'
        )

        if (success) {
          // 恢复设置
          if (metadata.platform) setPlatform(metadata.platform)
          if (metadata.language) setLanguage(metadata.language)
          if (metadata.fromExtension) setFromExtension(metadata.fromExtension)

          console.log('✅ 已恢复待分析图片数据')

          // 清理存储的数据
          sessionStorage.removeItem('candlebot_pending_analysis_image')
          sessionStorage.removeItem('candlebot_pending_analysis_metadata')
        }
      } catch (error) {
        console.error('恢复待分析图片数据失败:', error)
        // 清理无效数据
        sessionStorage.removeItem('candlebot_pending_analysis_image')
        sessionStorage.removeItem('candlebot_pending_analysis_metadata')
      }
    }

    // 监听扩展数据到达事件（实时接收）
    window.addEventListener('candlebot_extension_data_received', (event) => {
      console.log('🎯 收到扩展数据到达事件:', event.detail)
      const { imageData, imageFormat, metadata } = event.detail
      if (imageData) {
        const success = processExtensionImage(imageData, imageFormat, 'real_time_event')
        if (success) {
          setError(null)
        }
      }
    })
  })

  const handleImageSelect = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件（PNG、JPG、JPEG）')
      return
    }

    // 检查文件大小（限制5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB')
      return
    }

    setSelectedImage(file)
    setError(null)

    // 创建预览
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()

    const file = event.dataTransfer.files[0]
    if (file) {
      const inputEvent = { target: { files: [file] } }
      handleImageSelect(inputEvent)
    }
  }

  const handleSubmit = async () => {
    if (!selectedImage()) {
      setError('请选择要分析的图片')
      return
    }

    // 简单直接地检查用户是否已登录：检查是否有认证token
    const hasAuthToken = api.isAuthenticated()

    console.log('🔍 提交前检查登录状态:', {
      hasAuthToken,
      localStorageToken: localStorage.getItem('auth_token'),
      authUser: auth.user ? auth.user() : null
    })

    if (!hasAuthToken) {
      console.log('⚠️ 用户未登录，显示登录提示')
      setShowLoginPrompt(true)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // 读取图片为base64
      const reader = new FileReader()
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = (e) => {
          // 移除data:image/png;base64,前缀
          const base64 = e.target.result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
      })
      reader.readAsDataURL(selectedImage())

      const imageBase64 = await base64Promise
      console.log('📸 提交图片分析，大小:', imageBase64.length, '字符')

      const response = await api.analyzeImage(imageBase64, platform(), language())
      console.log('📡 分析响应:', response)

      if (response.success && response.data) {
        console.log('✅ 分析成功，记录ID:', response.data.record_id)

        // 关闭弹窗
        onClose()

        // 跳转到分析结果页面
        if (response.data.record_id) {
          onSuccess(response.data.record_id)
        } else {
          // 如果没有record_id，跳转到仪表板
          onSuccess(null)
        }
      } else {
        console.error('❌ 分析失败:', response.error)
        setError(response.error?.message || '分析失败，请重试')
      }
    } catch (error) {
      console.error('❌ 提交分析时发生错误:', error)
      setError('提交分析时发生错误，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLogin = () => {
    console.log('跳转到登录页面')
    // 保存当前图片数据到sessionStorage，以便登录后恢复
    if (selectedImage() && imagePreview()) {
      try {
        // 提取base64数据
        const base64Data = imagePreview().split(',')[1]
        sessionStorage.setItem('candlebot_pending_analysis_image', base64Data)
        sessionStorage.setItem('candlebot_pending_analysis_metadata', JSON.stringify({
          platform: platform(),
          language: language(),
          fromExtension: fromExtension(),
          timestamp: new Date().toISOString()
        }))
        console.log('已保存待分析图片数据到sessionStorage')
      } catch (error) {
        console.error('保存待分析图片数据失败:', error)
      }
    }

    // 跳转到登录页面
    window.location.href = `/login?redirect=${encodeURIComponent('/new')}`
  }

  const handleRegister = () => {
    console.log('跳转到注册页面')
    // 同样保存数据
    if (selectedImage() && imagePreview()) {
      try {
        const base64Data = imagePreview().split(',')[1]
        sessionStorage.setItem('candlebot_pending_analysis_image', base64Data)
        sessionStorage.setItem('candlebot_pending_analysis_metadata', JSON.stringify({
          platform: platform(),
          language: language(),
          fromExtension: fromExtension(),
          timestamp: new Date().toISOString()
        }))
        console.log('已保存待分析图片数据到sessionStorage')
      } catch (error) {
        console.error('保存待分析图片数据失败:', error)
      }
    }

    window.location.href = `/register?redirect=${encodeURIComponent('/new')}`
  }

  const handleCancelLogin = () => {
    setShowLoginPrompt(false)
  }

  const handleClose = () => {
    if (!isSubmitting()) {
      setSelectedImage(null)
      setImagePreview(null)
      setError(null)
      setShowLoginPrompt(false)
      onClose()
    }
  }

  return (
    <Show when={isOpen()}>
      {/* Backdrop */}
      <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        {/* Modal */}
        <div class="bg-bg border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div class="border-b border-border p-6">
            <div class="flex items-center justify-between">
              <h2 class="text-2xl font-bold">新建分析</h2>
              <button
                onClick={handleClose}
                disabled={isSubmitting()}
                class="w-8 h-8 flex items-center justify-center text-muted hover:text-foreground transition-colors disabled:opacity-50"
              >
                ✕
              </button>
            </div>
            <p class="text-sm text-muted mt-2">
              上传K线图表截图进行分析，支持aggr.trade和TradingView图表
            </p>
          </div>

          {/* Content */}
          <div class="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Browser Extension Notice */}
            <div class="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div class="flex items-start gap-3">
                <div class="text-blue-400 text-xl">🔌</div>
                <div>
                  <h3 class="font-bold text-blue-400 mb-1">推荐使用浏览器扩展</h3>
                  <p class="text-sm text-blue-300/80">
                    安装Candlebot浏览器扩展可以一键截取图表并直接分析，无需手动上传图片。
                  </p>
                  <a
                    href="https://chrome.google.com/webstore/detail/candlebot-chart-analyzer"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-block mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    → 安装Chrome扩展
                  </a>
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <div class="mb-6">
              <label class="block text-sm font-medium mb-3">上传图表截图</label>
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                class={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  selectedImage()
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary'
                }`}
              >
                <Show
                  when={imagePreview()}
                  fallback={
                    <>
                      <div class="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="text-2xl">📸</span>
                      </div>
                      <p class="font-medium mb-2">拖放图片到这里，或点击选择文件</p>
                      <p class="text-sm text-muted mb-4">
                        支持PNG、JPG、JPEG格式，最大5MB
                      </p>
                      <label class="px-6 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors cursor-pointer inline-block">
                        选择图片
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          class="hidden"
                        />
                      </label>
                    </>
                  }
                >
                  <div class="space-y-4">
                    <div class="flex justify-center">
                      <img
                        src={imagePreview()}
                        alt="预览"
                        class="max-h-48 rounded-lg border border-border"
                      />
                    </div>
                    <div class="flex items-center justify-center gap-3">
                      <label class="px-4 py-2 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-dark transition-colors cursor-pointer text-sm">
                        更换图片
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          class="hidden"
                        />
                      </label>
                      <button
                        onClick={() => {
                          setSelectedImage(null)
                          setImagePreview(null)
                        }}
                        class="px-4 py-2 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-dark transition-colors text-sm"
                      >
                        移除图片
                      </button>
                    </div>
                  </div>
                </Show>
              </div>
            </div>

            {/* Settings */}
            <div class="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-medium mb-3">图表平台</label>
                <div class="flex gap-2">
                  {[
                    { value: 'tradingview', label: 'TradingView', icon: '📈' },
                    { value: 'aggr', label: 'aggr.trade', icon: '🔥' },
                  ].map((option) => (
                    <button
                      type="button"
                      onClick={() => setPlatform(option.value)}
                      class={`flex-1 px-4 py-3 border rounded-lg font-medium transition-colors ${
                        platform() === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      <div class="flex items-center justify-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium mb-3">报告语言</label>
                <div class="flex gap-2">
                  {[
                    { value: 'zh', label: '中文', icon: '🇨🇳' },
                    { value: 'en', label: 'English', icon: '🇺🇸' },
                  ].map((option) => (
                    <button
                      type="button"
                      onClick={() => setLanguage(option.value)}
                      class={`flex-1 px-4 py-3 border rounded-lg font-medium transition-colors ${
                        language() === option.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      <div class="flex items-center justify-center gap-2">
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Login Prompt */}
            <Show when={showLoginPrompt()}>
              <div class="mb-6 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div class="flex items-start gap-4">
                  <div class="text-yellow-400 text-2xl">🔒</div>
                  <div class="flex-1">
                    <h3 class="font-bold text-yellow-400 mb-2">需要登录</h3>
                    <p class="text-sm text-yellow-300/80 mb-4">
                      提交分析需要登录账户。请登录或注册新账户继续。
                    </p>
                    <div class="flex gap-3">
                      <button
                        onClick={handleLogin}
                        class="px-5 py-2.5 bg-yellow-500 text-bg rounded-lg font-medium hover:bg-yellow-600 transition-colors flex items-center gap-2"
                      >
                        <span>登录</span>
                      </button>
                      <button
                        onClick={handleRegister}
                        class="px-5 py-2.5 bg-surface border border-yellow-500/30 text-yellow-400 rounded-lg font-medium hover:bg-yellow-500/10 transition-colors"
                      >
                        注册
                      </button>
                      <button
                        onClick={handleCancelLogin}
                        class="px-5 py-2.5 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-dark transition-colors"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Show>

            {/* Error Message */}
            <Show when={error()}>
              <div class="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div class="flex items-center gap-2 text-red-400">
                  <span>⚠️</span>
                  <span>{error()}</span>
                </div>
              </div>
            </Show>
          </div>

          {/* Footer */}
          <div class="border-t border-border p-6">
            <div class="flex items-center justify-between">
              <button
                onClick={handleClose}
                disabled={isSubmitting()}
                class="px-6 py-3 bg-surface border border-border text-foreground rounded-lg font-medium hover:bg-surface-dark transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedImage() || isSubmitting()}
                class="px-6 py-3 bg-primary text-bg rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Show when={isSubmitting()} fallback="提交分析">
                  <div class="w-4 h-4 border-2 border-bg border-t-transparent rounded-full animate-spin"></div>
                  分析中...
                </Show>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  )
}

export default NewAnalysisModal