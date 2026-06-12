# Candlebot扩展快速修复指南

## 问题诊断

根据错误日志，主要问题包括：

1. **`CHECK_SITE_SUPPORT`消息未处理** - 已修复
2. **ES模块导入问题** - background脚本使用ES模块导入导致问题
3. **内容脚本注入问题** - "Could not establish connection. Receiving end does not exist."

## 已实施的修复

### 1. 修复`CHECK_SITE_SUPPORT`消息处理
- 在`src/background/simple-background.js`中添加了`CHECK_SITE_SUPPORT`消息处理
- popup脚本现在可以正确检查网站支持状态

### 2. 解决ES模块导入问题
- 创建了简化版本的background脚本`src/background/simple-background.js`
- 移除了ES模块导入，将所有依赖函数内联
- 更新manifest.json使用简化版本

### 3. 内容脚本问题
- 内容脚本配置正确，但可能需要重新加载扩展
- 创建了测试页面`test-extension.html`用于诊断

## 测试步骤

### 步骤1：重新加载扩展
1. 打开Chrome扩展管理页面 (`chrome://extensions/`)
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择`/Users/free/Projects/candlebot/extension`目录
5. 如果已加载，点击刷新按钮

### 步骤2：测试扩展基本功能
1. 打开测试页面：`file:///Users/free/Projects/candlebot/extension/test-extension.html`
2. 检查扩展基本信息是否正常显示
3. 测试内容脚本注入
4. 测试消息传递功能
5. 测试URL支持检查

### 步骤3：测试实际网站
1. 访问支持的网站，如：https://aggr.trade/SOL/USDT
2. 点击扩展图标，查看popup是否正常显示
3. 测试截图功能

## 文件结构说明

```
extension/
├── manifest.json                    # 扩展配置文件（已更新）
├── src/
│   ├── background/
│   │   ├── index.js                 # 原始background脚本（有ES模块问题）
│   │   └── simple-background.js     # 简化版本（推荐使用）
│   ├── content/
│   │   ├── index.js                 # 通用内容脚本
│   │   ├── tradingview.js           # TradingView专用脚本
│   │   └── aggr.js                  # Aggr.trade专用脚本
│   └── popup/
│       ├── index.html               # popup界面
│       ├── style.css                # popup样式
│       └── script.js                # popup脚本
├── icons/                           # 扩展图标
├── test-extension.html              # 扩展测试页面
└── QUICK_FIX_GUIDE.md               # 本指南
```

## 常见问题解决

### 问题1：扩展图标不显示
- 检查icons目录是否存在且包含正确文件
- 检查manifest.json中的图标路径配置

### 问题2：popup不显示
- 检查popup文件路径是否正确
- 检查CSS和JS文件是否正常加载
- 查看控制台错误信息

### 问题3：截图功能失败
- 检查权限配置（manifest.json中的permissions）
- 检查background脚本中的截图函数
- 查看background脚本的控制台日志

### 问题4：内容脚本不注入
- 检查manifest.json中的content_scripts配置
- 检查matches模式是否正确
- 尝试重新加载扩展和页面

## 调试技巧

1. **查看background脚本日志**：
   - 打开扩展管理页面
   - 点击"service worker"链接查看background脚本控制台

2. **查看内容脚本日志**：
   - 在支持的网站打开开发者工具
   - 查看控制台输出

3. **查看popup日志**：
   - 右键点击扩展图标，选择"检查popup"
   - 在打开的开发者工具中查看控制台

4. **测试消息传递**：
   - 使用测试页面`test-extension.html`
   - 测试各种消息类型

## 下一步优化建议

1. **完善错误处理**：添加更详细的错误信息和用户提示
2. **优化截图流程**：改进数据传输机制
3. **增强网站支持**：添加更多图表网站的支持
4. **改进UI/UX**：优化popup界面和用户体验
5. **添加配置选项**：允许用户自定义设置

## 联系支持

如果问题仍然存在，请提供：
1. 完整的控制台错误日志
2. 浏览器版本信息
3. 操作系统信息
4. 重现步骤