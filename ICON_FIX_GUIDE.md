# 扩展图标路径修复指南

## 问题描述
扩展报错：
```
extensions::setIcon:131 Uncaught (in promise) Error: Failed to set icon 'public/icons/icon16_off.png': Failed to fetch
minimal-test.js:1 Failed to load resource: net::ERR_FILE_NOT_FOUND
```

## 问题原因
1. **路径错误**：manifest.json 和背景脚本中引用 `public/icons/`，但扩展标准结构使用 `icons/`
2. **相对路径问题**：在扩展上下文中，路径解析方式不同
3. **图标状态切换**：背景脚本尝试根据网站支持状态切换图标，但 `_off` 版本图标路径有问题

## 解决方案

### 1. 修复图标文件位置
将图标文件从 `public/icons/` 复制到扩展根目录的 `icons/`：
```bash
mkdir -p extension/icons
cp extension/public/icons/*.png extension/icons/
```

### 2. 更新 manifest.json
修改图标路径从 `public/icons/` 到 `icons/`：
```json
"icons": {
  "16":  "icons/icon16.png",
  "48":  "icons/icon48.png",
  "128": "icons/icon128.png"
},
"action": {
  "default_popup": "src/popup/minimal-test.html",
  "default_icon": {
    "16":  "icons/icon16.png",
    "48":  "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

### 3. 简化背景脚本
暂时禁用图标状态切换，只更新标题：
```javascript
function updateIcon(tabId, url) {
  const supported = isSupported(url)

  // 只更新标题，不更新图标（避免图标路径问题）
  chrome.action.setTitle({
    tabId,
    title: supported
      ? 'Candlebot · 点击截图并分析'
      : 'Candlebot · 请在支持的图表网站使用'
  })
}
```

## 验证步骤

### 步骤1：检查文件结构
```
extension/
├── icons/                    # 图标目录（根目录）
│   ├── icon16.png
│   ├── icon16_off.png
│   ├── icon48.png
│   ├── icon48_off.png
│   ├── icon128.png
│   └── icon128_off.png
├── manifest.json            # 引用 icons/ 路径
├── src/
│   ├── background/
│   │   └── minimal.js       # 简化图标更新逻辑
│   └── popup/
│       └── minimal-test.html
```

### 步骤2：重新加载扩展
1. 打开 `chrome://extensions/`
2. 找到 Candlebot 扩展
3. 点击"刷新"按钮

### 步骤3：测试功能
1. 点击扩展图标，应该显示最小测试页面
2. 点击"测试截图功能"按钮
3. 不应该再看到图标路径错误

## 测试工具

已创建测试页面：`extension/test-icon-paths.html`
- 测试不同图标路径
- 检查 Chrome 扩展 API
- 验证图标文件可访问性

## 后续优化

### 恢复图标状态切换
如果需要根据网站支持状态切换图标，可以：

1. **使用绝对路径**：
```javascript
chrome.action.setIcon({
  tabId,
  path: {
    16: chrome.runtime.getURL(`icons/icon16${supported ? '' : '_off'}.png`),
    48: chrome.runtime.getURL(`icons/icon48${supported ? '' : '_off'}.png`),
    128: chrome.runtime.getURL(`icons/icon128${supported ? '' : '_off'}.png`),
  }
})
```

2. **预加载图标**：
```javascript
// 预加载所有图标
const icons = {
  on: {
    16: 'icons/icon16.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  },
  off: {
    16: 'icons/icon16_off.png',
    48: 'icons/icon48_off.png',
    128: 'icons/icon128_off.png'
  }
}
```

### 图标最佳实践
1. **使用扩展根目录**：将资源文件放在扩展根目录
2. **使用 `chrome.runtime.getURL()`**：获取资源的绝对URL
3. **预加载资源**：在扩展加载时预加载图标
4. **错误处理**：添加适当的错误处理和回退机制

## 故障排除

### 如果仍然看到图标错误：
1. **检查控制台**：查看完整错误信息
2. **验证文件存在**：确保 `extension/icons/` 目录包含所有PNG文件
3. **检查权限**：扩展可能需要 `web_accessible_resources` 权限

### 如果扩展图标不显示：
1. **检查manifest.json**：确保图标路径正确
2. **清除浏览器缓存**：有时需要清除扩展缓存
3. **重启浏览器**：完全重启浏览器加载扩展

## 参考
- [Chrome扩展图标文档](https://developer.chrome.com/docs/extensions/mv3/manifest/icons/)
- [Action图标设置](https://developer.chrome.com/docs/extensions/reference/action/#method-setIcon)
- [扩展资源访问](https://developer.chrome.com/docs/extensions/mv3/manifest/web_accessible_resources/)