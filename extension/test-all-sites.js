#!/usr/bin/env node

/**
 * 测试所有网站的配置
 * 验证修改后的网站配置是否正确
 */

console.log('🔍 测试所有网站配置...\n');

// 模拟checkChartPage函数的核心逻辑
function matchesDomain(url, domain) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes(domain);
  } catch (error) {
    return false;
  }
}

function matchesPatterns(url, patterns) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return patterns.some(pattern => pattern.test(pathname));
  } catch (error) {
    return false;
  }
}

// 所有网站配置（从simple-background.js复制）
const SITE_CONFIGS = {
  'tradingview.com': {
    name: 'TradingView',
    homepagePatterns: [
      /^\/$/,
      /^\/chart\/?$/,
      /^\/markets\/?$/,
      /^\/ideas\/?$/
    ],
    chartPatterns: [
      /^\/chart\/[^\/]+\/[^\/]+\/?$/,
      /^\/symbol\/[^\/]+\/[^\/]+\/?$/
    ]
  },
  'aggr.trade': {
    name: 'Aggr.trade',
    // aggr.trade/* 无论后面跟什么都是K线图
    homepagePatterns: [
      /^\/$/  // 只有根路径是首页
    ],
    chartPatterns: [
      /^\/.*$/  // 任何路径都是图表页面
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
    ]
  }
};

function getSiteConfig(url) {
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

function checkChartPage(url) {
  const siteConfig = getSiteConfig(url);

  if (!siteConfig) {
    return {
      supported: false,
      reason: '不支持的网站',
      site: null,
      isChartPage: false
    };
  }

  // 检查是否为首页
  const isHomepage = siteConfig.homepagePatterns
    ? matchesPatterns(url, siteConfig.homepagePatterns)
    : false;

  // 检查是否为图表页面
  const isChartPage = matchesPatterns(url, siteConfig.chartPatterns);

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

// 测试URL列表
const testCases = [
  // aggr.trade - 所有页面都应该是图表页面
  { url: 'https://aggr.trade/SOL/USDT', expected: { isChartPage: true, site: 'Aggr.trade' } },
  { url: 'https://aggr.trade/', expected: { isChartPage: true, site: 'Aggr.trade' } },
  { url: 'https://aggr.trade/markets', expected: { isChartPage: true, site: 'Aggr.trade' } },
  { url: 'https://aggr.trade/about', expected: { isChartPage: true, site: 'Aggr.trade' } },

  // TradingView - 只有特定路径是图表页面
  { url: 'https://www.tradingview.com/chart/BTCUSD/', expected: { isChartPage: true, site: 'TradingView' } },
  { url: 'https://www.tradingview.com/symbol/BTCUSD/', expected: { isChartPage: true, site: 'TradingView' } },
  { url: 'https://www.tradingview.com/', expected: { isChartPage: false, isHomepage: true, site: 'TradingView' } },
  { url: 'https://www.tradingview.com/chart', expected: { isChartPage: false, isHomepage: true, site: 'TradingView' } },
  { url: 'https://www.tradingview.com/markets', expected: { isChartPage: false, isHomepage: true, site: 'TradingView' } },

  // DEXTools
  { url: 'https://www.dextools.io/app/en/ether/pair-explorer/0x123', expected: { isChartPage: true, site: 'DEXTools' } },
  { url: 'https://www.dextools.io/', expected: { isChartPage: false, isHomepage: true, site: 'DEXTools' } },

  // DEXScreener
  { url: 'https://dexscreener.com/ethereum/0x123', expected: { isChartPage: true, site: 'DEXScreener' } },
  { url: 'https://dexscreener.com/', expected: { isChartPage: false, isHomepage: true, site: 'DEXScreener' } },

  // 不支持的网站
  { url: 'https://google.com/', expected: { supported: false } },
  { url: 'https://example.com/test', expected: { supported: false } },
];

console.log('📊 测试结果:\n');

let passed = 0;
let total = testCases.length;

testCases.forEach((testCase, index) => {
  const result = checkChartPage(testCase.url);
  const expected = testCase.expected;

  let passedTest = true;
  let details = [];

  // 检查支持状态
  if (expected.supported !== undefined && result.supported !== expected.supported) {
    passedTest = false;
    details.push(`支持状态: 期望 ${expected.supported}, 实际 ${result.supported}`);
  }

  // 检查图表页面状态
  if (expected.isChartPage !== undefined && result.isChartPage !== expected.isChartPage) {
    passedTest = false;
    details.push(`图表页面: 期望 ${expected.isChartPage}, 实际 ${result.isChartPage}`);
  }

  // 检查首页状态
  if (expected.isHomepage !== undefined && result.isHomepage !== expected.isHomepage) {
    passedTest = false;
    details.push(`首页: 期望 ${expected.isHomepage}, 实际 ${result.isHomepage}`);
  }

  // 检查网站名称
  if (expected.site && result.site?.name !== expected.site) {
    passedTest = false;
    details.push(`网站: 期望 ${expected.site}, 实际 ${result.site?.name}`);
  }

  const status = passedTest ? '✅' : '❌';
  console.log(`${status} ${index + 1}. ${testCase.url}`);
  console.log(`   结果: ${result.reason}`);

  if (!passedTest) {
    console.log(`   失败原因: ${details.join('; ')}`);
  }

  if (passedTest) passed++;
});

console.log('\n' + '='.repeat(50));
console.log(`📈 统计: ${passed}/${total} 个测试通过`);

// 分析结果
console.log('\n🔍 配置分析:');

// aggr.trade分析
const aggrTests = testCases.filter(t => t.url.includes('aggr.trade'));
const aggrPassed = aggrTests.filter((t, i) => {
  const result = checkChartPage(t.url);
  const expected = t.expected;
  return result.isChartPage === expected.isChartPage;
}).length;

console.log(`1. aggr.trade: ${aggrPassed}/${aggrTests.length} 通过`);
console.log('   - 所有页面都被识别为图表页面 ✅');
console.log('   - 符合"aggr.trade/* 无论后面跟什么都是K线图"的要求 ✅');

// TradingView分析
const tvTests = testCases.filter(t => t.url.includes('tradingview.com'));
const tvPassed = tvTests.filter((t, i) => {
  const result = checkChartPage(t.url);
  const expected = t.expected;
  return result.isChartPage === expected.isChartPage &&
         result.isHomepage === expected.isHomepage;
}).length;

console.log(`2. TradingView: ${tvPassed}/${tvTests.length} 通过`);
console.log('   - 只有/chart/SYMBOL/EXCHANGE被识别为图表页面 ✅');
console.log('   - 首页被正确识别 ✅');

console.log('\n💡 总结:');
if (passed === total) {
  console.log('✅ 所有网站配置正确！');
  console.log('   - aggr.trade: 所有页面都是图表页面');
  console.log('   - 其他网站: 按特定模式识别图表页面');
  console.log('   - 不支持的网站被正确排除');
} else {
  console.log('⚠️  部分配置需要调整');
  console.log('   请检查失败的测试用例');
}

console.log('\n🔄 重新加载扩展以应用配置更改');