# Candlebot扩展新流程指南

## 功能概述

新的扩展流程实现了以下功能：

1. **自动截图**：在支持的K线图表网站上，点击扩展图标自动截图
2. **弹窗预览**：截图后自动在弹窗中显示预览
3. **一键分析**：点击"立即分析"按钮跳转到web分析页面
4. **重新截图**：可以清除当前截图并重新截图

## 工作流程

### 1. 在支持的图表页面上
```
用户点击扩展图标
    ↓
扩展自动截图
    ↓
截图数据保存到storage
    ↓
显示弹窗（包含截图预览）
    ↓
用户点击"立即分析"
    ↓
跳转到分析页面（携带截图数据）
    ↓
弹窗关闭
```

### 2. 在不支持的页面上
```
用户点击扩展图标
    ↓
显示弹窗（不支持提示）
    ↓
显示支持网站列表
    ↓
提供常用链接导航
```

## 文件修改说明

### 1. `src/background/simple-background.js`
- 修改了`chrome.action.onClicked`处理逻辑
- 添加了截图数据保存到storage的功能
- 添加了`GET_LAST_SCREENSHOT`、`CLEAR_LAST_SCREENSHOT`、`SAVE_SCREENSHOT`消息处理

### 2. `src/popup/script.js`
- 修改了`getCurrentTabInfo()`函数，加载最后截图数据
- 重写了`handleCaptureClick()`函数，根据状态执行不同操作
- 添加了`handleAnalyzeClick()`函数处理分析跳转
- 修改了`handleRetryCaptureClick()`函数，只清除数据不自动跳转
- 更新了`updateActionButtons()`函数，显示"立即分析"按钮

### 3. `src/popup/style.css`
- 添加了`.btn-analyze`样式，绿色背景和脉动发光效果

### 4. `src/content/index.js`
- 保持不变，继续处理数据传递

## 测试步骤

### 准备测试环境
1. 确保web app运行在`http://localhost:5173`
2. 在Chrome中加载扩展（开发者模式）
3. 打开`test-new-flow.html`查看测试指南

### 功能测试
1. 访问TradingView图表页面（如`https://www.tradingview.com/chart/`）
2. 点击扩展图标，观察自动截图和弹窗显示
3. 在弹窗中查看截图预览和图表信息
4. 点击"立即分析"按钮，验证跳转到分析页面
5. 测试"重新截图"功能
6. 测试不支持页面的处理

### 验证点
- [ ] 自动截图功能正常工作
- [ ] 弹窗正确显示截图预览
- [ ] "立即分析"按钮正确跳转
- [ ] 图表信息正确提取和显示
- [ ] 重新截图功能正常工作
- [ ] 不支持页面显示正确提示

## 故障排除

### 常见问题

1. **截图失败**
   - 检查扩展权限（需要`activeTab`权限）
   - 检查控制台错误信息
   - 确保在支持的图表页面上

2. **弹窗不显示截图**
   - 检查storage中是否有截图数据
   - 检查`GET_LAST_SCREENSHOT`消息响应
   - 检查图片数据URL是否有效

3. **跳转失败**
   - 检查web app是否运行
   - 检查`transferResult.url`是否正确生成
   - 检查网络连接

4. **内容脚本未加载**
   - 确保在支持的网站上
   - 检查manifest.json中的`content_scripts`配置
   - 检查控制台是否有内容脚本加载日志

### 调试方法

1. 打开Chrome扩展管理页面（`chrome://extensions/`）
2. 启用开发者模式
3. 点击"刷新"按钮重新加载扩展
4. 打开开发者工具（F12）查看控制台日志
5. 检查Network标签页的网络请求
6. 检查Application标签页的Storage内容

## 扩展配置

### manifest.json配置要点
```json
{
  "permissions": [
    "activeTab",      // 截图权限
    "tabs",           // 标签页管理
    "storage",        // 数据存储
    "scripting"       // 脚本注入
  ],
  "host_permissions": [
    "http://localhost:5173/*",      // 本地开发环境
    "https://chat.candlebot.app/*"  // 生产环境
  ]
}
```

### 环境配置
- 开发环境：`http://localhost:5173`
- 生产环境：`https://chat.candlebot.app`
- 可在弹窗设置中切换环境

## 后续优化建议

1. **截图质量优化**
   - 添加截图区域选择
   - 优化图片压缩算法
   - 支持不同图片格式

2. **用户体验优化**
   - 添加截图成功动画
   - 优化弹窗加载速度
   - 添加快捷键支持

3. **功能扩展**
   - 支持更多图表网站
   - 添加历史记录功能
   - 支持批量截图分析

4. **错误处理**
   - 更详细的错误提示
   - 自动重试机制
   - 离线模式支持