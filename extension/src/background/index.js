/**
 * Candlebot扩展后台脚本
 * 处理扩展核心逻辑：网站识别、截图、数据传递
 */

// 注意：由于Chrome扩展service worker对ES模块支持有限，这里使用动态导入
// 或者将依赖函数直接内联/通过其他方式加载

console.log('Candlebot扩展后台脚本已加载');

// 扩展状态
let extensionState = {
  currentTab: null,
  currentSite: null,
  isChartPage: false,
  lastScreenshot: null,
  environment: 'development'
};

// 初始化
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
  chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
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

  // 更新扩展图标状态
  updateExtensionIcon(tab.id, checkResult);

  // 发送状态更新到popup
  sendStateToPopup({
    tabId: tab.id,
    url: tab.url,
    site: checkResult.site,
    isChartPage: checkResult.isChartPage,
    reason: checkResult.reason
  });
}

/**
 * 更新扩展图标状态
 */
function updateExtensionIcon(tabId, checkResult) {
  const title = checkResult.isChartPage
    ? 'Candlebot · 点击截图并分析'
    : checkResult.supported
    ? `Candlebot · ${checkResult.reason}`
    : 'Candlebot · 请在支持的图表网站使用';

  // 更新标题
  chrome.action.setTitle({
    tabId,
    title
  });

  // 更新图标（如果有不同状态的图标）
  const iconPath = checkResult.isChartPage
    ? {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    : {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      };

  chrome.action.setIcon({
    tabId,
    path: iconPath
  });

  console.log(`更新图标状态: ${title}`);
}

/**
 * 发送状态到popup
 */
function sendStateToPopup(state) {
  // 可以通过storage或message发送状态
  chrome.storage.local.set({ candlebot_current_state: state }, () => {
    if (chrome.runtime.lastError) {
      console.error('发送状态到popup失败:', chrome.runtime.lastError.message);
    }
  });
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
      format: 'png',
      quality: 85,
      compress: true,
      maxWidth: 1920,
      maxHeight: 1080
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
      }
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
 * 处理扩展图标点击
 */
chrome.action.onClicked.addListener(async (tab) => {
  console.log('扩展图标被点击，标签页:', tab.id, 'URL:', tab.url);

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
  const result = await executeScreenshotFlow();

  if (result.success) {
    console.log('截图分析流程成功完成');
    // 可以显示成功通知
    showNotification('截图成功', '已发送到Candlebot分析页面');
  } else {
    console.error('截图分析流程失败:', result.error);
    // 显示错误通知
    showNotification('截图失败', result.error || '未知错误');
  }
});

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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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

// 初始化扩展
initialize();