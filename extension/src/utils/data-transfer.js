/**
 * 数据传输工具 - 处理截图数据传递到web app
 */

// Web app URL配置
const WEB_APP_URLS = {
  development: 'http://localhost:5173',
  production: 'https://chat.candlebot.app'
};

// 当前环境
let currentEnvironment = 'development';

/**
 * 设置当前环境
 * @param {string} env - 'development' 或 'production'
 */
export function setEnvironment(env) {
  if (WEB_APP_URLS[env]) {
    currentEnvironment = env;
    console.log(`环境设置为: ${env}`);
  } else {
    console.warn(`未知环境: ${env}，使用默认环境: development`);
  }
}

/**
 * 获取当前环境的web app URL
 * @returns {string} web app URL
 */
export function getWebAppUrl() {
  return WEB_APP_URLS[currentEnvironment];
}

/**
 * 获取新分析页面的URL
 * @param {Object} options - URL选项
 * @returns {string} 完整URL
 */
export function getNewAnalysisUrl(options = {}) {
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

  return url.toString();
}

/**
 * 通过URL参数传递数据（适合小数据）
 * @param {string} dataUrl - base64图片数据
 * @param {Object} metadata - 元数据
 * @returns {string} 带有数据的URL
 */
export function createDataUrlWithParams(dataUrl, metadata = {}) {
  const baseUrl = getNewAnalysisUrl(metadata);

  // 检查数据是否适合URL传递
  if (dataUrl.length > 2000) {
    console.warn('图片数据太大，不适合URL参数传递');
    // 只传递标记，数据将通过其他方式传递
    return baseUrl;
  }

  // 添加图片数据到URL参数
  const url = new URL(baseUrl);
  url.searchParams.set('image_data', encodeURIComponent(dataUrl));
  url.searchParams.set('data_source', 'url_params');

  return url.toString();
}

/**
 * 通过localStorage传递数据
 * @param {string} dataUrl - base64图片数据
 * @param {Object} metadata - 元数据
 * @returns {Promise<string>} 存储ID和URL
 */
export async function transferViaLocalStorage(dataUrl, metadata = {}) {
  return new Promise((resolve, reject) => {
    // 生成唯一存储键
    const storageKey = `candlebot_extension_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 准备存储数据
    const storageData = {
      imageData: dataUrl,
      metadata: {
        ...metadata,
        storageKey,
        timestamp: new Date().toISOString(),
        dataSource: 'local_storage'
      }
    };

    // 存储到扩展的storage
    chrome.storage.local.set({ [storageKey]: storageData }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(`存储数据失败: ${chrome.runtime.lastError.message}`));
        return;
      }

      console.log(`数据已存储到localStorage，键: ${storageKey}`);

      // 创建跳转URL
      const url = getNewAnalysisUrl({
        ...metadata,
        storage_key: storageKey
      });

      resolve({
        url,
        storageKey,
        method: 'local_storage'
      });
    });
  });
}

/**
 * 通过content script传递数据
 * @param {string} dataUrl - base64图片数据
 * @param {Object} metadata - 元数据
 * @returns {Promise<Object>} 传递结果
 */
export async function transferViaContentScript(dataUrl, metadata = {}) {
  return new Promise((resolve, reject) => {
    // 创建新标签页
    const url = getNewAnalysisUrl(metadata);

    chrome.tabs.create({ url }, (newTab) => {
      if (chrome.runtime.lastError) {
        reject(new Error(`创建标签页失败: ${chrome.runtime.lastError.message}`));
        return;
      }

      console.log(`已创建新标签页: ${newTab.id}`);

      // 监听标签页加载完成
      const listener = (tabId, info) => {
        if (tabId === newTab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);

          // 发送数据到content script
          chrome.tabs.sendMessage(tabId, {
            type: 'SET_SCREENSHOT_DATA',
            data: dataUrl,
            metadata: {
              ...metadata,
              dataSource: 'content_script'
            }
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('发送数据失败:', chrome.runtime.lastError.message);
              reject(new Error(`发送数据失败: ${chrome.runtime.lastError.message}`));
            } else {
              console.log('数据发送成功:', response?.success);
              resolve({
                tabId: newTab.id,
                url,
                method: 'content_script',
                response
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
      }, 10000);
    });
  });
}

/**
 * 通过postMessage传递数据（推荐方案）
 * @param {string} dataUrl - base64图片数据
 * @param {Object} metadata - 元数据
 * @returns {Promise<Object>} 传递结果
 */
export async function transferViaPostMessage(dataUrl, metadata = {}) {
  return new Promise((resolve, reject) => {
    // 创建新标签页
    const url = getNewAnalysisUrl(metadata);

    // 使用chrome.tabs.create确保在扩展上下文中打开
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

          console.log('页面加载完成，准备发送数据...');

          // 注入脚本到目标页面来发送postMessage
          chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            func: (dataUrl, metadata, extensionId) => {
              // 这个函数会在目标页面的上下文中执行
              console.log('注入脚本执行，准备发送postMessage...');

              // 发送数据到页面
              window.postMessage({
                type: 'candlebot_extension_image',
                imageData: dataUrl,
                metadata: {
                  ...metadata,
                  dataSource: 'post_message',
                  extensionId: extensionId,
                  timestamp: new Date().toISOString()
                }
              }, window.location.origin);

              console.log('postMessage已发送，数据长度:', dataUrl.length);
              return { success: true, dataLength: dataUrl.length };
            },
            args: [dataUrl, metadata, chrome.runtime.id]
          }, (results) => {
            if (chrome.runtime.lastError) {
              console.error('注入脚本失败:', chrome.runtime.lastError.message);
              reject(new Error(`注入脚本失败: ${chrome.runtime.lastError.message}`));
            } else {
              console.log('脚本注入成功:', results?.[0]?.result);
              resolve({
                tabId: newTab.id,
                url,
                method: 'post_message',
                dataSize: dataUrl.length
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
 * 智能选择数据传输方法
 * @param {string} dataUrl - base64图片数据
 * @param {Object} metadata - 元数据
 * @returns {Promise<Object>} 传输结果
 */
export async function transferScreenshotData(dataUrl, metadata = {}) {
  console.log('开始传输截图数据...');

  // 检查数据大小
  const dataSize = dataUrl.length;
  console.log(`数据大小: ${dataSize} 字符`);

  // 优先尝试postMessage方法（最可靠，无大小限制）
  try {
    console.log('尝试postMessage传输...');
    const result = await transferViaPostMessage(dataUrl, metadata);
    return {
      method: 'post_message',
      ...result,
      dataSize
    };
  } catch (postMessageError) {
    console.warn('postMessage传输失败，尝试其他方法:', postMessageError.message);

    // 降级到其他方法
    if (dataSize <= 2000) {
      // 小数据：使用URL参数
      console.log('尝试URL参数传输...');
      const url = createDataUrlWithParams(dataUrl, metadata);
      return {
        method: 'url_params',
        url,
        dataSize
      };
    } else if (dataSize <= 5 * 1024 * 1024) {
      // 中等数据：使用localStorage
      try {
        console.log('尝试localStorage传输...');
        const result = await transferViaLocalStorage(dataUrl, metadata);
        return {
          method: 'local_storage',
          ...result,
          dataSize
        };
      } catch (localStorageError) {
        console.warn('localStorage传输失败:', localStorageError.message);
        // 继续尝试content script
      }
    }

    // 最后尝试content script
    try {
      console.log('尝试content script传输...');
      const result = await transferViaContentScript(dataUrl, metadata);
      return {
        method: 'content_script',
        ...result,
        dataSize
      };
    } catch (contentScriptError) {
      console.error('所有传输方法都失败:', contentScriptError);
      throw new Error(`数据传输失败: ${contentScriptError.message}`);
    }
  }
}

/**
 * 清理传输的数据
 * @param {string} storageKey - 存储键
 */
export async function cleanupTransferredData(storageKey) {
  if (storageKey) {
    chrome.storage.local.remove([storageKey], () => {
      if (chrome.runtime.lastError) {
        console.error('清理存储数据失败:', chrome.runtime.lastError.message);
      } else {
        console.log(`已清理存储数据: ${storageKey}`);
      }
    });
  }
}

/**
 * 测试web app连接
 * @returns {Promise<boolean>} 是否连接成功
 */
export async function testWebAppConnection() {
  try {
    const response = await fetch(getWebAppUrl(), { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.log('Web app连接测试失败:', error.message);
    return false;
  }
}