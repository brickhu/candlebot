/**
 * 截图工具 - 处理图表截图功能
 */

/**
 * 捕获当前可见标签页的截图
 * @param {Object} options - 截图选项
 * @returns {Promise<string>} base64编码的图片数据
 */
export async function captureScreenshot(options = {}) {
  const defaultOptions = {
    format: 'png',
    quality: 90,
    captureArea: 'visible', // 'visible' 或 'chart'
    compress: true,
    maxWidth: 1920,
    maxHeight: 1080
  };

  const config = { ...defaultOptions, ...options };

  return new Promise((resolve, reject) => {
    chrome.tabs.captureVisibleTab(null, { format: config.format }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        reject(new Error(`截图失败: ${chrome.runtime.lastError.message}`));
        return;
      }

      console.log(`截图成功，原始数据长度: ${dataUrl.length}`);

      // 如果需要压缩，处理图片
      if (config.compress) {
        compressImage(dataUrl, config).then(resolve).catch(reject);
      } else {
        resolve(dataUrl);
      }
    });
  });
}

/**
 * 压缩图片
 * @param {string} dataUrl - 原始base64图片数据
 * @param {Object} config - 压缩配置
 * @returns {Promise<string>} 压缩后的base64图片数据
 */
async function compressImage(dataUrl, config) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        // 计算缩放比例
        let width = img.width;
        let height = img.height;

        if (width > config.maxWidth || height > config.maxHeight) {
          const scale = Math.min(
            config.maxWidth / width,
            config.maxHeight / height
          );
          width = Math.floor(width * scale);
          height = Math.floor(height * scale);
        }

        // 创建canvas进行压缩
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为压缩后的base64
        const compressedDataUrl = canvas.toDataURL(
          `image/${config.format}`,
          config.quality / 100
        );

        console.log(`图片压缩完成: ${img.width}x${img.height} -> ${width}x${height}`);
        console.log(`数据大小: ${dataUrl.length} -> ${compressedDataUrl.length}`);

        resolve(compressedDataUrl);
      } catch (error) {
        reject(new Error(`图片压缩失败: ${error.message}`));
      }
    };

    img.onerror = () => {
      reject(new Error('加载图片失败'));
    };

    img.src = dataUrl;
  });
}

/**
 * 从base64数据URL中提取纯base64数据
 * @param {string} dataUrl - base64数据URL
 * @returns {string} 纯base64数据
 */
export function extractBase64Data(dataUrl) {
  // 移除 data:image/png;base64, 前缀
  const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
  if (base64Match && base64Match[1]) {
    return base64Match[1];
  }
  return dataUrl;
}

/**
 * 估算图片数据大小
 * @param {string} dataUrl - base64数据URL
 * @returns {Object} 大小信息
 */
export function estimateImageSize(dataUrl) {
  const base64Data = extractBase64Data(dataUrl);
  const bytes = Math.floor(base64Data.length * 3 / 4); // base64编码的近似字节数

  return {
    base64Length: dataUrl.length,
    base64DataLength: base64Data.length,
    estimatedBytes: bytes,
    estimatedKB: Math.floor(bytes / 1024),
    estimatedMB: (bytes / (1024 * 1024)).toFixed(2)
  };
}

/**
 * 检查图片数据是否适合URL传递
 * @param {string} dataUrl - base64数据URL
 * @returns {Object} 检查结果
 */
export function checkDataSize(dataUrl) {
  const sizeInfo = estimateImageSize(dataUrl);
  const maxUrlLength = 2000; // 保守的URL长度限制
  const maxStorageSize = 5 * 1024 * 1024; // 5MB localStorage限制

  const fitsInUrl = dataUrl.length <= maxUrlLength;
  const fitsInStorage = sizeInfo.estimatedBytes <= maxStorageSize;

  return {
    ...sizeInfo,
    fitsInUrl,
    fitsInStorage,
    recommendation: fitsInUrl ? 'url' : fitsInStorage ? 'storage' : 'compress'
  };
}

/**
 * 保存截图到本地存储
 * @param {string} dataUrl - base64数据URL
 * @param {Object} metadata - 元数据
 * @returns {Promise<string>} 存储ID
 */
export async function saveScreenshotToStorage(dataUrl, metadata = {}) {
  return new Promise((resolve, reject) => {
    const storageId = `screenshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const storageData = {
      dataUrl,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString(),
        storageId
      }
    };

    chrome.storage.local.set({ [storageId]: storageData }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(`保存到存储失败: ${chrome.runtime.lastError.message}`));
      } else {
        console.log(`截图已保存到存储: ${storageId}`);
        resolve(storageId);
      }
    });
  });
}

/**
 * 从本地存储加载截图
 * @param {string} storageId - 存储ID
 * @returns {Promise<Object>} 截图数据和元数据
 */
export async function loadScreenshotFromStorage(storageId) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([storageId], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(`从存储加载失败: ${chrome.runtime.lastError.message}`));
      } else if (!result[storageId]) {
        reject(new Error(`未找到存储数据: ${storageId}`));
      } else {
        resolve(result[storageId]);
      }
    });
  });
}

/**
 * 清理过期的截图数据
 * @param {number} maxAgeHours - 最大保存时间（小时）
 */
export async function cleanupOldScreenshots(maxAgeHours = 24) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, (items) => {
      if (chrome.runtime.lastError) {
        reject(new Error(`清理存储失败: ${chrome.runtime.lastError.message}`));
        return;
      }

      const now = Date.now();
      const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
      const keysToRemove = [];

      for (const [key, value] of Object.entries(items)) {
        if (key.startsWith('screenshot_')) {
          const timestamp = new Date(value.metadata?.timestamp).getTime();
          if (isNaN(timestamp) || (now - timestamp) > maxAgeMs) {
            keysToRemove.push(key);
          }
        }
      }

      if (keysToRemove.length > 0) {
        chrome.storage.local.remove(keysToRemove, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(`删除旧数据失败: ${chrome.runtime.lastError.message}`));
          } else {
            console.log(`清理了 ${keysToRemove.length} 个旧截图`);
            resolve(keysToRemove.length);
          }
        });
      } else {
        resolve(0);
      }
    });
  });
}