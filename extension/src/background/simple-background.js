/**
 * Candlebot扩展简化后台脚本
 * 避免ES模块导入问题，使用传统脚本方式
 */

console.log('Candlebot扩展简化后台脚本已加载');

// 扩展状态
let extensionState = {
  currentTab: null,
  currentSite: null,
  isChartPage: false,
  lastScreenshot: null,
  environment: 'development'
};

// Web app URL配置
const WEB_APP_URLS = {
  development: 'http://localhost:5173',
  production: 'https://chat.candlebot.app'
};

// 当前环境
let currentEnvironment = 'development';

/**
 * 设置当前环境
 */
function setEnvironment(env) {
  if (WEB_APP_URLS[env]) {
    currentEnvironment = env;
    console.log(`环境设置为: ${env}`);
  } else {
    console.warn(`未知环境: ${env}，使用默认环境: development`);
  }
}

/**
 * 获取当前环境的web app URL
 */
function getWebAppUrl() {
  return WEB_APP_URLS[currentEnvironment];
}

/**
 * 获取新分析页面的URL
 */
function getNewAnalysisUrl(options = {}) {
  const baseUrl = getWebAppUrl();
  const url = new URL('/new', baseUrl);

  // 添加扩展标记
  url.searchParams.set('from_extension', 'true');

  // 添加其他参数
  if (options.site) {
    url.searchParams.set('site', options.site);
  }
  if (options.symbol) {
    url.searchParams.set('symbol', options.symbol);
  }
  if (options.timeframe) {
    url.searchParams.set('timeframe', options.timeframe);
  }
  if (options.exchange) {
    url.searchParams.set('exchange', options.exchange);
  }
  if (options.timestamp) {
    url.searchParams.set('timestamp', options.timestamp);
  }
  if (options.pendingImageId) {
    url.searchParams.set('pending_image_id', options.pendingImageId);
  }

  return url.toString();
}

/**
 * 创建包含图片数据的URL
 * 用于直接跳转时传递数据
 */
function createAnalysisUrlWithImage(dataUrl, metadata = {}) {
  const baseUrl = getNewAnalysisUrl(metadata);

  // 提取纯base64数据（移除data:image/\w+;base64,前缀）
  // 使用更灵活的正则表达式匹配各种格式
  const pureBase64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  const pureBase64Size = pureBase64.length;

  console.log(`创建包含图片数据的URL，纯base64长度: ${pureBase64Size}`);

  // 检查数据是否适合URL传递（增加到5000字符限制，因为使用JPEG后数据更小）
  if (pureBase64Size > 5000) {
    console.warn(`图片数据太大（${pureBase64Size} > 5000），不适合URL参数传递，将使用标记URL`);
    return baseUrl;
  }

  // 添加图片数据到URL参数
  const url = new URL(baseUrl);
  url.searchParams.set('image_data', encodeURIComponent(pureBase64));
  url.searchParams.set('data_source', 'url_params');
  url.searchParams.set('image_format', dataUrl.includes('image/jpeg') ? 'jpeg' : 'png');

  const finalUrl = url.toString();
  console.log(`最终URL长度: ${finalUrl.length}`);

  // 检查URL总长度（浏览器通常有URL长度限制，约2000-8000字符）
  if (finalUrl.length > 8000) {
    console.warn(`URL太长（${finalUrl.length} > 8000），可能被浏览器截断`);
  }

  return finalUrl;
}

/**
 * 测试web app连接
 */
async function testWebAppConnection() {
  try {
    const response = await fetch(getWebAppUrl(), { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.log('Web app连接测试失败:', error.message);
    return false;
  }
}

// 支持的网站配置
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

/**
 * 检查URL是否匹配特定网站
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
 */
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

/**
 * 检查是否为支持的K线图表页面
 */
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

/**
 * 提取图表信息
 */
async function extractChartInfo(url, siteConfig) {
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
 * 捕获截图
 */
async function captureScreenshot(options = {}) {
  const defaultOptions = {
    format: 'jpeg',  // 默认使用JPEG，文件更小
    quality: 70,     // 默认质量70%
    compress: true,
    maxWidth: 1280,  // 默认分辨率1280x720
    maxHeight: 720
  };

  const config = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: config.format }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        console.error('截图失败:', chrome.runtime.lastError);
        reject(new Error(`截图失败: ${chrome.runtime.lastError.message}`));
        return;
      }

      console.log(`截图成功，数据长度: ${dataUrl.length}`);
      resolve(dataUrl);
    });
  });
}

/**
 * 估算图片数据大小
 */
function estimateImageSize(dataUrl) {
  // 简单估算：base64编码的近似字节数
  const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
  const bytes = Math.floor(base64Data.length * 3 / 4);

  return {
    estimatedBytes: bytes,
    estimatedKB: Math.floor(bytes / 1024)
  };
}


/**
 * 通过内容脚本传递数据到页面
 */
async function transferDataViaContentScript(dataUrl, metadata = {}) {
  console.log('通过内容脚本传递数据...');

  try {
    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error('无法获取当前标签页');
    }

    console.log('目标标签页:', tab.id, 'URL:', tab.url);

    // 检查内容脚本是否已加载
    const contentScriptReady = await checkContentScriptReady(tab.id);
    if (!contentScriptReady) {
      console.warn('内容脚本未就绪，尝试注入内容脚本...');

      // 尝试注入内容脚本
      const injectionSuccess = await injectContentScript(tab.id);
      if (!injectionSuccess) {
        throw new Error('无法注入内容脚本');
      }

      // 等待内容脚本初始化
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 提取纯base64数据
    const pureBase64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    const imageFormat = dataUrl.includes('image/jpeg') ? 'jpeg' : 'png';

    console.log('通过内容脚本传递纯base64数据，长度:', pureBase64.length, '格式:', imageFormat);

    // 发送数据到内容脚本，添加超时处理
    const response = await Promise.race([
      chrome.tabs.sendMessage(tab.id, {
        type: 'SET_SCREENSHOT_DATA',
        data: pureBase64,
        metadata: {
          ...metadata,
          dataSource: 'background_script',
          timestamp: new Date().toISOString(),
          imageFormat: imageFormat
        }
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('发送消息超时')), 3000)
      )
    ]);

    if (!response?.success) {
      throw new Error(response?.error || '内容脚本处理数据失败');
    }

    console.log('✅ 数据已通过内容脚本传递');
    return true;
  } catch (error) {
    console.error('通过内容脚本传递数据失败:', error);

    // 记录详细错误信息
    if (error.message.includes('Could not establish connection')) {
      console.error('❌ 连接失败原因: 内容脚本未加载或标签页已关闭');
      console.error('建议: 确保在支持的网站上使用扩展，并等待页面完全加载');
    }

    return false;
  }
}

/**
 * 检查内容脚本是否已就绪
 */
async function checkContentScriptReady(tabId) {
  try {
    // 发送ping消息检查内容脚本是否响应
    const response = await Promise.race([
      chrome.tabs.sendMessage(tabId, { type: 'PING' }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Ping超时')), 1000)
      )
    ]);

    return response?.pong === true;
  } catch (error) {
    console.log('内容脚本未就绪:', error.message);
    return false;
  }
}

/**
 * 注入内容脚本
 */
async function injectContentScript(tabId) {
  try {
    console.log('尝试注入内容脚本到标签页:', tabId);

    // 使用scripting API注入内容脚本
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/index.js']
    });

    console.log('✅ 内容脚本注入成功');
    return true;
  } catch (error) {
    console.error('❌ 注入内容脚本失败:', error);
    return false;
  }
}

/**
 * 传输截图数据
 */
async function transferScreenshotData(dataUrl, metadata = {}) {
  console.log('开始传输截图数据...');

  const dataSize = dataUrl.length;
  console.log(`数据大小: ${dataSize} 字符`);

  // 提取纯base64数据用于大小检查
  const pureBase64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  const pureBase64Size = pureBase64.length;
  console.log(`纯base64大小: ${pureBase64Size} 字符`);

  // 首选方案：POST到本地中转API（新方案）
  console.log('尝试POST到本地中转API...');
  try {
    const result = await transferViaLocalApi(dataUrl, metadata);
    console.log('✅ 本地中转API传递成功');
    return {
      method: 'local_api',
      ...result,
      dataSize: pureBase64Size,
      note: '数据已通过本地中转API传递'
    };
  } catch (localApiError) {
    console.warn('本地中转API传输失败，尝试其他方法:', localApiError.message);
  }

  // 备用方案1：使用localStorage传递（数据在页面重定向后仍然存在）
  console.log('尝试使用localStorage传递...');
  try {
    const result = await transferViaLocalStorage(dataUrl, metadata);
    console.log('✅ localStorage传递成功');
    return {
      method: 'local_storage',
      ...result,
      dataSize: pureBase64Size,
      note: '数据已存储到web app页面的localStorage'
    };
  } catch (localStorageError) {
    console.warn('localStorage传输失败，尝试其他方法:', localStorageError.message);
  }

  // 备用方案1：使用postMessage传递
  console.log('尝试使用postMessage传递...');
  try {
    const result = await transferViaPostMessage(dataUrl, metadata);
    console.log('✅ postMessage传递成功');
    return {
      method: 'post_message',
      ...result,
      dataSize: pureBase64Size,
      note: '数据已通过postMessage发送到web app页面'
    };
  } catch (postMessageError) {
    console.warn('postMessage传输失败，尝试其他方法:', postMessageError.message);
  }

  // 备用方案1：使用URL参数传递（如果数据不大）
  if (pureBase64Size <= 5000) {
    console.log(`尝试使用URL参数传递（数据大小: ${pureBase64Size} <= 5000）...`);
    try {
      const url = createAnalysisUrlWithImage(dataUrl, metadata);
      console.log('生成的URL长度:', url.length);
      return {
        method: 'url_params',
        url,
        dataSize: pureBase64Size,
        note: '使用URL参数传递'
      };
    } catch (error) {
      console.error('URL参数传递失败:', error);
    }
  } else {
    console.log(`数据太大（${pureBase64Size} > 5000），无法使用URL参数传递`);
  }


  // 备用方案3：尝试通过内容脚本传递数据
  console.log('尝试通过内容脚本传递数据...');
  const contentScriptSuccess = await transferDataViaContentScript(dataUrl, metadata);
  if (contentScriptSuccess) {
    const url = getNewAnalysisUrl(metadata);
    console.log('内容脚本传递成功，使用标记URL');
    return {
      method: 'content_script',
      url,
      dataSize: pureBase64Size,
      note: '数据已通过内容脚本传递'
    };
  }

  // 所有方法都失败：只传递标记
  console.warn('所有数据传输方法都失败，只传递标记URL');
  const url = getNewAnalysisUrl(metadata);
  return {
    method: 'marker_only',
    url,
    dataSize: pureBase64Size,
    note: '数据传输失败，请手动上传图片或重新尝试'
  };
}

/**
 * 通过postMessage传递数据到新打开的web app页面（推荐方案）
 */
async function transferViaPostMessage(dataUrl, metadata = {}) {
  return new Promise((resolve, reject) => {
    // 创建新标签页到web app
    const url = getNewAnalysisUrl(metadata);

    chrome.tabs.create({ url }, (newTab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(`创建标签页失败: ${chrome.runtime.lastError.message}`));
        return;
      }

      console.log(`已创建新标签页: ${newTab.id}，等待页面加载...`);

      // 监听标签页加载完成
      const listener = (tabId, info) => {
        if (tabId === newTab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);

          console.log('页面加载完成，准备通过postMessage发送数据...');

          // 提取纯base64数据
          const pureBase64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
          const imageFormat = dataUrl.includes('image/jpeg') ? 'jpeg' : 'png';

          // 注入脚本发送postMessage到目标页面
          chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            func: (data, meta, format) => {
              try {
                console.log('正在通过postMessage发送数据...');

                // 发送数据到页面
                window.postMessage({
                  type: 'candlebot_extension_image',
                  imageData: data,
                  metadata: {
                    ...meta,
                    imageFormat: format,
                    timestamp: new Date().toISOString(),
                    dataSource: 'post_message'
                  }
                }, window.location.origin);

                console.log('✅ postMessage已发送，数据长度:', data.length);

                // 同时存储到sessionStorage作为备份
                sessionStorage.setItem('candlebot_extension_image', data);
                sessionStorage.setItem('candlebot_extension_image_format', format);

                // 更新URL添加标记
                const currentUrl = new URL(window.location);
                currentUrl.searchParams.set('from_extension', 'true');
                window.history.replaceState({}, '', currentUrl.toString());

                console.log('✅ 数据已发送并存储到sessionStorage');
                console.log('✅ URL已更新:', currentUrl.toString());
                return true;
              } catch (error) {
                console.error('postMessage发送失败:', error);
                return false;
              }
            },
            args: [pureBase64, metadata, imageFormat]
          }, (results) => {
            if (chrome.runtime.lastError) {
              console.error('注入脚本失败:', chrome.runtime.lastError.message);
              reject(new Error(`注入脚本失败: ${chrome.runtime.lastError.message}`));
            } else {
              console.log('✅ postMessage传输成功');
              resolve({
                tabId: newTab.id,
                url,
                method: 'post_message',
                dataSize: pureBase64.length
              });
            }
          });
        }
      };

      chrome.tabs.onUpdated.addListener(listener);

      // 设置超时
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error('标签页加载超时'));
      }, 15000);
    });
  });
}

/**
 * 通过localStorage传递数据到新打开的web app页面
 */
async function transferViaLocalStorage(dataUrl, metadata = {}) {
  return new Promise((resolve, reject) => {
    // 创建新标签页到web app
    const url = getNewAnalysisUrl(metadata);

    chrome.tabs.create({ url }, async (newTab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(`创建标签页失败: ${chrome.runtime.lastError.message}`));
        return;
      }

      console.log(`已创建新标签页: ${newTab.id}，等待页面加载...`);

      // 监听标签页加载完成
      const listener = (tabId, info) => {
        if (tabId === newTab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);

          console.log('页面加载完成，准备存储数据到localStorage...');

          // 提取纯base64数据
          const pureBase64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
          const imageFormat = dataUrl.includes('image/jpeg') ? 'jpeg' : 'png';

          // 注入脚本设置localStorage到目标页面
          chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            func: (data, meta, format) => {
              try {
                console.log('正在存储数据到localStorage...');

                // 存储到localStorage
                localStorage.setItem('candlebot_extension_image', data);
                localStorage.setItem('candlebot_extension_metadata', JSON.stringify({
                  ...meta,
                  imageFormat: format,
                  storedAt: new Date().toISOString(),
                  dataSource: 'local_storage'
                }));

                console.log('✅ 数据已存储到localStorage，数据长度:', data.length);
                console.log('localStorage键: candlebot_extension_image');

                // 更新URL添加标记
                const currentUrl = new URL(window.location);
                currentUrl.searchParams.set('from_extension', 'true');
                window.history.replaceState({}, '', currentUrl.toString());

                console.log('✅ URL已更新:', currentUrl.toString());
                return true;
              } catch (error) {
                console.error('存储到localStorage失败:', error);
                return false;
              }
            },
            args: [pureBase64, metadata, imageFormat]
          }, (results) => {
            if (chrome.runtime.lastError) {
              console.error('注入脚本失败:', chrome.runtime.lastError.message);
              reject(new Error(`注入脚本失败: ${chrome.runtime.lastError.message}`));
            } else {
              console.log('✅ localStorage传输成功');
              resolve({
                tabId: newTab.id,
                url,
                method: 'local_storage',
                dataSize: pureBase64.length
              });
            }
          });
        }
      };

      chrome.tabs.onUpdated.addListener(listener);

      // 设置超时
      setTimeout(() => {
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error('标签页加载超时'));
      }, 15000);
    });
  });
}

/**
 * 通过本地中转API传递数据
 * 新方案：POST图片到本地API，然后打开/new页面获取图片
 */
async function transferViaLocalApi(dataUrl, metadata = {}) {
  console.log('开始通过本地中转API传递数据...');

  // 提取纯base64数据
  const pureBase64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
  const imageFormat = dataUrl.includes('image/jpeg') ? 'jpeg' : 'png';

  // 准备请求数据
  const requestData = {
    imageData: pureBase64,
    imageFormat: imageFormat,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString(),
      dataSource: 'local_api'
    }
  };

  console.log(`准备POST数据到本地中转API，数据长度: ${pureBase64.length}`);

  try {
    // 发送POST请求到本地中转API
    const response = await fetch('http://localhost:5173/api/pending-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API请求失败: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('本地中转API响应:', result);

    if (!result.success) {
      throw new Error(`API返回错误: ${result.error || '未知错误'}`);
    }

    const imageId = result.id;
    console.log(`✅ 图片已保存到本地中转API，ID: ${imageId}`);

    // 创建打开/new页面的URL，包含图片ID
    const newAnalysisUrl = getNewAnalysisUrl({
      ...metadata,
      pendingImageId: imageId
    });

    // 打开新标签页到/new页面
    return new Promise((resolve, reject) => {
      chrome.tabs.create({ url: newAnalysisUrl }, (newTab) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`创建标签页失败: ${chrome.runtime.lastError.message}`));
          return;
        }

        console.log(`已创建新标签页: ${newTab.id}，URL: ${newAnalysisUrl}`);

        resolve({
          tabId: newTab.id,
          url: newAnalysisUrl,
          method: 'local_api',
          dataSize: pureBase64.length,
          imageId: imageId
        });
      });
    });

  } catch (error) {
    console.error('通过本地中转API传递数据失败:', error);
    throw error;
  }
}

/**
 * 执行截图和分析流程
 */
async function executeScreenshotFlow() {
  console.log('开始截图分析流程...');

  const tab = extensionState.currentTab;
  if (!tab?.url) {
    console.error('没有可用的标签页');
    return { success: false, error: '没有可用的标签页' };
  }

  try {
    // 1. 检查当前页面
    const checkResult = checkChartPage(tab.url);
    if (!checkResult.isChartPage) {
      return {
        success: false,
        error: '当前页面不是图表页面',
        reason: checkResult.reason
      };
    }

    // 2. 提取图表信息
    const chartInfo = await extractChartInfo(tab.url, checkResult.site);
    console.log('提取的图表信息:', chartInfo);

    // 3. 执行截图
    console.log('开始截图...');
    const screenshotDataUrl = await captureScreenshot({
      format: 'jpeg',  // 使用JPEG格式，文件更小
      quality: 70,     // 降低质量以减少大小
      compress: true,
      maxWidth: 1280,  // 降低分辨率
      maxHeight: 720
    });

    const sizeInfo = estimateImageSize(screenshotDataUrl);
    console.log(`截图完成: ${sizeInfo.estimatedKB}KB`);

    // 4. 传输数据到web app
    console.log('传输数据到web app...');
    const transferResult = await transferScreenshotData(screenshotDataUrl, {
      site: checkResult.site?.name,
      symbol: chartInfo.symbol,
      timeframe: chartInfo.timeframe,
      exchange: chartInfo.exchange,
      timestamp: new Date().toISOString(),
      url: tab.url
    });

    console.log('数据传输完成:', transferResult.method);

    // 保存最后截图信息
    extensionState.lastScreenshot = {
      dataUrl: screenshotDataUrl,
      chartInfo,
      transferResult,
      timestamp: new Date().toISOString()
    };

    return {
      success: true,
      chartInfo,
      transferResult,
      screenshotInfo: {
        dataSize: sizeInfo.estimatedKB,
        dimensions: `${sizeInfo.estimatedBytes} bytes`
      },
      lastScreenshot: extensionState.lastScreenshot
    };

  } catch (error) {
    console.error('截图分析流程失败:', error);
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * 根据ID获取标签页
 */
async function getTabById(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError) {
        console.error('获取标签页失败:', chrome.runtime.lastError.message);
        resolve(null);
      } else {
        resolve(tab);
      }
    });
  });
}

/**
 * 更新标签页状态
 */
async function updateTabState(tab) {
  const checkResult = checkChartPage(tab.url);

  extensionState.currentTab = tab;
  extensionState.currentSite = checkResult.site;
  extensionState.isChartPage = checkResult.isChartPage;

  console.log('标签页状态更新:', {
    url: tab.url,
    site: checkResult.site?.name,
    isChartPage: checkResult.isChartPage,
    reason: checkResult.reason
  });

  // 发送状态更新到popup
  chrome.storage.local.set({ candlebot_current_state: {
    tabId: tab.id,
    url: tab.url,
    site: checkResult.site,
    isChartPage: checkResult.isChartPage,
    reason: checkResult.reason
  } }, () => {
    if (chrome.runtime.lastError) {
      console.error('发送状态到popup失败:', chrome.runtime.lastError.message);
    }
  });
}

/**
 * 设置标签页监听器
 */
function setupTabListeners() {
  // 标签页激活时更新状态
  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    const tab = await getTabById(tabId);
    if (tab?.url) {
      await updateTabState(tab);
    }
  });

  // 标签页更新时更新状态
  chrome.tabs.onUpdated.addListener(async (_tabId, info, tab) => {
    if ((info.url || info.status === 'complete') && tab?.url) {
      await updateTabState(tab);
    }
  });

  // 初始获取当前标签页
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs[0]?.url) {
      await updateTabState(tabs[0]);
    }
  });
}

/**
 * 显示通知
 */
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: title,
    message: message,
    priority: 1
  });
}

/**
 * 处理来自popup的消息
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('收到消息:', message.type);

  switch (message.type) {
    case 'GET_CURRENT_STATE':
      // 获取当前状态
      sendResponse({
        success: true,
        state: extensionState,
        timestamp: new Date().toISOString()
      });
      break;

    case 'CAPTURE_SCREENSHOT':
      // 手动触发截图
      executeScreenshotFlow().then(sendResponse);
      return true; // 异步响应

    case 'GET_CHART_INFO':
      // 获取图表信息
      if (extensionState.currentTab?.url && extensionState.currentSite) {
        extractChartInfo(extensionState.currentTab.url, extensionState.currentSite)
          .then(info => sendResponse({ success: true, info }))
          .catch(error => sendResponse({ success: false, error: error.message }));
      } else {
        sendResponse({ success: false, error: '没有可用的标签页或网站信息' });
      }
      return true;

    case 'GET_LAST_SCREENSHOT':
      // 获取最后截图数据
      chrome.storage.local.get(['candlebot_last_screenshot'], (result) => {
        sendResponse({
          success: true,
          screenshot: result.candlebot_last_screenshot || null
        });
      });
      return true;

    case 'CLEAR_LAST_SCREENSHOT':
      // 清除最后截图数据
      chrome.storage.local.remove(['candlebot_last_screenshot'], () => {
        sendResponse({ success: true });
      });
      return true;

    case 'SAVE_SCREENSHOT':
      // 保存截图数据
      if (message.screenshot) {
        chrome.storage.local.set({
          candlebot_last_screenshot: message.screenshot
        }, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false, error: '没有截图数据' });
      }
      return true;

    case 'SET_ENVIRONMENT':
      // 设置环境
      if (message.environment && ['development', 'production'].includes(message.environment)) {
        setEnvironment(message.environment);
        extensionState.environment = message.environment;

        // 保存设置
        chrome.storage.local.set({ candlebot_environment: message.environment }, () => {
          console.log(`环境设置已保存: ${message.environment}`);
        });

        sendResponse({ success: true, environment: message.environment });
      } else {
        sendResponse({ success: false, error: '无效的环境设置' });
      }
      break;

    case 'TEST_CONNECTION':
      // 测试连接
      testWebAppConnection().then(isConnected => {
        sendResponse({
          success: true,
          connected: isConnected,
          environment: extensionState.environment,
          webAppUrl: getNewAnalysisUrl()
        });
      });
      return true;

    case 'OPEN_WEB_APP':
      // 打开web app
      const url = message.url || getNewAnalysisUrl();
      chrome.tabs.create({ url });
      sendResponse({ success: true, url });
      break;

    case 'CHECK_SITE_SUPPORT':
      // 检查网站支持状态
      const checkUrl = message.url || extensionState.currentTab?.url;
      if (checkUrl) {
        const checkResult = checkChartPage(checkUrl);
        sendResponse({
          success: true,
          supported: checkResult.supported,
          isChartPage: checkResult.isChartPage,
          site: checkResult.site,
          reason: checkResult.reason
        });
      } else {
        sendResponse({
          success: false,
          error: '没有可用的URL进行检查'
        });
      }
      break;

    case 'PING':
      // 心跳检测
      sendResponse({
        pong: true,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
      break;

    default:
      console.log('未知消息类型:', message.type);
      sendResponse({ success: false, error: '未知的消息类型' });
  }

  return false;
});

/**
 * 处理扩展图标点击
 */
chrome.action.onClicked.addListener(async (tab) => {
  console.log('扩展图标被点击，标签页:', tab.id, 'URL:', tab.url);

  try {
    // 更新当前标签页状态
    await updateTabState(tab);

    // 检查是否为图表页面
    if (!extensionState.isChartPage) {
      console.log('当前页面不是图表页面，显示popup');
      // 非图表页面，显示popup让用户手动操作
      chrome.action.openPopup();
      return;
    }

    // 图表页面，自动执行截图流程
    console.log('检测到图表页面，开始自动截图流程...');
    const result = await executeScreenshotFlow();

    if (result.success) {
      console.log('✅ 截图分析流程成功完成');

      // 保存截图数据到storage，供popup使用
      if (result.screenshotInfo && result.chartInfo) {
        await saveScreenshotToStorage(result);
      }

      // 显示成功通知
      showNotification('截图成功', '截图已保存，请在弹窗中查看');

      // 显示popup让用户确认和预览
      chrome.action.openPopup();
    } else {
      console.error('❌ 截图分析流程失败:', result.error);

      // 显示错误通知
      const errorMessage = result.error || '截图失败，请重试';
      showNotification('截图失败', errorMessage);

      // 失败时显示popup让用户手动操作
      chrome.action.openPopup();
    }
  } catch (error) {
    console.error('❌ 处理扩展图标点击时发生错误:', error);
    showNotification('错误', '处理请求时发生错误');

    // 显示popup让用户手动操作
    chrome.action.openPopup();
  }
});

/**
 * 保存截图数据到storage
 */
async function saveScreenshotToStorage(result) {
  const screenshotData = {
    dataUrl: result.lastScreenshot?.dataUrl || null,
    chartInfo: result.chartInfo,
    transferResult: result.transferResult,
    timestamp: new Date().toISOString(),
    screenshotInfo: result.screenshotInfo
  };

  return new Promise((resolve) => {
    chrome.storage.local.set({
      candlebot_last_screenshot: screenshotData
    }, () => {
      console.log('截图数据已保存到storage');
      resolve();
    });
  });
}

/**
 * 初始化扩展
 */
async function initialize() {
  console.log('初始化Candlebot扩展...');

  // 加载保存的环境设置
  chrome.storage.local.get(['candlebot_environment'], (result) => {
    if (result.candlebot_environment) {
      setEnvironment(result.candlebot_environment);
      extensionState.environment = result.candlebot_environment;
      console.log(`加载环境设置: ${result.candlebot_environment}`);
    }
  });

  // 测试web app连接
  const isConnected = await testWebAppConnection();
  console.log(`Web app连接状态: ${isConnected ? '正常' : '失败'}`);

  // 监听标签页变化
  setupTabListeners();

  console.log('Candlebot扩展初始化完成');
}

// 初始化扩展
initialize();