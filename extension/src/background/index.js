// src/background/index.js — Service Worker

const SUPPORTED = ['aggr.trade', 'www.tradingview.com', 'tradingview.com']

function isSupported(url) {
  try {
    const host = new URL(url).hostname
    return SUPPORTED.some(h => host === h || host.endsWith('.' + h))
  } catch { return false }
}

function getPlatform(url) {
  try {
    const host = new URL(url).hostname
    if (host.includes('aggr.trade')) return 'aggr'
    if (host.includes('tradingview.com')) return 'tradingview'
  } catch {}
  return null
}

function updateIcon(tabId, url) {
  const on = isSupported(url)
  chrome.action.setIcon({
    tabId,
    path: {
      16:  `public/icons/icon16${on ? '' : '_off'}.png`,
      48:  `public/icons/icon48${on ? '' : '_off'}.png`,
      128: `public/icons/icon128${on ? '' : '_off'}.png`,
    }
  })
  chrome.action.setTitle({
    tabId,
    title: on
      ? 'Candlebot · 点击分析图表'
      : 'Candlebot · 请在 aggr.trade 或 TradingView 使用'
  })
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, tab => { if (tab?.url) updateIcon(tabId, tab.url) })
})

chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if ((info.url || info.status === 'complete') && tab?.url)
    updateIcon(tabId, tab.url)
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CAPTURE') {
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, dataUrl => {
      if (chrome.runtime.lastError)
        sendResponse({ error: chrome.runtime.lastError.message })
      else
        sendResponse({ dataUrl })
    })
    return true
  }

  if (msg.type === 'GET_PLATFORM') {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      sendResponse({ platform: tab?.url ? getPlatform(tab.url) : null })
    })
    return true
  }
})
