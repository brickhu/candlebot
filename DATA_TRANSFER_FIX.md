# Candlebot扩展数据传递问题修复

## 问题描述

扩展截图后，图片数据没有正确传递到web app的分析页面。

## 根本原因分析

1. **数据格式不匹配**：扩展存储的是完整的`data:image/png;base64,...`格式，但web app期望纯base64数据
2. **存储方式问题**：扩展使用`sessionStorage`存储数据，但新标签页无法访问原标签页的`sessionStorage`
3. **跳转时机问题**：数据在截图时传递，但用户可能在稍后才点击"立即分析"

## 解决方案

### 1. 修改web app数据接收逻辑 (`app/src/lib/extension.js`)

添加`extractPureBase64()`函数，从data URL中提取纯base64数据：

```javascript
function extractPureBase64(dataUrl) {
  if (!dataUrl) return null
  if (!dataUrl.startsWith('data:')) return dataUrl

  const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/)
  return base64Match ? base64Match[1] : dataUrl
}
```

修改`checkExtensionRedirect()`函数，对所有数据源使用`extractPureBase64()`处理。

### 2. 修改扩展数据传递逻辑 (`extension/src/background/simple-background.js`)

#### 新增函数：
- `createAnalysisUrlWithImage()`: 创建包含图片数据的URL（使用纯base64）

#### 修改函数：
- `transferScreenshotData()`: 优先使用URL参数传递数据（如果数据不大）
- 删除旧的`createDataUrlWithParams()`函数

### 3. 增强调试日志 (`app/src/components/NewAnalysisModal.jsx`)

在`onMount()`中添加详细日志，帮助诊断数据传递问题。

## 数据传递流程

### 新流程（小数据 ≤ 2000字符）：
```
1. 用户点击扩展图标 → 自动截图
2. 扩展生成包含图片数据的URL
   URL格式: /new?from_extension=true&image_data=<纯base64>&...
3. 用户点击"立即分析" → 打开新标签页
4. web app从URL参数提取图片数据
5. 自动加载到分析弹窗
```

### 备用流程（大数据 > 2000字符）：
```
1. 用户点击扩展图标 → 自动截图
2. 扩展尝试通过内容脚本传递数据到当前页面
3. 数据存储在当前页面的sessionStorage
4. 用户点击"立即分析" → 打开新标签页（只带标记）
5. web app无法获取数据（sessionStorage不共享）
6. 用户需要手动上传图片
```

## 测试方法

### 1. 使用测试页面
打开 `extension/test-data-transfer.html` 进行模拟测试：
- 测试URL参数传递
- 测试sessionStorage传递
- 检查数据接收状态

### 2. 完整功能测试
1. 加载扩展到Chrome
2. 访问支持的图表网站（如TradingView）
3. 点击扩展图标进行自动截图
4. 在弹窗中验证截图预览
5. 点击"立即分析"按钮
6. 验证新标签页是否正确加载截图

### 3. 调试检查
打开浏览器开发者工具（F12），检查：
- Console标签页的扩展和web app日志
- Network标签页的跳转请求
- Application标签页的Storage内容

## 验证点

- [ ] 扩展自动截图功能正常
- [ ] 弹窗正确显示截图预览
- [ ] "立即分析"按钮生成正确的URL
- [ ] 新标签页URL包含`from_extension=true`参数
- [ ] 新标签页URL包含`image_data`参数（小数据时）
- [ ] web app正确提取和显示扩展图片
- [ ] 分析弹窗自动加载扩展来源的图片

## 故障排除

### 常见问题及解决方案

1. **图片数据太大，URL参数传递失败**
   - 现象：URL非常长，可能被浏览器截断
   - 解决方案：优化截图质量，减少数据大小

2. **web app无法解析图片数据**
   - 现象：控制台显示base64解码错误
   - 检查：数据格式是否正确（纯base64）
   - 检查：`extractPureBase64()`函数是否正常工作

3. **扩展弹窗不显示截图预览**
   - 检查：`popupState.screenshotData`是否正确设置
   - 检查：`updateScreenshotPreview()`函数
   - 检查：图片数据URL是否有效

4. **"立即分析"按钮不跳转**
   - 检查：`popupState.screenshotData.transferResult.url`是否存在
   - 检查：`handleAnalyzeClick()`函数
   - 检查：`OPEN_WEB_APP`消息处理

### 调试命令

在web app控制台运行：
```javascript
// 检查扩展数据
checkExtensionRedirect()

// 清理扩展数据
cleanupExtensionData()

// 手动设置测试数据
sessionStorage.setItem('candlebot_extension_image', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...')
```

在扩展背景页控制台检查：
- 截图数据大小
- 生成的URL格式
- 数据传输方法

## 性能优化建议

1. **图片压缩**：优化截图质量，减少数据大小
2. **数据分片**：对于大数据，考虑分片传输
3. **本地存储**：使用IndexedDB存储历史截图
4. **缓存机制**：缓存已分析的图片，避免重复上传

## 后续改进

1. **支持更大图片**：实现分片传输或使用Blob URL
2. **错误恢复**：添加自动重试和备用方案
3. **进度显示**：显示数据传输进度
4. **离线支持**：支持离线截图，稍后上传分析