import { createSignal, Show, onMount } from 'solid-js'
import { api } from '../lib/api'
import { checkExtensionRedirect } from '../lib/extension'

const NewAnalysisModal = ({ isOpen, onClose, onSuccess }) => {
  const [selectedImage, setSelectedImage] = createSignal(null)
  const [imagePreview, setImagePreview] = createSignal(null)
  const [platform, setPlatform] = createSignal('tradingview')
  const [language, setLanguage] = createSignal('zh')
  const [isSubmitting, setIsSubmitting] = createSignal(false)
  const [error, setError] = createSignal(null)
  const [fromExtension, setFromExtension] = createSignal(false)

  // 检查是否从扩展跳转并预填充图片
  onMount(() => {
    const redirectInfo = checkExtensionRedirect()
    if (redirectInfo.fromExtension && redirectInfo.imageData) {
      console.log('📸 从扩展获取预填充图片数据，来源:', redirectInfo.source)
      setFromExtension(true)

      // 创建虚拟文件对象用于预览
      const base64ToBlob = (base64) => {
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

        return new Blob(byteArrays, { type: 'image/png' })
      }

      try {
        const blob = base64ToBlob(redirectInfo.imageData)
        const file = new File([blob], 'extension_screenshot.png', { type: 'image/png' })
        setSelectedImage(file)
        setImagePreview(`data:image/png;base64,${redirectInfo.imageData}`)

        console.log('✅ 已设置扩展图片预览')
      } catch (err) {
        console.error('❌ 处理扩展图片数据失败:', err)
        setError('处理扩展图片数据失败，请手动上传图片')
      }
    }
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

  const handleClose = () => {
    if (!isSubmitting()) {
      setSelectedImage(null)
      setImagePreview(null)
      setError(null)
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