# 扩展数据传输修复 - 快速测试指南

## 修复的问题
1. **数据存储目标错误**：之前数据被存储到图表网站的localStorage，现在正确存储到web app页面
2. **数据传输方法优化**：优先使用postMessage方案，无数据大小限制
3. **多重备份**：数据同时存储到sessionStorage，确保可靠性

## 测试步骤

### 1. 重新加载扩展
1. 打开Chrome扩展管理页面 (`chrome://extensions/`)
2. 找到Candlebot扩展
3. 点击"刷新"按钮或关闭/重新打开开发者模式
4. 确保扩展已启用

### 2. 测试数据传输
#### 方法A：使用测试页面
1. 打开 `extension/test-fix.html`
2. 点击"模拟扩展发送数据"按钮
3. 观察日志，确认数据正确接收
4. 点击"检查数据接收"验证数据

#### 方法B：实际测试
1. 打开一个支持的图表网站（如TradingView）
2. 点击Candlebot扩展图标
3. 扩展应该：
   - 识别图表页面
   - 截图
   - 打开新标签页到 `http://localhost:5173/new`
   - 传输数据到新页面

### 3. 验证数据接收
在web app页面 (`http://localhost:5173/new`) 检查：
1. **控制台日志**：应该有"收到扩展消息"的日志
2. **sessionStorage**：应该有 `candlebot_extension_image` 数据
3. **URL参数**：应该有 `from_extension=true`

## 故障排除

### 问题1：扩展没有反应
- 检查扩展是否已加载（查看控制台日志）
- 检查当前网站是否在支持列表中
- 重新加载扩展

### 问题2：数据没有传输
- 检查web app是否运行在 `http://localhost:5173`
- 检查控制台错误信息
- 确保扩展有正确的host权限（`http://localhost:5173/*`）

### 问题3：数据接收但无法显示
- 检查base64数据格式
- 检查图片解码逻辑
- 查看 `NewAnalysisModal.jsx` 中的错误处理

## 技术细节

### 数据传输流程
1. **扩展截图** → 生成base64图片数据
2. **打开新标签页** → `chrome.tabs.create({url: 'http://localhost:5173/new'})`
3. **等待加载** → 监听 `chrome.tabs.onUpdated`
4. **注入脚本** → `chrome.scripting.executeScript()`
5. **发送数据** → `window.postMessage()` 到目标页面
6. **存储备份** → 同时存储到 `sessionStorage`
7. **更新URL** → 添加 `from_extension=true` 参数

### 使用的API
- `chrome.tabs.create()` - 创建新标签页
- `chrome.tabs.onUpdated` - 监听页面加载
- `chrome.scripting.executeScript()` - 注入脚本
- `window.postMessage()` - 跨文档消息传递
- `sessionStorage` - 临时数据存储

## 预期结果

### 成功标志
1. ✅ 扩展图标点击后打开新标签页
2. ✅ 新标签页URL包含 `from_extension=true`
3. ✅ Web app自动显示截图预览
4. ✅ 可以提交分析请求

### 失败标志
1. ❌ 扩展没有反应
2. ❌ 打开空白页面或错误页面
3. ❌ Web app显示"没有收到图片数据"
4. ❌ 控制台有错误信息

## 下一步
如果测试成功：
1. 提交代码更改
2. 更新扩展版本
3. 发布到Chrome Web Store

如果测试失败：
1. 检查控制台错误
2. 根据错误信息调整代码
3. 重新测试