/**
 * URL匹配器 - 智能识别支持的K线图表页面
 */

// 支持的网站配置
const SITE_CONFIGS = {
  'tradingview.com': {
    name: 'TradingView',
    // 首页和图表页面的路径模式
    homepagePatterns: [
      /^\/$/,
      /^\/chart\/?$/,
      /^\/markets\/?$/,
      /^\/ideas\/?$/
    ],
    chartPatterns: [
      /^\/chart\/[^\/]+\/[^\/]+\/?$/,
      /^\/symbol\/[^\/]+\/[^\/]+\/?$/,
      /^\/markets\/cryptocurrencies\/prices\/[^\/]+\/?$/
    ],
    // 图表容器选择器
    chartSelectors: [
      '.chart-container',
      '[data-name="chart-container"]',
      '.tv-chart'
    ]
  },
  'aggr.trade': {
    name: 'Aggr.trade',
    homepagePatterns: [
      /^\/$/,
      /^\/markets\/?$/
    ],
    chartPatterns: [
      /^\/[^\/]+\/[^\/]+\/?$/,
      /^\/trade\/[^\/]+\/[^\/]+\/?$/
    ],
    chartSelectors: [
      '.chart-container',
      '#chart',
      '.tradingview-chart'
    ]
  },
  'dextools.io': {
    name: 'DEXTools',
    homepagePatterns: [
      /^\/$/,
      /^\/app\/?$/
    ],
    chartPatterns: [
      /^\/app\/[^\/]+\/pair-explorer\/[^\/]+\/?$/,
      /^\/app\/[^\/]+\/pair\/[^\/]+\/?$/
    ],
    chartSelectors: [
      '.chart-wrapper',
      '.tradingview-widget-container'
    ]
  },
  'dexscreener.com': {
    name: 'DEXScreener',
    homepagePatterns: [
      /^\/$/,
      /^\/latest\/?$/
    ],
    chartPatterns: [
      /^\/[^\/]+\/[^\/]+\/?$/,
      /^\/[^\/]+\/[^\/]+\/[^\/]+\/?$/
    ],
    chartSelectors: [
      '.chart-container',
      '.tradingview-chart'
    ]
  },
  'birdeye.so': {
    name: 'Birdeye',
    homepagePatterns: [
      /^\/$/,
      /^\/trending\/?$/
    ],
    chartPatterns: [
      /^\/[^\/]+\/[^\/]+\/?$/,
      /^\/token\/[^\/]+\/?$/
    ],
    chartSelectors: [
      '.chart-area',
      '.tradingview-chart'
    ]
  },
  'geckoterminal.com': {
    name: 'GeckoTerminal',
    homepagePatterns: [
      /^\/$/,
      /^\/trending\/?$/
    ],
    chartPatterns: [
      /^\/[^\/]+\/[^\/]+\/[^\/]+\/?$/,
      /^\/pools\/[^\/]+\/?$/
    ],
    chartSelectors: [
      '.chart-container',
      '.tradingview-chart'
    ]
  }
};

/**
 * 检查URL是否匹配特定网站
 * @param {string} url - 要检查的URL
 * @param {string} domain - 网站域名
 * @returns {boolean}
 */
function matchesDomain(url, domain) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes(domain);
  } catch (error) {
    console.error('解析URL失败:', error);
    return false;
  }
}

/**
 * 检查URL路径是否匹配模式列表
 * @param {string} url - 要检查的URL
 * @param {Array<RegExp>} patterns - 正则表达式模式列表
 * @returns {boolean}
 */
function matchesPatterns(url, patterns) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    return patterns.some(pattern => pattern.test(pathname));
  } catch (error) {
    console.error('检查路径模式失败:', error);
    return false;
  }
}

/**
 * 获取网站配置
 * @param {string} url - 要检查的URL
 * @returns {Object|null} 网站配置对象或null
 */
export function getSiteConfig(url) {
  for (const [domain, config] of Object.entries(SITE_CONFIGS)) {
    if (matchesDomain(url, domain)) {
      return {
        domain,
        ...config
      };
    }
  }
  return null;
}

/**
 * 检查是否为支持的K线图表页面
 * @param {string} url - 要检查的URL
 * @returns {Object} 检查结果
 */
export function checkChartPage(url) {
  const siteConfig = getSiteConfig(url);

  if (!siteConfig) {
    return {
      supported: false,
      reason: '不支持的网站',
      site: null,
      isChartPage: false
    };
  }

  // 检查是否为图表页面
  const isChartPage = matchesPatterns(url, siteConfig.chartPatterns);
  const isHomepage = matchesPatterns(url, siteConfig.homepagePatterns);

  let reason = '';
  if (isChartPage) {
    reason = `检测到${siteConfig.name}图表页面`;
  } else if (isHomepage) {
    reason = `检测到${siteConfig.name}首页，请打开具体图表页面`;
  } else {
    reason = `检测到${siteConfig.name}页面，但非图表页面`;
  }

  return {
    supported: true,
    reason,
    site: siteConfig,
    isChartPage,
    isHomepage
  };
}

/**
 * 获取当前页面的图表信息
 * @param {string} url - 页面URL
 * @param {Object} siteConfig - 网站配置
 * @returns {Promise<Object>} 图表信息
 */
export async function extractChartInfo(url, siteConfig) {
  const info = {
    url,
    site: siteConfig.name,
    timestamp: new Date().toISOString(),
    symbol: null,
    timeframe: null,
    exchange: null,
    extracted: false
  };

  try {
    // 从URL中提取信息
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // 通用提取逻辑
    if (siteConfig.domain === 'tradingview.com') {
      // TradingView: /chart/SYMBOL/EXCHANGE
      if (pathParts[0] === 'chart' && pathParts.length >= 3) {
        info.symbol = pathParts[1];
        info.exchange = pathParts[2];
        info.extracted = true;
      } else if (pathParts[0] === 'symbol' && pathParts.length >= 3) {
        info.symbol = pathParts[1];
        info.exchange = pathParts[2];
        info.extracted = true;
      }
    } else if (siteConfig.domain === 'aggr.trade') {
      // Aggr.trade: /SYMBOL/EXCHANGE
      if (pathParts.length >= 2) {
        info.symbol = pathParts[0];
        info.exchange = pathParts[1];
        info.extracted = true;
      }
    }

    // 尝试从页面DOM提取更多信息
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const response = await chrome.tabs.sendMessage(tab.id, {
          type: 'EXTRACT_CHART_INFO',
          site: siteConfig.domain
        });

        if (response?.success && response.data) {
          Object.assign(info, response.data);
          info.extracted = true;
        }
      }
    } catch (error) {
      console.log('从DOM提取信息失败:', error);
    }

  } catch (error) {
    console.error('提取图表信息失败:', error);
  }

  return info;
}

/**
 * 获取所有支持的网站列表
 * @returns {Array<Object>} 网站列表
 */
export function getSupportedSites() {
  return Object.entries(SITE_CONFIGS).map(([domain, config]) => ({
    domain,
    name: config.name,
    homepagePatterns: config.homepagePatterns.map(p => p.source),
    chartPatterns: config.chartPatterns.map(p => p.source)
  }));
}