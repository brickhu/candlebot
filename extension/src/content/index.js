/**
 * Candlebot扩展通用内容脚本
 * 在所有支持的网站上运行，处理数据传递和DOM交互
 */

console.log('Candlebot内容脚本已加载，当前URL:', window.location.href);

// 扩展状态
let extensionState = {
  hasExtensionData: false,
  lastDataReceived: null,
  pageReady: false
};

/**
 * 初始化内容脚本
 */
function initialize() {
  console.log('初始化Candlebot内容脚本...');

  // 设置消息监听器
  setupMessageListeners();

  // 检查是否已有扩展数据
  checkExistingExtensionData();

  // 监听页面事件
  setupPageEventListeners();

  // 向页面发送就绪信号
  sendReadySignal();

  console.log('Candlebot内容脚本初始化完成');
}

/**
 * 设置消息监听器
 */
function setupMessageListeners() {
  // 监听来自background脚本的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('收到background消息:', message.type, '来自:', sender);

    switch (message.type) {
      case 'SET_SCREENSHOT_DATA':
        // 接收截图数据
        handleScreenshotData(message.data, message.metadata, sendResponse);
        return true; // 保持消息通道开放

      case 'EXTRACT_CHART_INFO':
        // 提取图表信息
        extractChartInfo(message.site).then(info => {
          sendResponse({ success: true, data: info });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true;

      case 'PING':
        // 心跳检测
        console.log('收到PING，发送PONG响应');
        sendResponse({ pong: true, timestamp: Date.now(), script: 'content_script' });
        return true;

      default:
        console.log('未知消息类型:', message.type);
        sendResponse({ success: false, error: '未知的消息类型' });
        return false;
    }
  });

  // 监听来自页面的消息（postMessage）
  window.addEventListener('message', (event) => {
    // 安全检查：只接受来自同源的消息
    if (event.origin !== window.location.origin) {
      console.log('忽略来自不同源的消息:', event.origin);
      return;
    }

    const data = event.data;
    if (data.type === 'candlebot_web_ready') {
      console.log('收到web app就绪信号:', data);
      handleWebAppReady(data);
    }
  });
}

/**
 * 检查是否已有扩展数据
 */
function checkExistingExtensionData() {
  // 检查sessionStorage
  const sessionData = sessionStorage.getItem('candlebot_extension_image');
  if (sessionData) {
    console.log('发现已存在的扩展截图数据，长度:', sessionData.length);
    extensionState.hasExtensionData = true;
    extensionState.lastDataReceived = {
      source: 'session_storage',
      timestamp: Date.now(),
      dataLength: sessionData.length
    };

    // 如果是在/new页面，自动设置URL标记
    if (window.location.pathname.includes('/new')) {
      setExtensionUrlMarker();
    }
  }

  // 检查URL参数
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('from_extension') === 'true') {
    console.log('检测到扩展跳转标记');
    extensionState.hasExtensionData = true;

    const imageData = urlParams.get('image_data');
    if (imageData) {
      console.log('从URL参数获取图片数据，长度:', imageData.length);
      // 存储到sessionStorage供web app使用
      sessionStorage.setItem('candlebot_extension_image', imageData);
    }
  }
}

/**
 * 设置页面事件监听器
 */
function setupPageEventListeners() {
  // 页面加载完成
  window.addEventListener('DOMContentLoaded', () => {
    console.log('页面DOM加载完成');
    extensionState.pageReady = true;

    // 如果是在/new页面且有扩展数据，确保URL标记正确
    if (window.location.pathname.includes('/new') && extensionState.hasExtensionData) {
      setExtensionUrlMarker();
    }
  });

  // 页面完全加载
  window.addEventListener('load', () => {
    console.log('页面完全加载');
    // 可以在这里执行更多初始化
  });
}

/**
 * 设置扩展URL标记
 */
function setExtensionUrlMarker() {
  const url = new URL(window.location);
  if (!url.searchParams.has('from_extension')) {
    url.searchParams.set('from_extension', 'true');
    window.history.replaceState({}, '', url.toString());
    console.log('✅ 已设置扩展跳转标记:', window.location.href);
  }
}

/**
 * 发送就绪信号到页面
 */
function sendReadySignal() {
  // 向页面发送扩展就绪信号
  window.postMessage(
    {
      type: 'candlebot_extension_ready',
      version: '1.0.0',
      features: ['screenshot_data', 'chart_info'],
      state: extensionState
    },
    window.location.origin
  );

  console.log('已发送扩展就绪信号到页面');
}

/**
 * 处理web app就绪信号
 */
function handleWebAppReady(data) {
  console.log('Web app已就绪:', data);

  // 如果有扩展数据，发送给web app
  if (extensionState.hasExtensionData) {
    const imageData = sessionStorage.getItem('candlebot_extension_image');
    if (imageData) {
      // 发送数据到web app
      window.postMessage(
        {
          type: 'candlebot_extension_image',
          imageData: imageData,
          metadata: {
            source: 'content_script',
            timestamp: Date.now(),
            dataLength: imageData.length
          }
        },
        window.location.origin
      );

      console.log('已发送截图数据到web app');
    }
  }
}

/**
 * 处理截图数据
 */
function handleScreenshotData(data, metadata, sendResponse) {
  console.log('处理截图数据，长度:', data?.length || 0, '元数据:', metadata);

  try {
    // 数据已经是纯base64（由background脚本提取）
    const pureBase64 = data;
    console.log('接收的纯base64长度:', pureBase64.length);

    // 存储纯base64数据
    sessionStorage.setItem('candlebot_extension_image', pureBase64);

    // 更新状态
    extensionState.hasExtensionData = true;
    extensionState.lastDataReceived = {
      source: metadata?.dataSource || 'background',
      timestamp: Date.now(),
      dataLength: data.length,
      metadata
    };

    // 设置URL标记
    setExtensionUrlMarker();

    // 发送事件通知页面
    window.dispatchEvent(new CustomEvent('candlebot_extension_data_ready', {
      detail: {
        dataLength: data.length,
        timestamp: Date.now(),
        metadata
      }
    }));

    // 如果页面已就绪，直接发送数据
    if (extensionState.pageReady) {
      window.postMessage(
        {
          type: 'candlebot_extension_image',
          imageData: pureBase64,
          metadata: {
            ...metadata,
            deliveredVia: 'postMessage',
            imageFormat: metadata?.imageFormat || 'png'
          }
        },
        window.location.origin
      );
    }

    console.log('✅ 截图数据已处理完成');
    sendResponse({ success: true, message: '数据存储成功' });

  } catch (error) {
    console.error('❌ 处理截图数据失败:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * 提取图表信息
 * @param {string} site - 网站域名
 * @returns {Promise<Object>} 图表信息
 */
async function extractChartInfo(site) {
  console.log('提取图表信息，网站:', site);

  const info = {
    url: window.location.href,
    site: site,
    timestamp: new Date().toISOString(),
    symbol: null,
    timeframe: null,
    exchange: null,
    title: document.title,
    extracted: false
  };

  try {
    // 通用提取逻辑
    const urlObj = new URL(window.location.href);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);

    // 尝试从页面标题提取
    const title = document.title;
    if (title) {
      // 常见模式：符号 - 交易所 时间框架
      const symbolMatch = title.match(/([A-Z0-9]+)\s*[-|]\s*([A-Z0-9]+)/i);
      if (symbolMatch) {
        info.symbol = symbolMatch[1];
        info.exchange = symbolMatch[2];
        info.extracted = true;
      }

      // 时间框架提取
      const timeframeMatch = title.match(/(1m|5m|15m|30m|1h|4h|1d|1w|1M)/i);
      if (timeframeMatch) {
        info.timeframe = timeframeMatch[1].toUpperCase();
      }
    }

    // 尝试从DOM提取
    try {
      // 查找可能的符号元素
      const symbolSelectors = [
        '[data-symbol]',
        '.symbol',
        '.ticker',
        '.pair',
        '.token-symbol',
        'h1, h2, h3'
      ];

      for (const selector of symbolSelectors) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (text && text.length < 20 && /[A-Z0-9]+\/[A-Z0-9]+/.test(text)) {
            const [symbol, exchange] = text.split('/');
            info.symbol = symbol;
            info.exchange = exchange;
            info.extracted = true;
            break;
          }
        }
        if (info.extracted) break;
      }
    } catch (domError) {
      console.log('DOM提取失败:', domError);
    }

    console.log('提取的图表信息:', info);
    return info;

  } catch (error) {
    console.error('提取图表信息失败:', error);
    return info;
  }
}

/**
 * 清理扩展数据
 */
function cleanupExtensionData() {
  sessionStorage.removeItem('candlebot_extension_image');
  extensionState.hasExtensionData = false;
  extensionState.lastDataReceived = null;
  console.log('已清理扩展数据');
}

// 导出函数供其他脚本使用
window.candlebotExtension = {
  getState: () => extensionState,
  extractChartInfo: (site) => extractChartInfo(site),
  cleanupData: cleanupExtensionData
};

// 初始化
initialize();