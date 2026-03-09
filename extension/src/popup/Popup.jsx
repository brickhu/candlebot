// src/popup/Popup.jsx - 重构版本
import { createSignal, createEffect, Show } from 'solid-js'

const API_BASE = 'https://candelbot-backend-production.up.railway.app'

// 用户状态管理
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = createSignal(false)
  const [user, setUser] = createSignal(null)
  const [loading, setLoading] = createSignal(true)
  const [token, setToken] = createSignal(null)

  // 从存储加载用户状态
  createEffect(() => {
    chrome.storage.local.get(['auth_token', 'user_info'], (result) => {
      if (result.auth_token && result.user_info) {
        setToken(result.auth_token)
        setUser(result.user_info)
        setIsAuthenticated(true)
      }
      setLoading(false)
    })
  })

  // 打开Dashboard
  const openDashboard = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') })
  }

  // 打开登录页面
  const openLogin = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html#/login') })
  }

  // 登出
  const logout = () => {
    chrome.storage.local.remove(['auth_token', 'user_info'])
    setIsAuthenticated(false)
    setUser(null)
    setToken(null)
  }

  return {
    isAuthenticated,
    user,
    loading,
    token,
    openDashboard,
    openLogin,
    logout
  }
}

// 分析功能
function useAnalysis() {
  const auth = useAuth()
  const [platform, setPlatform] = createSignal(null)
  const [lang, setLang] = createSignal('zh')
  const [state, setState] = createSignal('idle') // idle | capturing | analyzing | done | error
  const [result, setResult] = createSignal(null)
  const [errorMsg, setErrorMsg] = createSignal('')
  const [screenshot, setScreenshot] = createSignal(null)
  const [copied, setCopied] = createSignal(false)

  // 获取当前平台
  createEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PLATFORM' }, res => {
      setPlatform(res?.platform ?? null)
    })
  })

  // 压缩图片
  function compressImage(dataUrl) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const MAX_WIDTH = 1280
        const quality = 0.85

        let w = img.width
        let h = img.height

        if (w > MAX_WIDTH) {
          h = Math.round(h * MAX_WIDTH / w)
          w = MAX_WIDTH
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)

        const compressed = canvas.toDataURL('image/jpeg', quality)
        resolve(compressed)
      }
      img.src = dataUrl
    })
  }

  // 开始分析
  async function startAnalysis() {
    if (!auth.isAuthenticated()) {
      auth.openLogin()
      return
    }

    setState('capturing')
    setErrorMsg('')
    setResult(null)

    const captureRes = await new Promise(resolve =>
      chrome.runtime.sendMessage({ type: 'CAPTURE' }, resolve)
    )

    if (captureRes?.error) {
      setErrorMsg('截图失败：' + captureRes.error)
      setState('error')
      return
    }

    // 压缩图片
    const compressed = await compressImage(captureRes.dataUrl)
    setScreenshot(compressed)
    setState('analyzing')

    const base64 = compressed.replace(/^data:image\/jpeg;base64,/, '')

    try {
      const resp = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token()}`
        },
        body: JSON.stringify({
          image_base64: base64,
          platform: platform() || 'tradingview',
          lang: lang()
        })
      })

      if (resp.status === 401) {
        setErrorMsg('登录已过期，请重新登录')
        auth.logout()
        setState('error')
        return
      }

      if (resp.status === 429) {
        const data = await resp.json()
        setErrorMsg(lang() === 'zh'
          ? (data.detail?.message || '今日免费次数已用完')
          : (data.detail?.message_en || 'Daily limit reached'))
        setState('error')
        return
      }

      if (!resp.ok) throw new Error(`服务器错误 ${resp.status}`)

      const data = await resp.json()
      setResult(data)
      setState('done')

      // 刷新用户信息
      chrome.storage.local.get(['user_info'], (result) => {
        if (result.user_info) {
          result.user_info.quota_remaining = data.remaining_today
          chrome.storage.local.set({ user_info: result.user_info })
        }
      })

    } catch (e) {
      setErrorMsg(lang() === 'zh' ? 'AI分析失败，请重试' : 'Analysis failed, please retry')
      setState('error')
    }
  }

  // 分享结果
  async function shareResult() {
    if (!result()) return
    const m = result().meta
    const text = `${m.pair || ''} ${m.rating || ''}\n\n${m.summary || ''}\n\n📊 Candlebot · K线专家 | candlebot.trade`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return {
    platform,
    lang,
    setLang,
    state,
    result,
    errorMsg,
    screenshot,
    copied,
    startAnalysis,
    shareResult
  }
}

// 评级样式
function ratingClass(score) {
  const s = parseInt(score) || 0
  if (s >= 2)  return { bg: 'bg-green/10', border: 'border-green/30', text: 'text-green' }
  if (s <= -2) return { bg: 'bg-red/10',   border: 'border-red/30',   text: 'text-red'   }
  return         { bg: 'bg-neutral/10', border: 'border-neutral/30', text: 'text-neutral' }
}

// Markdown解析
function parseMarkdown(md) {
  if (!md) return ''
  return md
    .replace(/^## (.+)$/gm, '<h2 class="text-xs font-bold text-muted uppercase tracking-widest mt-4 mb-1.5 border-b border-border pb-1">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-text font-semibold">$1</strong>')
    .replace(/^(\|.+\|)$/gm, (row) => {
      const cells = row.split('|').filter(Boolean).map(c => c.trim())
      if (cells.every(c => /^[-: ]+$/.test(c))) return ''
      return `<tr>${cells.map(c => `<td class="py-1.5 px-2 text-xs text-text/80 border-b border-border/40">${c}</td>`).join('')}</tr>`
    })
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, m => `<table class="w-full border-collapse my-2">${m}</table>`)
    .replace(/^(?!<[ht]|$)(.+)$/gm, '<p class="text-xs text-text/70 leading-relaxed my-1">$1</p>')
}

// 主组件
export default function Popup() {
  const auth = useAuth()
  const analysis = useAnalysis()
  const t = (zh, en) => analysis.lang() === 'zh' ? zh : en

  // 用户显示信息
  const userDisplay = () => {
    if (!auth.isAuthenticated()) return null
    const user = auth.user()
    return {
      name: user?.username || user?.email?.split('@')[0] || '用户',
      quota: user?.quota_remaining || 0,
      total: user?.quota_total || 5
    }
  }

  return (
    <div class="w-[400px] min-h-[180px] max-h-[600px] bg-bg text-text font-sans flex flex-col overflow-hidden">

      {/* Header */}
      <div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold tracking-wide">Candlebot</span>
          <span class="text-xs text-muted">· K线专家</span>
        </div>
        <div class="flex items-center gap-2">
          {/* 语言切换 */}
          <div class="flex bg-surface border border-border rounded overflow-hidden text-[11px]">
            <button
              class={`px-2.5 py-1 transition-colors ${analysis.lang() === 'zh' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
              onClick={() => analysis.setLang('zh')}
            >中</button>
            <button
              class={`px-2.5 py-1 transition-colors ${analysis.lang() === 'en' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
              onClick={() => analysis.setLang('en')}
            >EN</button>
          </div>

          {/* 用户状态 */}
          <Show when={!auth.loading()}>
            <Show when={auth.isAuthenticated()} fallback={
              <button
                onClick={auth.openLogin}
                class="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-muted hover:text-text hover:border-accent/40 transition-colors"
              >
                登录
              </button>
            }>
              <div class="flex items-center gap-1">
                <button
                  onClick={auth.openDashboard}
                  class="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-muted hover:text-text hover:border-accent/40 transition-colors flex items-center gap-1"
                  title="打开Dashboard"
                >
                  <span>{userDisplay()?.name}</span>
                  <span class="text-accent">→</span>
                </button>
                <div class="text-[9px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-mono">
                  {userDisplay()?.quota}/{userDisplay()?.total}
                </div>
              </div>
            </Show>
          </Show>

          {/* 平台标识 */}
          <Show when={analysis.platform()}>
            <span class="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-muted font-mono uppercase">
              {analysis.platform()}
            </span>
          </Show>
        </div>
      </div>

      {/* Body */}
      <div class="flex-1 overflow-y-auto">
        {/* 加载状态 */}
        <Show when={auth.loading()}>
          <div class="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
            <div class="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
            <p class="text-sm text-muted">加载中...</p>
          </div>
        </Show>

        {/* 不支持的页面 */}
        <Show when={!auth.loading() && !analysis.platform()}>
          <div class="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
            <div class="text-4xl">👁</div>
            <p class="text-sm text-muted leading-relaxed">
              {t('请在 aggr.trade 或 TradingView 上使用', 'Please open aggr.trade or TradingView first')}
            </p>
          </div>
        </Show>

        {/* 未登录状态 */}
        <Show when={!auth.loading() && analysis.platform() && !auth.isAuthenticated()}>
          <div class="flex flex-col items-center gap-4 py-8 px-6">
            <div class="text-4xl">🔐</div>
            <p class="text-sm text-muted text-center leading-relaxed">
              {t('登录以使用 AI 图表分析功能', 'Login to use AI chart analysis')}
            </p>
            <button
              onClick={auth.openLogin}
              class="w-full py-3 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent/80 active:scale-95 transition-all"
            >
              {t('🔑 立即登录', '🔑 Login Now')}
            </button>
            <p class="text-[10px] text-muted text-center">
              {t('免费用户每日可进行 5 次分析', '5 free analyses per day for free users')}
            </p>
          </div>
        </Show>

        {/* 空闲状态（已登录） */}
        <Show when={!auth.loading() && analysis.platform() && auth.isAuthenticated() && analysis.state() === 'idle'}>
          <div class="flex flex-col items-center gap-4 py-8 px-6">
            <div class="text-4xl">📊</div>
            <p class="text-sm text-muted text-center leading-relaxed">
              {t('AI 自动截图并分析当前图表，给出做多做空判断', 'AI captures & analyzes the current chart automatically')}
            </p>
            <button
              onClick={analysis.startAnalysis}
              class="w-full py-3 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent/80 active:scale-95 transition-all"
            >
              {t('🔍 开始分析', '🔍 Analyze Chart')}
            </button>
            <p class="text-[10px] text-muted">
              {t('今日剩余 ', 'Remaining today: ')}
              <span class="text-accent font-bold">{userDisplay()?.quota}</span>
              {t(' 次', ' times')}
            </p>
          </div>
        </Show>

        {/* 加载状态 */}
        <Show when={analysis.state() === 'capturing' || analysis.state() === 'analyzing'}>
          <div class="flex flex-col items-center justify-center gap-4 py-14">
            <div class="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
            <p class="text-sm text-muted">
              {analysis.state() === 'capturing'
                ? t('截图中...', 'Capturing...')
                : t('AI 分析中，约 15~30 秒...', 'AI analyzing... ~15-30s')}
            </p>
          </div>
        </Show>

        {/* 错误状态 */}
        <Show when={analysis.state() === 'error'}>
          <div class="flex flex-col items-center gap-4 py-10 px-6">
            <div class="text-3xl">⚠️</div>
            <p class="text-sm text-red text-center">{analysis.errorMsg()}</p>
            <button
              onClick={() => analysis.state('idle')}
              class="px-6 py-2 rounded-lg border border-border text-sm text-muted hover:text-text transition-colors"
            >
              {t('重试', 'Retry')}
            </button>
          </div>
        </Show>

        {/* 分析结果 */}
        <Show when={analysis.state() === 'done' && analysis.result()}>
          <div class="flex flex-col">
            {/* 截图缩略 */}
            <Show when={analysis.screenshot()}>
              <img src={analysis.screenshot()} class="w-full border-b border-border opacity-80" alt="chart screenshot" />
            </Show>

            {/* 评级卡片 */}
            <div class={`mx-3 mt-3 px-3 py-2.5 rounded-lg border ${ratingClass(analysis.result().meta?.rating_score).bg} ${ratingClass(analysis.result().meta?.rating_score).border} flex items-center justify-between`}>
              <span class={`text-sm font-bold ${ratingClass(analysis.result().meta?.rating_score).text}`}>
                {analysis.result().meta?.rating || '⚫⚫⚫等待观望'}
              </span>
              <span class="text-[10px] text-muted font-mono">
                {[analysis.result().meta?.pair, analysis.result().meta?.timeframe, analysis.result().meta?.price ? `$${analysis.result().meta?.price}` : ''].filter(Boolean).join(' · ')}
              </span>
            </div>

            {/* 总结 */}
            <div class="mx-3 mt-2 px-3 py-2.5 bg-surface rounded-lg border border-border">
              <p class="text-xs text-text/80 leading-relaxed">{analysis.result().meta?.summary || '分析生成中...'}</p>
            </div>

            {/* 完整报告折叠 */}
            <details class="mx-3 mt-2 mb-1">
              <summary class="text-xs text-muted cursor-pointer py-1.5 hover:text-text transition-colors select-none list-none flex items-center gap-1">
                <span class="text-accent">▸</span>
                {t('查看完整报告', 'Full Report')}
              </summary>
              <div
                class="mt-2 pb-3"
                innerHTML={parseMarkdown(analysis.result()?.report || '')}
              />
            </details>

            {/* 剩余次数 */}
            <Show when={analysis.result()?.remaining_today !== undefined}>
              <p class="text-center text-[10px] text-muted py-1">
                {t(`今日剩余 ${analysis.result().remaining_today} 次`, `${analysis.result().remaining_today} left today`)}
              </p>
            </Show>

            {/* Dashboard链接 */}
            <Show when={analysis.result()?.record_id}>
              <div class="mx-3 mt-1 mb-2">
                <button
                  onClick={auth.openDashboard}
                  class="w-full text-[10px] px-3 py-1.5 rounded border border-border text-muted hover:text-text hover:border-accent/40 transition-colors flex items-center justify-center gap-1"
                >
                  <span>{t('在Dashboard中查看详情', 'View details in Dashboard')}</span>
                  <span class="text-accent">→</span>
                </button>
              </div>
            </Show>
          </div>
        </Show>
      </div>

      {/* Footer */}
      <Show when={analysis.state() === 'done'}>
        <div class="flex gap-2 px-3 py-3 border-t border-border shrink-0">
          <button
            onClick={analysis.startAnalysis}
            class="flex-1 py-2 rounded-lg border border-border text-xs text-muted hover:text-text hover:border-accent/40 transition-colors"
          >
            {t('🔄 重新分析', '🔄 Re-analyze')}
          </button>
          <button
            onClick={analysis.shareResult}
            class="flex-1 py-2 rounded-lg bg-accent/15 border border-accent/30 text-xs text-accent hover:bg-accent/25 transition-colors"
          >
            {analysis.copied() ? t('✅ 已复制', '✅ Copied') : t('📤 分享', '📤 Share')}
          </button>
        </div>
      </Show>

    </div>
  )
}