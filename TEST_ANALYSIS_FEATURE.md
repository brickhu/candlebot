# 分析提交功能测试指南

## 功能概述
已实现完整的分析提交功能，包括：
1. ✅ Dashboard中的"新建分析"按钮和弹窗
2. ✅ 图片上传和预览功能
3. ✅ 浏览器插件安装提示
4. ✅ 提交图片到后端API
5. ✅ 跳转到分析结果页面
6. ✅ 支持从浏览器扩展跳转功能

## 测试步骤

### 1. 启动服务
```bash
# 前端（已启动在 http://localhost:5174/）
cd app && npm run dev

# 后端（如果未运行）
cd backend && uvicorn main:app --reload --port 8000
```

### 2. 测试流程

#### 步骤1：访问Dashboard
1. 打开浏览器访问 http://localhost:5174/
2. 点击"Get Started"或导航到登录页面
3. 使用现有账户登录或注册新账户
4. 登录后自动跳转到Dashboard

#### 步骤2：测试新建分析功能
1. 在Dashboard页面点击"New Analysis"按钮
2. 弹窗应显示，包含：
   - 浏览器扩展安装提示
   - 图片上传区域（拖放或点击选择）
   - 平台选择（TradingView/aggr.trade）
   - 语言选择（中文/英文）

#### 步骤3：上传图片测试
1. 点击"选择图片"按钮
2. 选择一张K线图表截图（PNG/JPG格式，<5MB）
3. 图片应显示预览
4. 可以点击"更换图片"或"移除图片"

#### 步骤4：提交分析
1. 选择平台（默认TradingView）
2. 选择语言（默认中文）
3. 点击"提交分析"按钮
4. 应显示加载状态"分析中..."
5. 成功后自动跳转到分析结果页面

#### 步骤5：查看分析结果
1. 分析结果页面应显示：
   - 评级信息（🟢🟢🟢等）
   - 基本信息（交易对、时间周期、价格等）
   - 完整的分析报告
   - 原始图表预览（如果保存了图片）

#### 步骤6：测试返回功能
1. 在分析结果页面点击"返回仪表板"
2. 应返回到Dashboard
3. 新的分析应出现在"Recent Analyses"列表中

## 浏览器扩展集成

### 扩展跳转支持
功能已完整支持从浏览器扩展跳转：
1. 扩展可以捕获图表截图
2. 将base64图片数据传递给Web应用
3. 支持多种数据传递方式：
   - URL查询参数（适合小数据）
   - localStorage（适合大数据）
   - sessionStorage（临时数据）
   - postMessage API（实时通信）

### 自动分析流程
当从扩展跳转时：
1. 自动检测扩展跳转标记
2. 预填充图片数据到分析弹窗
3. 自动打开分析弹窗
4. 用户只需点击"提交分析"即可

### 扩展安装提示
弹窗中显示浏览器扩展安装提示，包含：
- 推荐使用扩展的说明
- Chrome扩展商店链接（占位符）
- 手动上传的备选方案

### 扩展开发指南
扩展开发者可以使用以下方式集成：

#### 方法1：URL跳转（简单）
```javascript
// 扩展中跳转到Web应用
const imageBase64 = '...' // 截图base64数据
const redirectUrl = `https://app.candlebot.com/dashboard?from_extension=true&image_data=${encodeURIComponent(imageBase64)}`
window.open(redirectUrl, '_blank')
```

#### 方法2：localStorage（推荐）
```javascript
// 扩展中存储数据
localStorage.setItem('candlebot_extension_image', imageBase64)

// 跳转
window.open('https://app.candlebot.com/dashboard?from_extension=true', '_blank')
```

#### 方法3：postMessage（高级）
```javascript
// 扩展中打开新窗口
const webWindow = window.open('https://app.candlebot.com/dashboard', '_blank')

// 等待页面加载后发送数据
setTimeout(() => {
  webWindow.postMessage({
    type: 'candlebot_extension_image',
    imageData: imageBase64
  }, 'https://app.candlebot.com')
}, 1000)
```

## API端点

### 前端API方法
```javascript
// 分析图片
api.analyzeImage(imageBase64, platform, language)

// 获取分析结果
api.getAnalysis(recordId)

// 获取分析历史
api.getAnalyses(page, limit)
```

### 后端API端点
```
POST /analyze - 分析图片（需要认证）
GET /analysis/{id} - 获取分析详情（需要认证）
GET /analysis/history - 获取分析历史（需要认证）
```

## 错误处理

### 常见错误场景
1. **未登录访问**：自动重定向到登录页
2. **图片格式错误**：显示错误提示
3. **图片大小超限**：显示错误提示（5MB限制）
4. **API调用失败**：显示错误信息并提供重试
5. **配额用尽**：显示配额限制信息

### 错误提示位置
- 图片上传区域：格式/大小错误
- 弹窗底部：提交错误
- 分析结果页面：加载错误

## 样式和用户体验

### 响应式设计
- 移动端友好的弹窗布局
- 自适应图片预览
- 触摸友好的操作按钮

### 加载状态
- 提交时的旋转加载图标
- 页面加载时的骨架屏
- 禁用按钮防止重复提交

### 动画效果
- 弹窗淡入淡出
- 按钮悬停效果
- 图片预览过渡

## 后续优化建议

### 功能增强
1. **批量上传**：支持一次上传多张图片
2. **历史记录搜索**：按交易对、时间筛选
3. **报告导出**：PDF/图片格式导出
4. **分享功能**：生成可分享的链接

### 性能优化
1. **图片压缩**：前端自动压缩大图
2. **缓存策略**：分析结果缓存
3. **懒加载**：历史记录分页加载

### 用户体验
1. **快捷键支持**：ESC关闭弹窗，Enter提交
2. **拖拽排序**：历史记录手动排序
3. **夜间模式**：深色主题支持

## 扩展模拟器

已创建扩展模拟器用于测试扩展集成功能：

### 访问模拟器
打开文件：`EXTENSION_SIMULATOR.html`
或直接访问：`file:///Users/free/Projects/candlebot/EXTENSION_SIMULATOR.html`

### 模拟器功能
1. **选择测试方法**：
   - URL参数传递（简单）
   - localStorage传递（推荐）
   - postMessage API（高级）

2. **上传测试图片**：
   - 拖放或点击选择图片
   - 自动生成base64数据
   - 图片预览

3. **执行测试**：
   - 一键测试扩展跳转
   - 显示实现代码示例
   - 实时状态反馈

### 使用步骤
1. 打开扩展模拟器
2. 选择测试方法（推荐localStorage）
3. 上传测试图片
4. 点击"测试扩展跳转"
5. 检查Web应用是否自动填充图片

## 测试数据

### 测试图片
可以使用以下来源的截图进行测试：
1. TradingView图表（推荐BTC/USD, ETH/USD）
2. aggr.trade热力图
3. 任何K线图表截图

### 测试账户
- 邮箱：test@example.com
- 密码：test123

## 故障排除

### 常见问题
1. **图片上传失败**：检查文件格式和大小
2. **分析失败**：检查后端API是否正常运行
3. **页面空白**：检查控制台错误，可能是API调用失败
4. **样式错乱**：清除浏览器缓存

### 调试信息
所有API调用都有详细的console.log输出，包括：
- 请求URL和参数
- 响应状态和数据
- 错误详情