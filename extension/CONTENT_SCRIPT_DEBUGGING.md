# 内容脚本调试指南

## 常见错误：`Could not establish connection. Receiving end does not exist.`

这个错误表示background脚本尝试发送消息到内容脚本，但内容脚本没有在当前标签页中运行。

### 可能原因

1. **内容脚本未加载**
   - 当前页面不在支持的网站列表中
   - 内容脚本加载失败
   - 页面未完全加载（`run_at: "document_idle"`）

2. **时机问题**
   - 消息发送时内容脚本还未初始化
   - 标签页在消息发送前已关闭或刷新

3. **权限问题**
   - 缺少必要的扩展权限
   - 内容脚本注入失败

### 解决方案

#### 1. 验证内容脚本加载

**步骤1：检查当前网站是否支持**
```javascript
// 在页面控制台运行
const supportedSites = [
  'tradingview.com',
  'aggr.trade',
  'dextools.io',
  'dexscreener.com',
  'birdeye.so',
  'geckoterminal.com'
];

const currentHost = window.location.hostname;
const isSupported = supportedSites.some(site => currentHost.includes(site));
console.log(`当前网站 ${currentHost} ${isSupported ? '支持' : '不支持'}`);
```

**步骤2：检查内容脚本是否加载**
```javascript
// 在页面控制台运行
if (typeof window.candlebotExtension !== 'undefined') {
  console.log('✅ Candlebot内容脚本已加载');
  console.log('状态:', window.candlebotExtension.getState());
} else {
  console.log('❌ Candlebot内容脚本未加载');
}
```

**步骤3：查看扩展日志**
- 打开Chrome开发者工具 (F12)
- 切换到Console标签页
- 刷新页面，查看是否有"Candlebot内容脚本已加载"日志

#### 2. 修复代码中的问题

我们已经修复了以下问题：

**改进1：添加内容脚本就绪检查**
```javascript
// 在发送消息前检查内容脚本是否就绪
const contentScriptReady = await checkContentScriptReady(tab.id);
if (!contentScriptReady) {
  console.warn('内容脚本未就绪，尝试注入...');
  await injectContentScript(tab.id);
}
```

**改进2：实现内容脚本注入**
```javascript
async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['src/content/index.js']
    });
    return true;
  } catch (error) {
    console.error('注入内容脚本失败:', error);
    return false;
  }
}
```

**改进3：添加超时和重试机制**
```javascript
// 发送消息时添加超时
const response = await Promise.race([
  chrome.tabs.sendMessage(tab.id, message),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('发送消息超时')), 3000)
  )
]);
```

**改进4：实现备用数据传输方案**
```javascript
// 如果内容脚本失败，尝试其他方法
1. URL参数（小数据）
2. localStorage（通过注入脚本）
3. 只传递标记URL
```

#### 3. 手动测试步骤

**测试1：基础功能测试**
```bash
cd extension
node test-screenshot-fix.js
```

**测试2：内容脚本通信测试**
1. 打开 `extension/test-content-script.html`
2. 点击"检查扩展环境"按钮
3. 点击"测试通信"按钮
4. 查看测试结果

**测试3：实际网站测试**
1. 访问 `https://aggr.trade/BTC/USDT`（或任何支持的网站）
2. 打开开发者工具控制台
3. 运行 `diagnoseCandlebotExtension()`（如果定义了）
4. 点击扩展图标测试截图功能

### 调试技巧

#### 1. 启用详细日志
在内容脚本中添加详细日志：
```javascript
console.log('Candlebot内容脚本初始化，URL:', window.location.href);
console.log('扩展状态:', extensionState);
```

#### 2. 检查manifest配置
确保 `manifest.json` 正确配置：
```json
{
  "content_scripts": [
    {
      "matches": ["*://*.aggr.trade/*"],
      "js": ["src/content/index.js"],
      "run_at": "document_idle"
    }
  ],
  "permissions": [
    "activeTab",
    "scripting",
    "tabs",
    "storage"
  ]
}
```

#### 3. 使用Chrome开发者工具
- **后台脚本日志**：打开 `chrome://extensions/` → 找到Candlebot扩展 → 点击"服务工作者"
- **内容脚本日志**：在目标页面的控制台中查看
- **网络请求**：检查与Web应用的通信

#### 4. 分步调试
```javascript
// 1. 检查标签页
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
console.log('当前标签页:', tab);

// 2. 检查内容脚本
const isReady = await checkContentScriptReady(tab.id);
console.log('内容脚本就绪:', isReady);

// 3. 尝试注入
if (!isReady) {
  await injectContentScript(tab.id);
}

// 4. 发送测试消息
const testResponse = await chrome.tabs.sendMessage(tab.id, { type: 'PING' });
console.log('测试响应:', testResponse);
```

### 预防措施

#### 1. 添加健康检查
在扩展初始化时添加健康检查：
```javascript
async function healthCheck() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    const isSupported = checkChartPage(tab.url).supported;
    const scriptReady = await checkContentScriptReady(tab.id);

    console.log('健康检查:', {
      url: tab.url,
      supported: isSupported,
      contentScriptReady: scriptReady
    });
  }
}
```

#### 2. 实现优雅降级
如果内容脚本不可用，使用备用方案：
```javascript
async function transferWithFallback(dataUrl, metadata) {
  // 尝试内容脚本
  try {
    return await transferDataViaContentScript(dataUrl, metadata);
  } catch (error) {
    console.warn('内容脚本传输失败，使用备用方案:', error.message);
  }

  // 备用方案1：URL参数
  if (dataUrl.length <= 2000) {
    return await transferViaUrlParams(dataUrl, metadata);
  }

  // 备用方案2：localStorage
  return await transferViaLocalStorage(dataUrl, metadata);
}
```

#### 3. 用户友好的错误提示
```javascript
function showUserFriendlyError(error) {
  let message = '截图失败，请重试';

  if (error.message.includes('Could not establish connection')) {
    message = '无法连接到页面，请确保在支持的网站上使用扩展';
  } else if (error.message.includes('permission')) {
    message = '权限不足，请检查扩展权限设置';
  }

  showNotification('错误', message, 'error');
}
```

### 验证修复

运行以下命令验证修复是否有效：
```bash
# 1. 运行单元测试
node test-screenshot-fix.js

# 2. 检查代码更改
git diff src/background/simple-background.js

# 3. 重新加载扩展
# - 打开 chrome://extensions/
# - 找到Candlebot扩展
# - 点击刷新图标

# 4. 测试实际功能
# - 访问 aggr.trade
# - 点击扩展图标
# - 验证是否正常工作
```

### 仍然有问题？

如果问题仍然存在，请：

1. **收集调试信息**：
   ```javascript
   // 在页面控制台运行
   console.log('URL:', window.location.href);
   console.log('Chrome API:', typeof chrome);
   console.log('Candlebot扩展:', typeof window.candlebotExtension);
   ```

2. **检查控制台错误**：
   - 页面控制台
   - 后台脚本控制台
   - 弹窗控制台

3. **验证manifest配置**：
   - 确保所有权限正确
   - 检查内容脚本匹配模式
   - 验证文件路径正确

4. **测试简化版本**：
   创建一个最小化的测试扩展，只包含基本功能，逐步添加功能直到问题出现。