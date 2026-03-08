// src/popup/Popup.jsx
import { createSignal, createEffect, Show } from 'solid-js'

// ← 部署 Railway 后替换为你的真实 URL
const API_BASE = 'https://your-railway-app.railway.app'

function ratingClass(score) {
  const s = parseInt(score) || 0
  if (s >= 2)  return { bg: 'bg-green/10', border: 'border-green/30', text: 'text-green' }
  if (s <= -2) return { bg: 'bg-red/10',   border: 'border-red/30',   text: 'text-red'   }
  return         { bg: 'bg-neutral/10', border: 'border-neutral/30', text: 'text-neutral' }
}

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

export default function Popup() {
  const [platform, setPlatform] = createSignal(null)
  const [lang, setLang] = createSignal('zh')
  const [state, setState] = createSignal('idle') // idle | capturing | analyzing | done | error
  const [result, setResult] = createSignal(null)
  const [errorMsg, setErrorMsg] = createSignal('')
  const [screenshot, setScreenshot] = createSignal(null)
  const [copied, setCopied] = createSignal(false)

  createEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_PLATFORM' }, res => {
      setPlatform(res?.platform ?? null)
    })
  })

  async function startAnalysis() {
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

    const dataUrl = captureRes.dataUrl
    setScreenshot(dataUrl)
    setState('analyzing')

    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')

    try {
      const resp = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64,
          platform: platform() || 'tradingview',
          lang: lang()
        })
      })

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

    } catch (e) {
      setErrorMsg(lang() === 'zh' ? 'AI分析失败，请重试' : 'Analysis failed, please retry')
      setState('error')
    }
  }

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

  const meta = () => result()?.meta || {}
  const rc = () => ratingClass(meta().rating_score)

  const t = (zh, en) => lang() === 'zh' ? zh : en

  return (
    <div class="w-[400px] min-h-[180px] max-h-[600px] bg-bg text-text font-sans flex flex-col overflow-hidden">

      {/* Header */}
      <div class="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold tracking-wide">Candlebot</span>
          <span class="text-xs text-muted">· K线专家</span>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex bg-surface border border-border rounded overflow-hidden text-[11px]">
            <button
              class={`px-2.5 py-1 transition-colors ${lang() === 'zh' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
              onClick={() => setLang('zh')}
            >中</button>
            <button
              class={`px-2.5 py-1 transition-colors ${lang() === 'en' ? 'bg-accent text-white' : 'text-muted hover:text-text'}`}
              onClick={() => setLang('en')}
            >EN</button>
          </div>
          <Show when={platform()}>
            <span class="text-[10px] px-2 py-0.5 rounded bg-surface border border-border text-muted font-mono uppercase">
              {platform()}
            </span>
          </Show>
        </div>
      </div>

      {/* Body */}
      <div class="flex-1 overflow-y-auto">

        {/* 不支持的页面 */}
        <Show when={!platform()}>
          <div class="flex flex-col items-center justify-center gap-3 py-12 px-6 text-center">
            <div class="text-4xl">👁</div>
            <p class="text-sm text-muted leading-relaxed">
              {t('请在 aggr.trade 或 TradingView 上使用', 'Please open aggr.trade or TradingView first')}
            </p>
          </div>
        </Show>

        {/* Idle */}
        <Show when={platform() && state() === 'idle'}>
          <div class="flex flex-col items-center gap-4 py-8 px-6">
            <div class="text-4xl">📊</div>
            <p class="text-sm text-muted text-center leading-relaxed">
              {t('AI 自动截图并分析当前图表，给出做多做空判断', 'AI captures & analyzes the current chart automatically')}
            </p>
            <button
              onClick={startAnalysis}
              class="w-full py-3 rounded-lg bg-accent text-white text-sm font-bold hover:bg-accent/80 active:scale-95 transition-all"
            >
              {t('🔍 开始分析', '🔍 Analyze Chart')}
            </button>
            <p class="text-[10px] text-muted">{t('每日免费 5 次', '5 free analyses per day')}</p>
          </div>
        </Show>

        {/* 加载 */}
        <Show when={state() === 'capturing' || state() === 'analyzing'}>
          <div class="flex flex-col items-center justify-center gap-4 py-14">
            <div class="w-8 h-8 border-2 border-border border-t-accent rounded-full animate-spin" />
            <p class="text-sm text-muted">
              {state() === 'capturing'
                ? t('截图中...', 'Capturing...')
                : t('AI 分析中，约 15~30 秒...', 'AI analyzing... ~15-30s')}
            </p>
          </div>
        </Show>

        {/* 错误 */}
        <Show when={state() === 'error'}>
          <div class="flex flex-col items-center gap-4 py-10 px-6">
            <div class="text-3xl">⚠️</div>
            <p class="text-sm text-red text-center">{errorMsg()}</p>
            <button
              onClick={() => setState('idle')}
              class="px-6 py-2 rounded-lg border border-border text-sm text-muted hover:text-text transition-colors"
            >
              {t('重试', 'Retry')}
            </button>
          </div>
        </Show>

        {/* 结果 */}
        <Show when={state() === 'done' && result()}>
          <div class="flex flex-col">

            {/* 截图缩略 */}
            <Show when={screenshot()}>
              <img src={screenshot()} class="w-full border-b border-border opacity-80" alt="chart screenshot" />
            </Show>

            {/* 评级卡片 */}
            <div class={`mx-3 mt-3 px-3 py-2.5 rounded-lg border ${rc().bg} ${rc().border} flex items-center justify-between`}>
              <span class={`text-sm font-bold ${rc().text}`}>{meta().rating || '⚫⚫⚫等待观望'}</span>
              <span class="text-[10px] text-muted font-mono">
                {[meta().pair, meta().timeframe, meta().price ? `$${meta().price}` : ''].filter(Boolean).join(' · ')}
              </span>
            </div>

            {/* 总结 */}
            <div class="mx-3 mt-2 px-3 py-2.5 bg-surface rounded-lg border border-border">
              <p class="text-xs text-text/80 leading-relaxed">{meta().summary || '分析生成中...'}</p>
            </div>

            {/* 完整报告折叠 */}
            <details class="mx-3 mt-2 mb-1">
              <summary class="text-xs text-muted cursor-pointer py-1.5 hover:text-text transition-colors select-none list-none flex items-center gap-1">
                <span class="text-accent">▸</span>
                {t('查看完整报告', 'Full Report')}
              </summary>
              <div
                class="mt-2 pb-3"
                innerHTML={parseMarkdown(result()?.report || '')}
              />
            </details>

            {/* 剩余次数 */}
            <Show when={result()?.remaining_today !== undefined}>
              <p class="text-center text-[10px] text-muted py-1">
                {t(`今日剩余 ${result().remaining_today} 次`, `${result().remaining_today} left today`)}
              </p>
            </Show>

          </div>
        </Show>
      </div>

      {/* Footer */}
      <Show when={state() === 'done'}>
        <div class="flex gap-2 px-3 py-3 border-t border-border shrink-0">
          <button
            onClick={startAnalysis}
            class="flex-1 py-2 rounded-lg border border-border text-xs text-muted hover:text-text hover:border-accent/40 transition-colors"
          >
            {t('🔄 重新分析', '🔄 Re-analyze')}
          </button>
          <button
            onClick={shareResult}
            class="flex-1 py-2 rounded-lg bg-accent/15 border border-accent/30 text-xs text-accent hover:bg-accent/25 transition-colors"
          >
            {copied() ? t('✅ 已复制', '✅ Copied') : t('📤 分享', '📤 Share')}
          </button>
        </div>
      </Show>

    </div>
  )
}
