// src/content/index.js — 注入支持的页面

const host = window.location.hostname
let platform = null
if (host.includes('aggr.trade')) platform = 'aggr'
else if (host.includes('tradingview.com')) platform = 'tradingview'

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_PLATFORM') sendResponse({ platform })
})
