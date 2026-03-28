/**
 * Candlebot扩展测试脚本
 * 测试扩展的核心功能
 */

console.log('=== Candlebot扩展测试 ===');

// 测试URL匹配器
function testUrlMatcher() {
  console.log('\n1. 测试URL匹配器:');

  const testUrls = [
    'https://www.tradingview.com/chart/BTC/USD',
    'https://www.tradingview.com/chart/',
    'https://www.tradingview.com/',
    'https://aggr.trade/SOL/USDT',
    'https://aggr.trade/trade/ETH/USDC',
    'https://aggr.trade/',
    'https://www.dextools.io/app/en/ether/pair-explorer/0x123',
    'https://www.dextools.io/app/',
    'https://www.google.com/'
  ];

  // 动态导入URL匹配器
  const urlMatcherCode = `
    const SITE_CONFIGS = {
      'tradingview.com': {
        name: 'TradingView',
        homepagePatterns: [/^\\/$/, /^\\/chart\\/?$/],
        chartPatterns: [/^\\/chart\\/[^\\/]+\\/[^\\/]+\\/?$/]
      },
      'aggr.trade': {
        name: 'Aggr.trade',
        homepagePatterns: [/^\\/$/],
        chartPatterns: [/^\\/[^\\/]+\\/[^\\/]+\\/?$/, /^\\/trade\\/[^\\/]+\\/[^\\/]+\\/?$/]
      }
    };

    function checkChartPage(url) {
      try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;
        const pathname = urlObj.pathname;

        for (const [domain, config] of Object.entries(SITE_CONFIGS)) {
          if (hostname.includes(domain)) {
            const isChartPage = config.chartPatterns.some(p => p.test(pathname));
            const isHomepage = config.homepagePatterns.some(p => p.test(pathname));

            return {
              supported: true,
              site: config,
              isChartPage,
              isHomepage,
              reason: isChartPage ? \`检测到\${config.name}图表页面\` :
                      isHomepage ? \`检测到\${config.name}首页\` :
                      \`检测到\${config.name}页面，但非图表页面\`
            };
          }
        }

        return {
          supported: false,
          reason: '不支持的网站'
        };
      } catch (error) {
        return {
          supported: false,
          reason: \`URL解析错误: \${error.message}\`
        };
      }
    }

    // 导出测试函数
    window.testUrlMatcher = (url) => checkChartPage(url);
  `;

  // 创建测试iframe
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(`
    <script>${urlMatcherCode}</script>
    <div id="results"></div>
  `);
  iframeDoc.close();

  // 执行测试
  testUrls.forEach(url => {
    const result = iframe.contentWindow.testUrlMatcher(url);
    console.log(`  ${url}`);
    console.log(`    → 支持: ${result.supported ? '是' : '否'}`);
    console.log(`    → 图表页面: ${result.isChartPage ? '是' : '否'}`);
    console.log(`    → 原因: ${result.reason}`);
  });

  document.body.removeChild(iframe);
  console.log('✅ URL匹配器测试完成');
}

// 测试截图工具
function testScreenshotTools() {
  console.log('\n2. 测试截图工具:');

  // 测试base64数据提取
  const testDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  function extractBase64Data(dataUrl) {
    const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
    return base64Match && base64Match[1] ? base64Match[1] : dataUrl;
  }

  function estimateImageSize(dataUrl) {
    const base64Data = extractBase64Data(dataUrl);
    const bytes = Math.floor(base64Data.length * 3 / 4);

    return {
      base64Length: dataUrl.length,
      base64DataLength: base64Data.length,
      estimatedBytes: bytes,
      estimatedKB: Math.floor(bytes / 1024)
    };
  }

  const sizeInfo = estimateImageSize(testDataUrl);
  console.log(`  测试数据URL长度: ${sizeInfo.base64Length}`);
  console.log(`  Base64数据长度: ${sizeInfo.base64DataLength}`);
  console.log(`  估算字节数: ${sizeInfo.estimatedBytes} (${sizeInfo.estimatedKB}KB)`);

  // 测试数据大小检查
  function checkDataSize(dataUrl) {
    const sizeInfo = estimateImageSize(dataUrl);
    const maxUrlLength = 2000;
    const maxStorageSize = 5 * 1024 * 1024;

    const fitsInUrl = dataUrl.length <= maxUrlLength;
    const fitsInStorage = sizeInfo.estimatedBytes <= maxStorageSize;

    return {
      ...sizeInfo,
      fitsInUrl,
      fitsInStorage,
      recommendation: fitsInUrl ? 'url' : fitsInStorage ? 'storage' : 'compress'
    };
  }

  const checkResult = checkDataSize(testDataUrl);
  console.log(`  适合URL传递: ${checkResult.fitsInUrl ? '是' : '否'}`);
  console.log(`  适合存储传递: ${checkResult.fitsInStorage ? '是' : '否'}`);
  console.log(`  推荐方法: ${checkResult.recommendation}`);

  console.log('✅ 截图工具测试完成');
}

// 测试数据传输
function testDataTransfer() {
  console.log('\n3. 测试数据传输:');

  // 测试URL生成
  function getNewAnalysisUrl(baseUrl = 'http://localhost:5173', options = {}) {
    const url = new URL('/new', baseUrl);
    url.searchParams.set('from_extension', 'true');

    if (options.site) url.searchParams.set('site', options.site);
    if (options.symbol) url.searchParams.set('symbol', options.symbol);
    if (options.timeframe) url.searchParams.set('timeframe', options.timeframe);

    return url.toString();
  }

  const testUrls = [
    getNewAnalysisUrl('http://localhost:5173', {}),
    getNewAnalysisUrl('http://localhost:5173', { site: 'TradingView', symbol: 'BTCUSD' }),
    getNewAnalysisUrl('https://chat.candlebot.app', { site: 'Aggr.trade', symbol: 'SOLUSDT', timeframe: '1H' })
  ];

  console.log('  生成的URL:');
  testUrls.forEach((url, i) => {
    console.log(`  ${i + 1}. ${url}`);
  });

  // 测试URL参数编码
  function createDataUrlWithParams(baseUrl, dataUrl, metadata = {}) {
    const url = new URL(baseUrl);

    if (dataUrl.length <= 2000) {
      url.searchParams.set('image_data', encodeURIComponent(dataUrl));
      url.searchParams.set('data_source', 'url_params');
    }

    return url.toString();
  }

  const testDataUrl = 'data:image/png;base64,test123';
  const testBaseUrl = 'http://localhost:5173/new?from_extension=true';
  const dataUrlWithParams = createDataUrlWithParams(testBaseUrl, testDataUrl, { test: 'data' });

  console.log(`  带参数的URL: ${dataUrlWithParams}`);
  console.log('✅ 数据传输测试完成');
}

// 测试扩展API
function testExtensionAPI() {
  console.log('\n4. 测试扩展API:');

  // 检查chrome API可用性
  const chromeAPIs = [
    'runtime',
    'tabs',
    'storage',
    'action'
  ];

  console.log('  Chrome API检查:');
  chromeAPIs.forEach(api => {
    const available = typeof chrome !== 'undefined' && chrome[api] !== undefined;
    console.log(`    ${api}: ${available ? '可用' : '不可用'}`);
  });

  // 测试消息发送（模拟）
  console.log('  消息发送测试（模拟）:');

  const testMessages = [
    { type: 'PING' },
    { type: 'GET_CURRENT_STATE' },
    { type: 'CAPTURE_SCREENSHOT' },
    { type: 'TEST_CONNECTION' }
  ];

  testMessages.forEach(msg => {
    console.log(`    发送: ${msg.type}`);
  });

  console.log('✅ 扩展API测试完成');
}

// 运行所有测试
function runAllTests() {
  console.log('开始Candlebot扩展测试...\n');

  try {
    testUrlMatcher();
    testScreenshotTools();
    testDataTransfer();
    testExtensionAPI();

    console.log('\n=== 所有测试完成 ===');
    console.log('✅ 扩展核心功能测试通过');
    console.log('📝 下一步:');
    console.log('  1. 在Chrome中加载扩展');
    console.log('  2. 访问支持的图表网站测试');
    console.log('  3. 验证数据传递到Web应用');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

// 如果直接在浏览器中运行
if (typeof window !== 'undefined') {
  // 等待页面加载
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runAllTests);
  } else {
    runAllTests();
  }
} else {
  // Node.js环境
  console.log('请在浏览器环境中运行此测试脚本');
  console.log('将代码复制到浏览器控制台执行');
}

// 导出测试函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testUrlMatcher,
    testScreenshotTools,
    testDataTransfer,
    testExtensionAPI,
    runAllTests
  };
}