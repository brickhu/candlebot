# Candlebot Chrome 扩展

AI读懂K线图表，一键生成做多做空分析报告 | AI-powered chart analysis for aggr.trade & TradingView

## 功能特性

- 🔍 **AI智能图表分析**：自动识别K线图表模式
- 📊 **专业K线解读**：生成详细的做多/做空分析报告
- 💾 **历史记录保存**：保存所有分析记录，随时查看
- 💬 **交互式问答**：与AI对话，深入分析图表

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env.local`：
```bash
cp .env.example .env.local
```

### 3. 构建扩展
```bash
npm run build
```

### 4. 加载到Chrome
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择 `dist` 文件夹

## 登录问题解决方案

最近修复了登录页面的无限加载问题。我们创建了一个简化的登录系统：

### 测试登录功能

#### 使用模拟API（推荐用于测试）
1. 打开新标签页显示Candlebot Dashboard
2. 点击"使用模拟API"按钮
3. 使用测试账号：
   - 邮箱: `test@example.com`
   - 密码: `password123`
4. 或点击"测试登录"按钮自动登录

#### 使用真实API
1. 确保后端API可访问 (`https://api.candlebot.app`)
2. 点击"使用真实API"按钮
3. 使用您的真实账号登录

### 详细测试指南
查看 [TEST_LOGIN.md](./TEST_LOGIN.md) 获取完整的测试步骤和故障排除指南。

## 开发

### 开发模式
```bash
npm run dev
```

### 项目结构
```
extension/
├── src/
│   ├── dashboard/          # Dashboard应用
│   │   ├── contexts/       # React上下文
│   │   ├── pages/          # 页面组件
│   │   ├── components/     # 通用组件
│   │   └── utils/          # 工具函数
│   ├── popup/             # 弹出窗口
│   ├── content/           # 内容脚本
│   └── background/        # 后台脚本
├── public/                # 静态资源
├── manifest.json          # 扩展清单
└── package.json          # 项目配置
```

### 技术栈
- **框架**: SolidJS + Solid Router
- **构建工具**: Vite + @crxjs/vite-plugin
- **样式**: Tailwind CSS
- **API**: RESTful + OAuth 2.0

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE` | 后端API地址 | `https://api.candlebot.app` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth客户端ID | - |
| `VITE_GITHUB_CLIENT_ID` | GitHub OAuth客户端ID | - |

## 部署

### Railway 部署
扩展后端部署在Railway上：
1. 在Railway项目设置中配置环境变量
2. 重新部署应用
3. 更新扩展中的API地址

### Chrome Web Store
1. 打包扩展：`npm run build`
2. 创建ZIP文件：`zip -r candlebot-extension.zip dist/`
3. 提交到Chrome Web Store开发者控制台

## 故障排除

### 常见问题

1. **登录页面无限加载**
   - 检查Chrome控制台错误
   - 尝试使用模拟API模式
   - 刷新页面重试

2. **OAuth登录失败**
   - 检查环境变量配置
   - 确认OAuth回调URL正确
   - 检查manifest.json中的权限

3. **API连接失败**
   - 检查网络连接
   - 确认API服务正常运行
   - 检查CORS配置

### 获取帮助
1. 检查控制台错误信息
2. 查看 [TEST_LOGIN.md](./TEST_LOGIN.md)
3. 提交Issue到项目仓库

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request