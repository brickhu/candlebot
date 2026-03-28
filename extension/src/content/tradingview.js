/**
 * TradingView专用内容脚本
 * 提供针对TradingView网站的增强功能
 */

console.log('Candlebot TradingView内容脚本已加载');

// TradingView特定状态
let tradingViewState = {
  platform: 'tradingview',
  chartDetected: false,
  chartWidget: null,
  symbolInfo: null,
  timeframeInfo: null
};

/**
 * 初始化TradingView脚本
 */
function initialize() {
  console.log('初始化TradingView增强功能...');

  // 检查当前页面是否为图表页面
  checkChartPage();

  // 设置监听器
  setupTradingViewListeners();

  // 尝试提取图表信息
  extractTradingViewInfo();

  console.log('TradingView增强功能初始化完成');
}

/**
 * 检查是否为图表页面
 */
function checkChartPage() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  // TradingView图表页面模式
  const chartPatterns = [
    /^\/chart\/[^\/]+\/[^\/]+\/?$/,
    /^\/symbol\/[^\/]+\/[^\/]+\/?$/
  ];

  const isChartPage = chartPatterns.some(pattern => pattern.test(pathname));
  tradingViewState.chartDetected = isChartPage;

  console.log('TradingView页面检查:', {
    url,
    pathname,
    isChartPage,
    chartDetected: tradingViewState.chartDetected
  });

  return isChartPage;
}

/**
 * 设置TradingView监听器
 */
function setupTradingViewListeners() {
  // 监听TradingView widget加载
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 检查是否为TradingView widget
            if (node.classList?.contains('tv-chart') ||
                node.getAttribute?.('data-name') === 'chart-container') {
              console.log('检测到TradingView图表widget');
              tradingViewState.chartWidget = node;
              onChartWidgetDetected(node);
            }
          }
        }
      }
    }
  });

  // 开始观察文档变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 监听TradingView消息
  window.addEventListener('message', (event) => {
    // TradingView widget可能会发送消息
    if (event.data && event.data.name) {
      handleTradingViewMessage(event.data);
    }
  });

  // 页面加载完成后再次检查
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!tradingViewState.chartWidget) {
        findChartWidget();
      }
    }, 2000);
  });
}

/**
 * 查找图表widget
 */
function findChartWidget() {
  const selectors = [
    '.tv-chart',
    '[data-name="chart-container"]',
    '.chart-container',
    '.js-chart'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log('找到图表widget:', selector);
      tradingViewState.chartWidget = element;
      onChartWidgetDetected(element);
      break;
    }
  }
}

/**
 * 图表widget检测到时的处理
 */
function onChartWidgetDetected(widget) {
  console.log('TradingView图表widget已检测到:', widget);

  // 提取图表信息
  extractTradingViewInfo();

  // 可以在这里添加更多TradingView特定功能
  // 例如：监听图表变化、获取更多数据等
}

/**
 * 处理TradingView消息
 */
function handleTradingViewMessage(data) {
  console.log('收到TradingView消息:', data);

  // 可以根据需要处理特定消息
  // 例如：图表加载完成、符号变化、时间框架变化等
}

/**
 * 提取TradingView图表信息
 */
function extractTradingViewInfo() {
  console.log('提取TradingView图表信息...');

  const info = {
    platform: 'tradingview',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    symbol: null,
    exchange: null,
    timeframe: null,
    chartType: null,
    indicators: [],
    extracted: false
  };

  try {
    // 1. 从URL提取
    const urlObj = new URL(window.location.href);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    if (pathParts[0] === 'chart' && pathParts.length >= 3) {
      info.symbol = pathParts[1];
      info.exchange = pathParts[2];
      info.extracted = true;
    } else if (pathParts[0] === 'symbol' && pathParts.length >= 3) {
      info.symbol = pathParts[1];
      info.exchange = pathParts[2];
      info.extracted = true;
    }

    // 2. 从页面标题提取
    const title = document.title;
    if (title) {
      // TradingView标题格式：BTCUSD - 比特币美元图表 — TradingView
      const titleMatch = title.match(/([A-Z0-9]+)\s*[-|]\s*(.+?)\s*图表/);
      if (titleMatch && !info.symbol) {
        info.symbol = titleMatch[1];
        info.extracted = true;
      }

      // 提取时间框架
      const tfMatch = title.match(/(1m|5m|15m|30m|1h|4h|1d|1w|1M)/i);
      if (tfMatch) {
        info.timeframe = tfMatch[1].toUpperCase();
      }
    }

    // 3. 从DOM提取
    try {
      // 查找符号显示元素
      const symbolElements = document.querySelectorAll([
        '.symbol',
        '.ticker',
        '.tv-symbol-header',
        '.tv-widget-description__symbol'
      ].join(','));

      for (const el of symbolElements) {
        const text = el.textContent?.trim();
        if (text && text.length < 50) {
          // 格式：BTC/USD 或 BTCUSD
          const cleanText = text.replace(/\s+/g, '');
          const symbolMatch = cleanText.match(/([A-Z0-9]+)\/?([A-Z0-9]+)?/);
          if (symbolMatch) {
            info.symbol = symbolMatch[1];
            if (symbolMatch[2]) {
              info.exchange = symbolMatch[2];
            }
            info.extracted = true;
            break;
          }
        }
      }

      // 查找时间框架选择器
      const timeframeElements = document.querySelectorAll([
        '.interval',
        '.timeframe',
        '.tv-interval'
      ].join(','));

      for (const el of timeframeElements) {
        const text = el.textContent?.trim();
        if (text && /^\d+[mhdwM]$/i.test(text)) {
          info.timeframe = text.toUpperCase();
          break;
        }
      }

      // 查找图表类型
      const chartTypeElements = document.querySelectorAll([
        '.chart-type',
        '.tv-chart-type'
      ].join(','));

      for (const el of chartTypeElements) {
        const text = el.textContent?.trim().toLowerCase();
        if (text && (text.includes('candle') || text.includes('bar') || text.includes('line'))) {
          info.chartType = text;
          break;
        }
      }

    } catch (domError) {
      console.log('DOM提取失败:', domError);
    }

    // 4. 从TradingView widget数据提取
    try {
      // 尝试访问TradingView widget数据
      if (window.tvWidget) {
        const widgetData = window.tvWidget;
        console.log('找到TradingView widget对象:', widgetData);

        // 注意：由于安全限制，可能无法直接访问widget内部数据
        // 这里只是示例，实际可能需要其他方法
      }
    } catch (widgetError) {
      console.log('访问widget数据失败:', widgetError);
    }

    console.log('提取的TradingView信息:', info);
    tradingViewState.symbolInfo = info.symbol;
    tradingViewState.timeframeInfo = info.timeframe;

    return info;

  } catch (error) {
    console.error('提取TradingView信息失败:', error);
    return info;
  }
}

/**
 * 获取增强的图表信息
 * @returns {Promise<Object>} 图表信息
 */
async function getEnhancedChartInfo() {
  const basicInfo = extractTradingViewInfo();

  // 添加TradingView特定信息
  const enhancedInfo = {
    ...basicInfo,
    platformSpecific: {
      widgetAvailable: !!tradingViewState.chartWidget,
      chartDetected: tradingViewState.chartDetected,
      tradingViewFeatures: ['advanced_charting', 'indicators', 'drawing_tools']
    },
    screenshotHint: {
      recommendedArea: 'chart-container',
      excludeElements: ['tv-side-toolbar', 'tv-news-widget'],
      optimalSize: '1920x1080'
    }
  };

  return enhancedInfo;
}

/**
 * 监听图表变化
 * @param {Function} callback 变化回调函数
 */
function watchChartChanges(callback) {
  console.log('开始监听TradingView图表变化');

  // 使用MutationObserver监听图表区域变化
  if (tradingViewState.chartWidget) {
    const observer = new MutationObserver((mutations) => {
      // 检查是否有相关变化
      const hasRelevantChange = mutations.some(mutation => {
        return mutation.type === 'attributes' ||
               mutation.type === 'childList' ||
               mutation.type === 'characterData';
      });

      if (hasRelevantChange) {
        console.log('检测到图表变化');
        if (callback) {
          callback({
            type: 'chart_updated',
            timestamp: new Date().toISOString(),
            widget: tradingViewState.chartWidget
          });
        }
      }
    });

    observer.observe(tradingViewState.chartWidget, {
      attributes: true,
      childList: true,
      subtree: true,
      characterData: true
    });

    return observer;
  }

  return null;
}

// 导出函数
window.candlebotTradingView = {
  getState: () => tradingViewState,
  getChartInfo: () => extractTradingViewInfo(),
  getEnhancedInfo: () => getEnhancedChartInfo(),
  watchChanges: (callback) => watchChartChanges(callback)
};

// 初始化
initialize();