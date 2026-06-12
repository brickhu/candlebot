/**
 * Candlebot 浮动 K 线分析组件
 *
 * 交互逻辑：
 * 1. 在支持的 K 线网站上显示一个浮动按钮
 * 2. 点击按钮 → 在当前页面展开聊天窗口
 * 3. 自动截图并显示 K 线图分析摘要
 * 4. 用户可进行追问
 *
 * 使用 Shadow DOM 实现样式隔离
 *
 * 注意：widget-styles.js 必须在 manifest 中先于本脚本加载，
 * 它会在 window.__CB_WIDGET_STYLES 上注入 CSS 样式。
 */

// ==================== 站点配置 ====================
const SITE_CONFIGS = {
  'tradingview.com': {
    name: 'TradingView',
    platform: 'tradingview',
    chartPatterns: [
      /^\/chart\/[^/]+\/[^/]+\/?$/,
      /^\/symbol\/[^/]+\/[^/]+\/?$/
    ]
  },
  'aggr.trade': {
    name: 'Aggr.trade',
    platform: 'aggr',
    chartPatterns: [/^\/.*$/]
  },
  'dextools.io': {
    name: 'DEXTools',
    platform: 'tradingview',
    chartPatterns: [
      /^\/app\/[^/]+\/pair-explorer\/[^/]+\/?$/,
      /^\/app\/[^/]+\/pair\/[^/]+\/?$/
    ]
  },
  'dexscreener.com': {
    name: 'DEXScreener',
    platform: 'tradingview',
    chartPatterns: [
      /^\/[^/]+\/[^/]+\/?$/,
      /^\/[^/]+\/[^/]+\/[^/]+\/?$/
    ]
  },
  'birdeye.so': {
    name: 'Birdeye',
    platform: 'tradingview',
    chartPatterns: [
      /^\/[^/]+\/[^/]+\/?$/,
      /^\/token\/[^/]+\/?$/
    ]
  },
  'geckoterminal.com': {
    name: 'GeckoTerminal',
    platform: 'tradingview',
    chartPatterns: [
      /^\/[^/]+\/[^/]+\/[^/]+\/?$/,
      /^\/pools\/[^/]+\/?$/
    ]
  }
}

// ==================== 状态 ====================
const WIDGET_STATE = {
  CLOSED: 'closed',
  OPENING: 'opening',       // 面板正在展开（加载中）
  READY: 'ready',           // 面板展开，分析完成
  ANALYZING: 'analyzing',   // 正在分析
  ASKING: 'asking',         // 正在回答问题
  ERROR: 'error'
}

// ==================== 工具函数 ====================
function getSiteConfig(url) {
  try {
    const u = new URL(url)
    for (const [domain, config] of Object.entries(SITE_CONFIGS)) {
      if (u.hostname.includes(domain)) {
        return { domain, ...config }
      }
    }
  } catch (_) { /* ignore */ }
  return null
}

function isChartPage(url, siteConfig) {
  if (!siteConfig || !siteConfig.chartPatterns) return false
  try {
    const pathname = new URL(url).pathname
    return siteConfig.chartPatterns.some(p => p.test(pathname))
  } catch (_) { return false }
}

function formatTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function sendBgMsg(type, data = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, ...data }, (resp) => {
      if (chrome.runtime.lastError) {
        resolve({ success: false, error: chrome.runtime.lastError.message })
      } else {
        resolve(resp || { success: false, error: '空响应' })
      }
    })
  })
}

// ==================== 浮动组件类 ====================
class CandlebotFloatingWidget {
  constructor() {
    this.state = WIDGET_STATE.CLOSED
    this.isMinimized = false
    this.messages = []
    this.currentAnalysisId = null
    this.chartInfo = null
    this.siteConfig = null
    this.isOnChartPage = false

    // DOM 根
    this.host = null
    this.shadow = null

    // 元素引用
    this.fab = null
    this.panel = null
    this.messagesEl = null
    this.inputEl = null
    this.sendBtn = null
    this.loadingEl = null
    this.emptyEl = null

    this._bound = {}
  }

  // ==================== 初始化 ====================
  init() {
    console.log('[Candlebot Widget] 初始化...')

    // 检测当前站点
    this.siteConfig = getSiteConfig(window.location.href)
    this.isOnChartPage = this.siteConfig && isChartPage(window.location.href, this.siteConfig)

    console.log('[Candlebot Widget] 站点检测:', {
      url: window.location.href,
      site: this.siteConfig?.name || '不支持',
      isChartPage: this.isOnChartPage
    })

    if (!this.siteConfig) return // 不支持的站点，不注入

    // 创建 Shadow DOM
    this._createShadowRoot()

    // 渲染 FAB
    this._renderFab()

    // 预创建面板（但隐藏）
    this._renderPanel()

    // 绑定事件
    this._bindEvents()

    console.log('[Candlebot Widget] 初始化完成')
  }

  // ==================== Shadow DOM ====================
  _createShadowRoot() {
    this.host = document.createElement('div')
    this.host.id = 'candlebot-floating-widget'
    this.host.style.all = 'initial'
    this.shadow = this.host.attachShadow({ mode: 'closed' })

    // 注入样式
    const style = document.createElement('style')
    style.textContent = window.__CB_WIDGET_STYLES
    this.shadow.appendChild(style)

    // 容器
    this.container = this.shadow.appendChild(document.createElement('div'))

    // 挂载到页面
    document.body.appendChild(this.host)
  }

  // ==================== FAB ====================
  _renderFab() {
    const fab = document.createElement('button')
    fab.className = `cb-fab${this.isOnChartPage ? '' : ' cb-fab--inactive'}`
    fab.setAttribute('aria-label', 'Candlebot K线分析')

    // 图标
    const icon = document.createElement('span')
    icon.className = 'cb-fab__icon'
    icon.textContent = '📊'
    fab.appendChild(icon)

    // 状态点
    const dot = document.createElement('span')
    dot.className = `cb-fab__dot${this.isOnChartPage ? '' : ' cb-fab__dot--inactive'}`
    fab.appendChild(dot)

    this.container.appendChild(fab)
    this.fab = fab
  }

  // ==================== Chat Panel ====================
  _renderPanel() {
    const panel = document.createElement('div')
    panel.className = 'cb-panel'
    panel.style.display = 'none'

    // ── Header ──
    const header = document.createElement('div')
    header.className = 'cb-panel__header'

    const logo = document.createElement('div')
    logo.className = 'cb-panel__logo'
    logo.textContent = '📊'

    const titleWrap = document.createElement('div')
    titleWrap.style.flex = '1'

    const title = document.createElement('div')
    title.className = 'cb-panel__title'
    title.textContent = 'Candlebot'
    const subtitle = document.createElement('div')
    subtitle.className = 'cb-panel__subtitle'
    subtitle.textContent = this.siteConfig?.name || 'AI 分析助手'

    titleWrap.appendChild(title)
    titleWrap.appendChild(subtitle)

    const actions = document.createElement('div')
    actions.className = 'cb-panel__actions'

    const minBtn = document.createElement('button')
    minBtn.className = 'cb-panel__btn'
    minBtn.textContent = '─'
    minBtn.title = '最小化'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'cb-panel__btn'
    closeBtn.textContent = '✕'
    closeBtn.title = '关闭'

    actions.appendChild(minBtn)
    actions.appendChild(closeBtn)

    header.appendChild(logo)
    header.appendChild(titleWrap)
    header.appendChild(actions)
    panel.appendChild(header)

    // ── Messages ──
    const messages = document.createElement('div')
    messages.className = 'cb-panel__messages'
    panel.appendChild(messages)
    this.messagesEl = messages

    // ── Input ──
    const inputWrap = document.createElement('div')
    inputWrap.className = 'cb-panel__input'

    const textarea = document.createElement('textarea')
    textarea.className = 'cb-panel__textarea'
    textarea.placeholder = '输入你的问题...'
    textarea.rows = 1
    textarea.disabled = true

    const sendBtn = document.createElement('button')
    sendBtn.className = 'cb-panel__send'
    sendBtn.textContent = '➤'
    sendBtn.disabled = true

    inputWrap.appendChild(textarea)
    inputWrap.appendChild(sendBtn)
    panel.appendChild(inputWrap)

    this.inputEl = textarea
    this.sendBtn = sendBtn

    this.container.appendChild(panel)
    this.panel = panel

    // 引用子元素
    this.minBtn = minBtn
    this.closeBtn = closeBtn
  }

  // ==================== 事件绑定 ====================
  _bindEvents() {
    this._bound = {
      fabClick: this._onFabClick.bind(this),
      close: this._onClose.bind(this),
      minimize: this._onMinimize.bind(this),
      send: this._onSend.bind(this),
      inputKeydown: this._onInputKeydown.bind(this),
      inputInput: this._onInputInput.bind(this),
      dragStart: this._onDragStart.bind(this),
      drag: this._onDrag.bind(this),
      dragEnd: this._onDragEnd.bind(this)
    }

    this.fab.addEventListener('click', this._bound.fabClick)
    this.closeBtn.addEventListener('click', this._bound.close)
    this.minBtn.addEventListener('click', this._bound.minimize)
    this.sendBtn.addEventListener('click', this._bound.send)
    this.inputEl.addEventListener('keydown', this._bound.inputKeydown)
    this.inputEl.addEventListener('input', this._bound.inputInput)

    // 拖拽
    const header = this.panel.querySelector('.cb-panel__header')
    header.addEventListener('mousedown', this._bound.dragStart)
  }

  // ==================== FAB Click (Toggle Panel) ====================
  async _onFabClick() {
    if (!this.isOnChartPage) return

    if (this.state === WIDGET_STATE.CLOSED || this.panel.style.display === 'none') {
      await this._openPanel()
    } else {
      this._closePanel()
    }
  }

  // ==================== 打开面板 ====================
  async _openPanel() {
    console.log('[Candlebot Widget] 打开面板')

    this.state = WIDGET_STATE.OPENING
    this.fab.classList.add('cb-fab--open')
    this.panel.style.display = 'flex'

    // 检查是否有历史会话（暂不实现）
    // 直接开始自动化分析
    await this._startAutoAnalysis()
  }

  // ==================== 关闭面板 ====================
  _closePanel() {
    console.log('[Candlebot Widget] 关闭面板')
    this.state = WIDGET_STATE.CLOSED
    this.fab.classList.remove('cb-fab--open')
    this.panel.style.display = 'none'
    this.isMinimized = false
  }

  // ==================== 最小化 ====================
  _onMinimize() {
    this.isMinimized = !this.isMinimized
    this.panel.classList.toggle('cb-panel--minimized', this.isMinimized)
    this.minBtn.textContent = this.isMinimized ? '□' : '─'

    if (!this.isMinimized) {
      this._scrollToBottom()
    }
  }

  // ==================== 关闭按钮 ====================
  _onClose() {
    this._closePanel()
  }

  // ==================== 自动分析流程 ====================
  async _startAutoAnalysis() {
    console.log('[Candlebot Widget] 开始自动分析')

    this.state = WIDGET_STATE.ANALYZING
    this._showLoading({
      steps: [
        { label: '正在截图...', done: false },
        { label: '正在读取图表信息...', done: false },
        { label: 'AI 正在分析 K 线...', done: false },
        { label: '生成报告摘要...', done: false }
      ]
    })

    try {
      // Step 1: 截图
      this._updateLoadingStep(0, true)
      const screenshotResult = await sendBgMsg('CAPTURE_SCREENSHOT_CHART')
      if (!screenshotResult?.success) {
        throw new Error(screenshotResult?.error || '截图失败')
      }

      // Step 1 → 2
      this._updateLoadingStep(1, true)
      const chartInfoResult = await sendBgMsg('EXTRACT_CHART_INFO_FROM_TAB')
      this.chartInfo = chartInfoResult?.success ? chartInfoResult.info : null

      // Step 2 → 3: 发送分析请求
      this._updateLoadingStep(2, true)
      const rawBase64 = screenshotResult.dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')
      const analyzeResult = await sendBgMsg('ANALYZE_IMAGE_FROM_BG', {
        imageBase64: rawBase64,
        platform: this.siteConfig?.platform || 'tradingview',
        lang: 'zh',
        chartInfo: this.chartInfo
      })

      if (!analyzeResult?.success) {
        throw new Error(analyzeResult?.error || '分析请求失败')
      }

      // Step 3 → 4
      this._updateLoadingStep(3, true)

      this.currentAnalysisId = analyzeResult.record_id

      // 清除 loading，显示分析结果
      this._clearLoading()
      this._addSystemMessage('✅ K 线分析完成')

      // 添加分析结果消息
      this._addAnalysisResultMessage(analyzeResult)

      // 保存消息历史
      if (analyzeResult.analysis) {
        this.messages.push({ role: 'assistant', content: analyzeResult.analysis })
      }

      // 启用输入
      this.state = WIDGET_STATE.READY
      this.inputEl.disabled = false
      this.sendBtn.disabled = false
      this.inputEl.placeholder = '输入你的追问...'
      this.inputEl.focus()

    } catch (err) {
      console.error('[Candlebot Widget] 分析失败:', err)
      this._clearLoading()
      this._showError(err.message || '分析过程中发生错误')
      this.state = WIDGET_STATE.ERROR
    }
  }

  // ==================== 发送消息（追问） ====================
  async _onSend() {
    const text = this.inputEl.value.trim()
    if (!text || this.state === WIDGET_STATE.ASKING) return

    // 添加用户消息
    this._addUserMessage(text)
    this.inputEl.value = ''
    this._autoResizeTextarea()
    this.sendBtn.disabled = true
    this.inputEl.disabled = true

    this.state = WIDGET_STATE.ASKING
    this._addLoadingMessage()

    try {
      const result = await sendBgMsg('ASK_FOLLOW_UP', {
        analysisId: this.currentAnalysisId,
        question: text,
        chartInfo: this.chartInfo,
        siteUrl: window.location.href,
        siteName: this.siteConfig?.name
      })

      this._removeLoadingMessage()

      if (result?.success && result.answer) {
        this._addAssistantMessage(result.answer)
        this.messages.push({ role: 'user', content: text })
        this.messages.push({ role: 'assistant', content: result.answer })
      } else {
        this._addAssistantMessage('抱歉，回答问题时出现了问题。请稍后重试。')
        this._addErrorMessage(result?.error || '请求失败')
      }
    } catch (err) {
      this._removeLoadingMessage()
      this._addAssistantMessage('网络请求失败，请检查连接后重试。')
    }

    this.state = WIDGET_STATE.READY
    this.inputEl.disabled = false
    this.sendBtn.disabled = false
    this.inputEl.focus()
  }

  _onInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      this._onSend()
    }
  }

  _onInputInput() {
    this._autoResizeTextarea()
    this.sendBtn.disabled = !this.inputEl.value.trim()
  }

  _autoResizeTextarea() {
    this.inputEl.style.height = 'auto'
    this.inputEl.style.height = Math.min(this.inputEl.scrollHeight, 120) + 'px'
  }

  // ==================== 消息渲染 ====================
  _addUserMessage(text) {
    const msg = this._createMessageBubble(text, 'user')
    this.messagesEl.appendChild(msg)
    this._scrollToBottom()
  }

  _addAssistantMessage(text) {
    const msg = this._createMessageBubble(text, 'assistant')
    this.messagesEl.appendChild(msg)
    this._scrollToBottom()
  }

  _addSystemMessage(text) {
    const msg = this._createMessageBubble(text, 'system')
    this.messagesEl.appendChild(msg)
    this._scrollToBottom()
  }

  _addErrorMessage(text) {
    const msg = document.createElement('div')
    msg.className = 'cb-msg cb-msg--error'
    msg.innerHTML = `<div class="cb-msg__bubble">⚠️ ${this._escapeHtml(text)}</div>`
    this.messagesEl.appendChild(msg)
    this._scrollToBottom()
  }

  _addLoadingMessage() {
    if (this._loadingMsgEl) return
    this._loadingMsgEl = document.createElement('div')
    this._loadingMsgEl.className = 'cb-msg cb-msg--assistant'
    this._loadingMsgEl.innerHTML = `
      <div class="cb-msg__bubble" style="display:flex;align-items:center;gap:8px">
        <div style="width:12px;height:12px;border:2px solid var(--cb-border);border-top-color:var(--cb-primary);border-radius:50%;animation:cb-spin 0.8s linear infinite"></div>
        <span>思考中...</span>
      </div>`
    this.messagesEl.appendChild(this._loadingMsgEl)
    this._scrollToBottom()
  }

  _removeLoadingMessage() {
    if (this._loadingMsgEl) {
      this._loadingMsgEl.remove()
      this._loadingMsgEl = null
    }
  }

  _createMessageBubble(text, role) {
    const wrapper = document.createElement('div')
    wrapper.className = `cb-msg cb-msg--${role}`

    const bubble = document.createElement('div')
    bubble.className = 'cb-msg__bubble'
    // 简单 markdown 渲染：把 **text** 转 <strong>
    bubble.innerHTML = this._renderMessageText(text)

    wrapper.appendChild(bubble)

    const time = document.createElement('div')
    time.className = 'cb-msg__time'
    time.textContent = formatTime()
    wrapper.appendChild(time)

    return wrapper
  }

  _renderMessageText(text) {
    if (!text) return ''
    // 转义 HTML，然后处理简单的标记
    let html = this._escapeHtml(text)
    // 加粗 **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // 代码 `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    // 换行
    html = html.replace(/\n/g, '<br>')
    return html
  }

  _escapeHtml(str) {
    const div = document.createElement('div')
    div.textContent = str
    return div.innerHTML
  }

  _scrollToBottom() {
    requestAnimationFrame(() => {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight
    })
  }

  // ==================== 分析结果渲染 ====================
  _addAnalysisResultMessage(result) {
    const wrapper = document.createElement('div')
    wrapper.className = 'cb-msg cb-msg--assistant'

    let html = ''

    // 评级徽章
    const rating = result.rating || ''
    const ratingScore = result.rating_score
    let ratingLabel = '中性'
    let ratingClass = 'cb-rating--neutral'
    if (typeof ratingScore === 'number') {
      if (ratingScore >= 70) { ratingLabel = '看涨'; ratingClass = 'cb-rating--bullish' }
      else if (ratingScore <= 30) { ratingLabel = '看跌'; ratingClass = 'cb-rating--bearish' }
    } else if (rating) {
      if (rating.includes('涨') || rating.toLowerCase().includes('bull')) { ratingLabel = '看涨'; ratingClass = 'cb-rating--bullish' }
      else if (rating.includes('跌') || rating.toLowerCase().includes('bear')) { ratingLabel = '看跌'; ratingClass = 'cb-rating--bearish' }
    }

    // 交易对信息
    const pair = result.pair || this.chartInfo?.symbol || '未知'
    const timeframe = result.timeframe || this.chartInfo?.timeframe || '-'

    html += `<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">`
    html += `<span style="font-weight:700;font-size:15px">${this._escapeHtml(pair)}</span>`
    html += `<span class="cb-rating ${ratingClass}">${ratingLabel}${ratingScore != null ? ` ${ratingScore}` : ''}</span>`
    html += `</div>`

    // 价格和时间框架
    if (result.price) {
      html += `<div class="cb-kv"><span class="cb-kv__key">价格</span><span class="cb-kv__value">$${this._escapeHtml(String(result.price))}</span></div>`
    }
    html += `<div class="cb-kv"><span class="cb-kv__key">时间框架</span><span class="cb-kv__value">${this._escapeHtml(timeframe)}</span></div>`
    if (result.exchange) {
      html += `<div class="cb-kv"><span class="cb-kv__key">交易所</span><span class="cb-kv__value">${this._escapeHtml(result.exchange)}</span></div>`
    }

    // 分析摘要
    if (result.summary) {
      html += `<div class="cb-section"><div class="cb-section__title">📋 摘要</div><div>${this._renderMessageText(result.summary)}</div></div>`
    }

    // 完整分析报告
    if (result.analysis) {
      html += `<div class="cb-section"><div class="cb-section__title">📊 分析报告</div><div>${this._renderMessageText(result.analysis)}</div></div>`
    }

    // 底部提示
    html += `<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--cb-border);font-size:11px;color:var(--cb-text-muted)">💡 你可以继续追问关于该图表的问题</div>`

    const bubble = document.createElement('div')
    bubble.className = 'cb-msg__bubble'
    bubble.innerHTML = html

    wrapper.appendChild(bubble)

    const time = document.createElement('div')
    time.className = 'cb-msg__time'
    time.textContent = formatTime()
    wrapper.appendChild(time)

    this.messagesEl.appendChild(wrapper)
    this._scrollToBottom()
  }

  // ==================== Loading 状态 ====================
  _showLoading(opts = {}) {
    this._clearLoading()
    const steps = opts.steps || []
    if (steps.length === 0) {
      // 简单 loading
      this.loadingEl = document.createElement('div')
      this.loadingEl.className = 'cb-loading'
      this.loadingEl.innerHTML = `
        <div class="cb-loading__spinner"></div>
        <div class="cb-loading__text">正在分析 K 线图...</div>
      `
      this.messagesEl.appendChild(this.loadingEl)
      return
    }

    this.loadingEl = document.createElement('div')
    this.loadingEl.className = 'cb-loading'
    this.loadingEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div class="cb-loading__spinner" style="width:28px;height:28px"></div>
        <div>
          <div class="cb-loading__text">AI 智能分析中</div>
          <div class="cb-loading__sub">正在处理 K 线图表数据</div>
        </div>
      </div>
      <div class="cb-progress" id="cb-progress-steps">
        ${steps.map((s, i) => `
          <div class="cb-progress__step ${i === 0 ? 'cb-progress__step--active' : ''}" data-step="${i}">
            <span class="cb-progress__icon">${i === 0 ? '●' : '○'}</span>
            <span>${s.label}</span>
          </div>
        `).join('')}
      </div>
    `
    this.messagesEl.appendChild(this.loadingEl)
  }

  _updateLoadingStep(index, done) {
    if (!this.loadingEl) return
    const stepEls = this.loadingEl.querySelectorAll('.cb-progress__step')
    if (stepEls[index]) {
      stepEls[index].classList.remove('cb-progress__step--active')
      if (done) {
        stepEls[index].classList.add('cb-progress__step--done')
        stepEls[index].querySelector('.cb-progress__icon').textContent = '✓'
      }
      // 激活下一步
      if (stepEls[index + 1]) {
        stepEls[index + 1].classList.add('cb-progress__step--active')
        stepEls[index + 1].querySelector('.cb-progress__icon').textContent = '●'
      }
    }
  }

  _clearLoading() {
    if (this.loadingEl) {
      this.loadingEl.remove()
      this.loadingEl = null
    }
    this._removeLoadingMessage()
  }

  // ==================== 错误状态 ====================
  _showError(message) {
    this._addErrorMessage(message)
    // 同时显示重试按钮
    const retryWrapper = document.createElement('div')
    retryWrapper.className = 'cb-msg cb-msg--system'
    retryWrapper.innerHTML = `
      <div class="cb-msg__bubble" style="display:flex;gap:8px;align-items:center">
        <button style="padding:6px 16px;border:1px solid var(--cb-border);border-radius:6px;background:var(--cb-surface);color:var(--cb-text);cursor:pointer;font-size:12px">🔄 重试</button>
      </div>
    `
    retryWrapper.querySelector('button').addEventListener('click', () => {
      retryWrapper.remove()
      this._startAutoAnalysis()
    })
    this.messagesEl.appendChild(retryWrapper)
    this._scrollToBottom()
  }

  // ==================== 拖拽 ====================
  _onDragStart(e) {
    if (e.target.tagName === 'BUTTON') return
    this._dragOffsetX = e.clientX - this.panel.getBoundingClientRect().left
    this._dragOffsetY = e.clientY - this.panel.getBoundingClientRect().top
    document.addEventListener('mousemove', this._bound.drag)
    document.addEventListener('mouseup', this._bound.dragEnd)
    this.panel.style.transition = 'none'
  }

  _onDrag(e) {
    const left = Math.max(8, Math.min(window.innerWidth - this.panel.offsetWidth - 8, e.clientX - this._dragOffsetX))
    const top = Math.max(8, Math.min(window.innerHeight - this.panel.offsetHeight - 8, e.clientY - this._dragOffsetY))
    this.panel.style.left = left + 'px'
    this.panel.style.right = 'auto'
    this.panel.style.top = top + 'px'
    this.panel.style.bottom = 'auto'
  }

  _onDragEnd() {
    document.removeEventListener('mousemove', this._bound.drag)
    document.removeEventListener('mouseup', this._bound.dragEnd)
    this.panel.style.transition = ''
  }

  // ==================== 清理 ====================
  destroy() {
    if (this.host && this.host.parentNode) {
      this.host.parentNode.removeChild(this.host)
    }
  }
}

// ==================== 启动 ====================
let widget = null

function startWidget() {
  // 只在支持的站点注入
  const config = getSiteConfig(window.location.href)
  if (!config) {
    console.log('[Candlebot Widget] 当前站点不支持，跳过注入')
    return
  }

  console.log('[Candlebot Widget] 在', config.name, '注入浮动组件')
  widget = new CandlebotFloatingWidget()
  widget.init()
}

// 确保在 DOM 就绪后启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startWidget)
} else {
  startWidget()
}

// 导出以便调试
window.__candlebotWidget = widget
