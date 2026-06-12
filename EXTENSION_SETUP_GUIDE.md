# 浏览器扩展设置指南

## 问题描述
无法将浏览器扩展中的截图传递到 `http://localhost:5173/new` 的截图显示区域。

## 解决方案

### 1. 已修复的问题

#### 问题1：内容脚本未在本地开发服务器运行
**原因**：manifest.json 中的 `content_scripts` 只匹配交易网站，不匹配 `http://localhost:5173/*`。
**修复**：已添加对本地开发服务器的匹配：
```json
{
  "matches": [
    "http://localhost:5173/*",
    "http://127.0.0.1:5173/*"
  ],
  "js": ["src/content/minimal.js"],
  "run_at": "document_idle"
}
```

#### 问题2：数据传递时机问题
**原因**：扩展在页面加载完成后立即发送数据，但页面可能还未完全初始化。
**修复**：添加了1秒延迟，确保页面完全加载后再发送数据。

#### 问题3：内容脚本上下文问题
**原因**：之前的内容脚本尝试通过注入script标签来访问页面上下文，但方法复杂且容易出错。
**修复**：简化了内容脚本，直接使用 `sessionStorage`（内容脚本和页面共享同一个sessionStorage）。

### 2. 使用步骤

#### 步骤1：重新加载浏览器扩展
1. 打开 Chrome/Edge 浏览器
2. 进入扩展管理页面：`chrome://extensions/` 或 `edge://extensions/`
3. 找到 Candlebot 扩展
4. 点击"刷新"按钮或关闭/重新打开开发者模式

#### 步骤2：测试扩展功能
1. 打开一个支持的交易网站（如 tradingview.com）
2. 点击浏览器工具栏中的 Candlebot 扩展图标
3. 点击"截图并分析"按钮
4. 扩展将：
   - 截图当前页面
   - 打开 `http://localhost:5173/new` 页面
   - 等待页面加载完成后注入截图数据
   - 页面自动显示截图预览

#### 步骤3：验证数据传递
1. 打开 `http://localhost:5173/new` 页面
2. 打开浏览器开发者工具（F12）
3. 查看 Console 标签页，应该看到类似以下日志：
   ```
   Candlebot内容脚本已加载，当前URL: http://localhost:5173/new
   ✅ 截图数据已存储到sessionStorage，键: candlebot_extension_image
   ✅ URL已更新: http://localhost:5173/new?from_extension=true
   📸 从扩展获取预填充图片数据，来源: session_storage
   ✅ 已设置扩展图片预览
   ```

### 3. 故障排除

#### 如果截图数据未显示：
1. **检查扩展是否已重新加载**
   - 确保在扩展管理页面点击了"刷新"

2. **检查控制台日志**
   - 打开 `http://localhost:5173/new` 页面
   - 按 F12 打开开发者工具
   - 查看 Console 标签页是否有错误信息

3. **检查 sessionStorage**
   - 在开发者工具的 Application 标签页
   - 选择 Session Storage > http://localhost:5173
   - 检查是否有 `candlebot_extension_image` 键

4. **检查 URL 参数**
   - 确保 URL 包含 `?from_extension=true`
   - 如果没有，手动添加：`http://localhost:5173/new?from_extension=true`

#### 如果页面被重定向到 /login：
1. **检查认证状态**
   - 确保已登录应用
   - 检查 localStorage 中是否有 `auth_token`

2. **检查认证中间件**
   - 查看 `app/src/lib/auth.jsx` 中的认证逻辑
   - 确保 `/new` 路径在受保护路径列表中

### 4. 技术细节

#### 数据流：
1. 扩展弹出页面截图 → 压缩图片 → 获取 base64 数据
2. 打开 `/new` 页面 → 等待页面加载完成
3. 通过 `chrome.tabs.sendMessage` 发送数据到内容脚本
4. 内容脚本接收数据 → 存储到 `sessionStorage`
5. 更新 URL 添加 `?from_extension=true` 参数
6. Web 应用检测到 URL 参数 → 从 `sessionStorage` 读取数据
7. 显示截图预览

#### 关键文件：
- `extension/manifest.json` - 扩展配置
- `extension/src/content/minimal.js` - 内容脚本（数据传递）
- `extension/src/popup/final-solution.html` - 扩展弹出页面
- `app/src/lib/extension.js` - Web 应用扩展工具
- `app/src/components/NewAnalysisModal.jsx` - 分析弹窗组件

### 5. 测试工具

已创建测试页面：`test-extension-data.html`
- 打开 `http://localhost:5173/test-extension-data.html`
- 可以模拟扩展数据注入
- 可以检查数据接收状态
- 可以测试跳转到 `/new` 页面

### 6. 下一步

如果问题仍然存在：
1. 检查浏览器扩展的 Console 日志（扩展背景页）
2. 检查内容脚本是否正确加载
3. 验证 base64 数据格式是否正确
4. 检查跨域权限设置