# Content Security Policy (CSP) 修复指南

## 问题描述
扩展弹出页面报错：
```
final-solution.html:183 Executing inline script violates the following Content Security Policy directive 'script-src 'self''.
```

## 问题原因
Chrome扩展的弹出页面有严格的CSP策略，默认不允许执行内联JavaScript（`<script>`标签中的代码）。

## 解决方案

### 已实施的修复

#### 1. 创建外部JavaScript文件
将内联脚本移到外部文件：
- `extension/src/popup/final-solution.js` - 主逻辑
- `extension/src/popup/minimal-test.js` - 最小测试版本

#### 2. 更新HTML文件引用外部脚本
修改HTML文件，使用`<script src="..."></script>`：
```html
<!-- 之前（错误） -->
<script>
  // 内联代码...
</script>

<!-- 之后（正确） -->
<script src="final-solution.js"></script>
```

#### 3. 创建最小测试版本
创建了纯JavaScript的最小测试页面，避免任何框架依赖：
- `minimal-test.html` - 最小HTML结构
- `minimal-test.js` - 纯JavaScript逻辑

#### 4. 更新manifest.json
将默认弹出页面改为最小测试版本：
```json
"default_popup": "src/popup/minimal-test.html"
```

## 使用步骤

### 步骤1：重新加载扩展
1. 打开 `chrome://extensions/`
2. 找到 Candlebot 扩展
3. 点击"刷新"按钮

### 步骤2：测试最小版本
1. 点击浏览器工具栏中的 Candlebot 图标
2. 应该看到"最小测试"页面
3. 点击"测试截图功能"按钮
4. 观察日志输出

### 步骤3：验证功能
测试应该：
1. 检查 Chrome API 是否可用
2. 尝试截图（需要打开支持的网站）
3. 打开 `http://localhost:5173/new` 页面
4. 发送测试数据到页面

## 故障排除

### 如果仍然看到CSP错误：
1. **检查HTML文件**：确保没有内联`<script>`标签
2. **检查manifest.json**：确保引用的文件路径正确
3. **检查控制台**：查看完整错误信息

### 如果扩展不工作：
1. **检查扩展管理页面**：确保扩展已启用
2. **检查控制台日志**：打开扩展背景页的控制台
   - 右键点击扩展图标 → "检查弹出内容"
   - 或打开 `chrome://extensions/` → 点击扩展的"服务工作者"链接

### 如果截图失败：
1. **确保在支持的网站**：如 tradingview.com
2. **检查权限**：扩展需要"activeTab"权限
3. **检查背景脚本**：`src/background/minimal.js` 应该处理CAPTURE消息

## 技术细节

### Chrome扩展CSP规则
扩展弹出页面的默认CSP：
```
script-src 'self'; object-src 'self';
```
这意味着：
- 只能加载同源的脚本文件（`'self'`）
- 不能执行内联脚本
- 不能使用`eval()`等不安全函数

### 正确的文件结构
```
extension/
├── manifest.json
├── src/
│   ├── popup/
│   │   ├── minimal-test.html    # HTML结构
│   │   ├── minimal-test.js      # 外部脚本
│   │   ├── final-solution.html  # 完整版本HTML
│   │   └── final-solution.js    # 完整版本脚本
│   ├── content/
│   │   └── minimal.js           # 内容脚本
│   └── background/
│       └── minimal.js           # 背景脚本
```

### 消息传递流程
1. 弹出页面 → 背景脚本：`{type: 'CAPTURE'}`
2. 背景脚本 → 弹出页面：截图数据URL
3. 弹出页面 → 内容脚本：`{type: 'SET_SCREENSHOT_DATA', data: base64}`
4. 内容脚本 → 页面：存储到sessionStorage

## 恢复完整版本

测试成功后，可以恢复完整版本：

1. 修改 `manifest.json`：
```json
"default_popup": "src/popup/final-solution.html"
```

2. 重新加载扩展

## 测试工具

已创建的测试文件：
1. `extension/test-csp.html` - CSP测试页面
2. `extension/test-external.js` - 外部脚本测试
3. `extension/src/popup/minimal-test.html` - 最小测试页面

## 注意事项

1. **不要使用内联事件处理器**：如 `onclick="function()"`
2. **不要使用`javascript:`协议**：如 `<a href="javascript:void(0)">`
3. **使用外部样式表**：避免内联样式
4. **测试所有浏览器**：Chrome、Edge等可能有不同的CSP实现

## 参考链接

- [Chrome扩展CSP文档](https://developer.chrome.com/docs/extensions/mv3/contentSecurityPolicy/)
- [Manifest V3 CSP变更](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy)
- [CSP错误排查指南](https://developer.chrome.com/docs/extensions/mv3/troubleshooting/#content-security-policy)