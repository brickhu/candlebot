/**
 * Aggr.trade专用内容脚本
 * 提供针对Aggr.trade网站的增强功能
 */

console.log('Candlebot Aggr.trade内容脚本已加载');

// Aggr.trade特定状态
let aggrState = {
  platform: 'aggr',
  chartDetected: false,
  chartContainer: null,
  pairInfo: null,
  marketInfo: null
};

/**
 * 初始化Aggr.trade脚本
 */
function initialize() {
  console.log('初始化Aggr.trade增强功能...');

  // 检查当前页面是否为图表页面
  checkChartPage();

  // 设置监听器
  setupAggrListeners();

  // 尝试提取交易对信息
  extractAggrInfo();

  console.log('Aggr.trade增强功能初始化完成');
}

/**
 * 检查是否为图表页面
 */
function checkChartPage() {
  const url = window.location.href;
  const pathname = window.location.pathname;

  // Aggr.trade图表页面模式
  const chartPatterns = [
    /^\/[^\/]+\/[^\/]+\/?$/,
    /^\/trade\/[^\/]+\/[^\/]+\/?$/
  ];

  const isChartPage = chartPatterns.some(pattern => pattern.test(pathname));
  aggrState.chartDetected = isChartPage;

  console.log('Aggr.trade页面检查:', {
    url,
    pathname,
    isChartPage,
    chartDetected: aggrState.chartDetected
  });

  return isChartPage;
}

/**
 * 设置Aggr.trade监听器
 */
function setupAggrListeners() {
  // 监听页面变化
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 检查是否为图表容器
            if (node.classList?.contains('chart-container') ||
                node.id === 'chart' ||
                node.querySelector?.('.tradingview-chart')) {
              console.log('检测到Aggr.trade图表容器');
              aggrState.chartContainer = node;
              onChartContainerDetected(node);
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

  // 页面加载完成后再次检查
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (!aggrState.chartContainer) {
        findChartContainer();
      }
      // 重新提取信息
      extractAggrInfo();
    }, 2000);
  });

  // 监听hash变化（Aggr.trade使用SPA）
  window.addEventListener('hashchange', () => {
    setTimeout(() => {
      checkChartPage();
      extractAggrInfo();
    }, 500);
  });
}

/**
 * 查找图表容器
 */
function findChartContainer() {
  const selectors = [
    '.chart-container',
    '#chart',
    '.tradingview-chart',
    '.tv-chart-container',
    '[data-testid="chart-container"]'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log('找到图表容器:', selector);
      aggrState.chartContainer = element;
      onChartContainerDetected(element);
      break;
    }
  }
}

/**
 * 图表容器检测到时的处理
 */
function onChartContainerDetected(container) {
  console.log('Aggr.trade图表容器已检测到:', container);

  // 提取交易对信息
  extractAggrInfo();

  // 可以在这里添加更多Aggr.trade特定功能
}

/**
 * 提取Aggr.trade交易对信息
 */
function extractAggrInfo() {
  console.log('提取Aggr.trade交易对信息...');

  const info = {
    platform: 'aggr',
    url: window.location.href,
    timestamp: new Date().toISOString(),
    symbol: null,
    exchange: null,
    pair: null,
    chain: null,
    timeframe: null,
    extracted: false
  };

  try {
    // 1. 从URL提取
    const urlObj = new URL(window.location.href);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // Aggr.trade URL格式: /SOL/USDT 或 /trade/SOL/USDT
    if (pathParts.length >= 2) {
      const symbolIndex = pathParts[0] === 'trade' ? 1 : 0;
      const exchangeIndex = pathParts[0] === 'trade' ? 2 : 1;

      if (pathParts[symbolIndex] && pathParts[exchangeIndex]) {
        info.symbol = pathParts[symbolIndex].toUpperCase();
        info.exchange = pathParts[exchangeIndex].toUpperCase();
        info.pair = `${info.symbol}/${info.exchange}`;
        info.extracted = true;
      }
    }

    // 2. 从页面标题提取
    const title = document.title;
    if (title) {
      // Aggr.trade标题格式：SOL/USDT Aggregated Chart | aggr.trade
      const titleMatch = title.match(/([A-Z0-9]+\/[A-Z0-9]+)\s+Aggregated Chart/i);
      if (titleMatch && !info.pair) {
        const [symbol, exchange] = titleMatch[1].split('/');
        info.symbol = symbol;
        info.exchange = exchange;
        info.pair = titleMatch[1];
        info.extracted = true;
      }

      // 提取链信息
      if (title.includes('Solana')) info.chain = 'Solana';
      else if (title.includes('Ethereum')) info.chain = 'Ethereum';
      else if (title.includes('Arbitrum')) info.chain = 'Arbitrum';
      else if (title.includes('Base')) info.chain = 'Base';
    }

    // 3. 从DOM提取
    try {
      // 查找交易对显示元素
      const pairSelectors = [
        'h1',
        '.pair-header',
        '.symbol',
        '.token-pair',
        '[data-testid="pair-symbol"]',
        '.text-2xl', '.text-3xl' // 常见的大标题类
      ];

      for (const selector of pairSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (text && (text.includes('/') || text.includes('-'))) {
            // 清理文本
            const cleanText = text.replace(/\s+/g, '');

            // 匹配格式: SOL/USDT 或 SOL-USDT
            const pairMatch = cleanText.match(/([A-Z0-9]+)[\/\-]([A-Z0-9]+)/);
            if (pairMatch && pairMatch[1].length <= 10 && pairMatch[2].length <= 10) {
              info.symbol = pairMatch[1];
              info.exchange = pairMatch[2];
              info.pair = `${info.symbol}/${info.exchange}`;
              info.extracted = true;
              console.log('从DOM找到交易对:', info.pair, '选择器:', selector);
              break;
            }
          }
        }
        if (info.extracted) break;
      }

      // 查找链信息
      const chainSelectors = [
        '.chain-badge',
        '.network',
        '.platform',
        '[data-chain]',
        '.bg-purple', '.bg-blue', '.bg-green' // 常见链颜色类
      ];

      for (const selector of chainSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (text && text.length < 20) {
            const lowerText = text.toLowerCase();
            if (lowerText.includes('solana') || lowerText.includes('sol')) {
              info.chain = 'Solana';
            } else if (lowerText.includes('ethereum') || lowerText.includes('eth')) {
              info.chain = 'Ethereum';
            } else if (lowerText.includes('arbitrum') || lowerText.includes('arb')) {
              info.chain = 'Arbitrum';
            } else if (lowerText.includes('base')) {
              info.chain = 'Base';
            }
            if (info.chain) break;
          }
        }
        if (info.chain) break;
      }

      // 查找时间框架
      const timeframeSelectors = [
        '.timeframe-selector',
        '.interval',
        '.timeframe',
        'button[class*="time"]',
        'button[class*="interval"]'
      ];

      for (const selector of timeframeSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent?.trim();
          const active = el.classList?.contains('active') ||
                        el.getAttribute?.('data-active') === 'true';

          if (active && text && /^\d+[mhdw]$/i.test(text)) {
            info.timeframe = text.toUpperCase();
            break;
          }
        }
        if (info.timeframe) break;
      }

      // 查找价格信息
      const priceSelectors = [
        '.price',
        '.current-price',
        '[data-testid="price"]',
        '.text-4xl', '.text-5xl' // 大价格显示
      ];

      for (const selector of priceSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (text && text.includes('$') && !info.price) {
            // 提取价格数字
            const priceMatch = text.match(/\$?([0-9,.]+)/);
            if (priceMatch) {
              info.price = parseFloat(priceMatch[1].replace(/,/g, ''));
              break;
            }
          }
        }
        if (info.price) break;
      }

    } catch (domError) {
      console.log('DOM提取失败:', domError);
    }

    console.log('提取的Aggr.trade信息:', info);
    aggrState.pairInfo = info.pair;
    aggrState.marketInfo = {
      chain: info.chain,
      price: info.price
    };

    return info;

  } catch (error) {
    console.error('提取Aggr.trade信息失败:', error);
    return info;
  }
}

/**
 * 获取增强的交易对信息
 * @returns {Promise<Object>} 交易对信息
 */
async function getEnhancedAggrInfo() {
  const basicInfo = extractAggrInfo();

  // 添加Aggr.trade特定信息
  const enhancedInfo = {
    ...basicInfo,
    platformSpecific: {
      chartAvailable: !!aggrState.chartContainer,
      isAggregated: true,
      features: ['multi_dex', 'liquidity_aggregation', 'price_comparison']
    },
    marketData: {
      chain: aggrState.marketInfo?.chain,
      price: aggrState.marketInfo?.price,
      timestamp: new Date().toISOString()
    },
    screenshotHint: {
      recommendedArea: 'chart-container',
      includeElements: ['price-display', 'pair-info'],
      optimalSize: '1920x1080'
    }
  };

  return enhancedInfo;
}

/**
 * 获取交易对的市场数据
 * @returns {Promise<Object>} 市场数据
 */
async function getMarketData() {
  try {
    // 尝试从页面获取更多市场数据
    const marketData = {
      volume24h: null,
      liquidity: null,
      change24h: null,
      dexes: []
    };

    // 查找交易量信息
    const volumeSelectors = [
      '.volume',
      '.volume-24h',
      '[data-testid="volume"]'
    ];

    for (const selector of volumeSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text && text.toLowerCase().includes('volume')) {
          // 提取数字
          const volumeMatch = text.match(/\$?([0-9,.]+[BMK]?)/i);
          if (volumeMatch) {
            marketData.volume24h = volumeMatch[1];
            break;
          }
        }
      }
    }

    // 查找流动性信息
    const liquiditySelectors = [
      '.liquidity',
      '.tvl',
      '[data-testid="liquidity"]'
    ];

    for (const selector of liquiditySelectors) {
      const element = document.querySelector(selector);
      if (element) {
        const text = element.textContent?.trim();
        if (text && text.toLowerCase().includes('liquidity')) {
          const liqMatch = text.match(/\$?([0-9,.]+[BMK]?)/i);
          if (liqMatch) {
            marketData.liquidity = liqMatch[1];
            break;
          }
        }
      }
    }

    // 查找DEX列表
    const dexSelectors = [
      '.dex-list',
      '.exchange-list',
      '[data-testid="dexes"]'
    ];

    for (const selector of dexSelectors) {
      const elements = document.querySelectorAll(`${selector} li, ${selector} .dex-item`);
      if (elements.length > 0) {
        marketData.dexes = Array.from(elements)
          .map(el => el.textContent?.trim())
          .filter(text => text && text.length < 50);
        break;
      }
    }

    return marketData;

  } catch (error) {
    console.error('获取市场数据失败:', error);
    return {};
  }
}

// 导出函数
window.candlebotAggr = {
  getState: () => aggrState,
  getPairInfo: () => extractAggrInfo(),
  getEnhancedInfo: () => getEnhancedAggrInfo(),
  getMarketData: () => getMarketData()
};

// 初始化
initialize();