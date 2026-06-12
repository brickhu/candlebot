# Candlebot浏览器扩展

Candlebot K线分析助手的浏览器扩展，支持一键截图K线图表并发送到Candlebot Web应用进行分析。

## 功能特性

### 🎯 智能网站识别
- 自动识别支持的K线图表网站
- 智能区分首页和具体图表页面
- 根据页面类型动态调整扩展图标状态

### 📸 一键截图分析
- **自动截图**：在支持的图表页面上点击扩展图标自动截图并跳转
- **重新截图**：在popup中提供重新截图功能
- **智能传输**：优先使用内容脚本传递数据，避免URL长度限制
- **失败处理**：自动截图失败时显示popup让用户手动操作

### 🔍 图表信息提取
- 自动提取交易对、时间框架、交易所等信息
- 支持TradingView、Aggr.trade等主流平台
- 从DOM和URL中智能提取关键信息

### 🎨 用户友好界面
- **智能按钮**：根据状态动态显示"截图并分析"或"重新截图"按钮
- **实时预览**：截图预览和详细信息显示
- **状态反馈**：连接状态和页面检测结果
- **环境切换**：本地/生产环境一键切换

### 🔄 无缝集成
- 自动跳转到Candlebot Web应用的`/new`路由
- 多通道数据传递确保可靠性
- 支持本地开发和生产环境

## 支持的网站

| 网站 | 支持状态 | 图表页面识别 |
|------|----------|--------------|
| TradingView.com | ✅ 完全支持 | 智能识别图表页面 |
| aggr.trade | ✅ 完全支持 | 智能识别交易对页面 |
| DEXTools.io | ✅ 基本支持 | 识别交易对页面 |
| DEXScreener.com | ✅ 基本支持 | 识别交易对页面 |
| Birdeye.so | ✅ 基本支持 | 识别代币页面 |
| GeckoTerminal.com | ✅ 基本支持 | 识别资金池页面 |

## 安装说明

### 开发环境安装

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd candlebot/extension
   ```

2. **加载扩展**
   - 打开Chrome浏览器，进入 `chrome://extensions/`
   - 开启"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择 `candlebot/extension` 目录

3. **配置环境**
   - 默认使用本地开发环境 (`http://localhost:5173`)
   - 可在扩展弹窗中切换到生产环境

### 图标资源

扩展需要以下图标文件（放置在 `extension/icons/` 目录）：
- `icon16.png` (16×16)
- `icon48.png` (48×48)
- `icon128.png` (128×128)

可以使用以下命令创建占位图标：
```bash
# 创建简单的占位图标（需要ImageMagick）
convert -size 16x16 xc:#667eea icons/icon16.png
convert -size 48x48 xc:#667eea icons/icon48.png
convert -size 128x128 gradient:#667eea-#764ba2 icons/icon128.png
```

## 使用指南

### 基本使用流程

1. **访问支持的图表网站**
   - 打开TradingView、aggr.trade等支持的网站
   - 导航到具体的交易对图表页面

2. **使用扩展功能**
   - **推荐流程**：在图表页面直接点击扩展图标，自动完成截图并跳转到分析页面
   - **备用流程**：如果自动截图失败，会显示popup，可点击"重新截图"按钮
   - **手动模式**：在任何页面点击扩展图标打开弹窗，手动控制截图流程

3. **查看分析结果**
   - 扩展会自动跳转到Candlebot Web应用的`/new`页面
   - 截图数据会自动填充到分析表单
   - 提交后等待AI分析结果

### 弹窗功能

扩展弹窗提供以下功能：

- **截图预览**：查看截取的图表图片
- **图表信息**：显示提取的交易对、时间框架等信息
- **智能操作按钮**：
  - "截图并分析"：自动完成整个流程
  - "重新截图"：重新截图并跳转（当已有截图时显示）
- **常用链接**：快速访问支持的网站和Candlebot页面
- **环境设置**：切换本地开发和生产环境

## 技术架构

### 文件结构
```
extension/
├── manifest.json          # 扩展配置文件
├── icons/                 # 图标资源
├── src/
│   ├── background/        # 后台脚本
│   │   └── index.js      # 核心逻辑处理
│   ├── content/          # 内容脚本
│   │   ├── index.js      # 通用内容脚本
│   │   ├── tradingview.js # TradingView专用
│   │   └── aggr.js       # aggr.trade专用
│   ├── popup/            # 弹窗界面
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   └── utils/            # 工具函数
│       ├── url-matcher.js # URL匹配器
│       ├── screenshot.js  # 截图工具
│       └── data-transfer.js # 数据传输
└── README.md
```

### 核心模块

#### 1. URL匹配器 (`src/utils/url-matcher.js`)
- 智能识别支持的网站和页面类型
- 支持正则表达式和路径模式匹配
- 提取图表基本信息

#### 2. 截图工具 (`src/utils/screenshot.js`)
- 处理截图捕获和压缩
- 图片大小估算和优化
- 本地存储管理

#### 3. 数据传输 (`src/utils/data-transfer.js`)
- 多通道数据传递策略
- 智能选择传输方式
- 环境配置管理

#### 4. 后台脚本 (`src/background/index.js`)
- 扩展核心逻辑处理
- 标签页状态管理
- 消息路由和处理

#### 5. 内容脚本 (`src/content/`)
- 页面数据提取
- 与Web应用通信
- 平台特定功能增强

## 开发指南

### 添加新的支持网站

1. 在 `src/utils/url-matcher.js` 中添加网站配置：
   ```javascript
   'new-site.com': {
     name: 'New Site',
     homepagePatterns: [...],
     chartPatterns: [...],
     chartSelectors: [...]
   }
   ```

2. 如果需要特殊处理，创建专用的内容脚本：
   ```bash
   touch src/content/newsite.js
   ```

3. 更新 `manifest.json` 中的 `content_scripts` 和 `permissions`

### 调试扩展

#### Chrome开发者工具
1. 打开扩展管理页面 (`chrome://extensions/`)
2. 找到Candlebot扩展，点击"服务工作者"链接打开后台脚本控制台
3. 右键点击扩展图标，选择"检查弹窗"打开弹窗开发者工具

#### 日志查看
- 后台脚本日志：服务工作者控制台
- 内容脚本日志：对应页面的控制台
- 弹窗日志：弹窗开发者工具控制台

### 测试流程

1. **单元测试**
   ```bash
   # 测试URL匹配器
   node -e "const module = require('./src/utils/url-matcher.js'); console.log(module.checkChartPage('https://www.tradingview.com/chart/BTC/USD'));"
   ```

2. **集成测试**
   - 在支持的网站上测试截图功能
   - 验证数据传递到Web应用
   - 测试不同环境配置

3. **用户体验测试**
   - 测试自动和手动模式
   - 验证弹窗界面交互
   - 测试错误处理和恢复

## 故障排除

### 常见问题

#### 1. 扩展图标不显示
- 检查扩展是否已启用
- 重新加载扩展
- 检查控制台错误

#### 2. 截图失败
- 检查 `activeTab` 权限
- 确认当前页面支持截图
- 查看后台脚本错误日志

#### 3. 数据传递失败
- 检查Web应用是否运行
- 验证环境配置
- 查看网络请求和存储状态

#### 4. 弹窗不显示
- 检查popup文件路径
- 查看控制台错误
- 重新加载扩展

### 调试技巧

1. **启用详细日志**
   ```javascript
   // 在代码中添加详细日志
   console.log('详细状态:', { state });
   ```

2. **检查存储状态**
   ```javascript
   // 在控制台检查扩展存储
   chrome.storage.local.get(null, console.log);
   ```

3. **网络请求监控**
   - 使用Chrome开发者工具的Network面板
   - 检查与Web应用的通信

## 更新日志

### v1.0.0 (当前版本)
- ✅ 初始版本发布
- ✅ 支持主流K线图表网站
- ✅ 一键截图和分析功能
- ✅ 智能图表信息提取
- ✅ 用户友好弹窗界面
- ✅ 本地/生产环境支持

## 许可证

本项目采用MIT许可证。详见 [LICENSE](LICENSE) 文件。

## 支持与反馈

如有问题或建议，请通过以下方式联系：

- GitHub Issues: [项目Issues页面]
- 电子邮件: [联系邮箱]

---

**提示**: 确保Candlebot Web应用在相应环境中运行，扩展才能正常工作。