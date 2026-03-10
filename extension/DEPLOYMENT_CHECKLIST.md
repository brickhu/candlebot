# Railway Auth 部署检查清单

## 部署前检查

### ✅ 前端配置
- [ ] `manifest.json` 已添加 `identity` 权限
- [ ] `AuthContext.jsx` 已更新支持OAuth登录
- [ ] `LoginPage.jsx` 已启用第三方登录按钮
- [ ] 环境变量配置正确（参考 `.env.example`）

### ✅ 后端配置
- [ ] Railway项目环境变量已配置：
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`
  - `GITHUB_CLIENT_SECRET`
  - `JWT_SECRET`（生产环境必须更改）
- [ ] 后端已添加OAuth路由处理（参考 `backend-oauth-example.py`）
- [ ] CORS配置允许前端域名

### ✅ OAuth应用配置
- [ ] Google OAuth 2.0客户端已创建
  - 授权JavaScript来源正确
  - 授权重定向URI正确
  - 已启用必要的API
- [ ] GitHub OAuth App已创建
  - 回调URL正确
  - 权限范围正确

## 部署步骤

### 步骤1：配置环境变量
1. 登录Railway仪表板
2. 进入项目设置 → Variables
3. 添加所有必需的环境变量
4. 点击"Save Changes"

### 步骤2：部署后端
```bash
# 如果使用Railway CLI
railway up

# 或者通过Git部署
git push railway main
```

### 步骤3：构建和测试前端
```bash
# 构建Chrome扩展
npm run build

# 测试OAuth配置
# 打开 test-oauth.html 文件进行测试
```

### 步骤4：加载Chrome扩展
1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `dist` 目录

## 测试流程

### 测试1：环境变量检查
1. 打开 `test-oauth.html`
2. 点击"检查环境变量"
3. 确认所有配置正确

### 测试2：Google登录测试
1. 打开Dashboard登录页面
2. 点击"使用 Google 登录"
3. 应该弹出Google登录窗口
4. 登录后应该自动跳回并显示用户信息

### 测试3：GitHub登录测试
1. 打开Dashboard登录页面
2. 点击"使用 GitHub 登录"
3. 应该弹出GitHub授权页面
4. 授权后应该自动跳回并显示用户信息

### 测试4：现有功能测试
1. 邮箱/密码登录仍然正常工作
2. 用户注册功能正常
3. 用户信息更新正常
4. 登出功能正常

## 故障排除

### 问题：点击登录按钮无反应
**可能原因**：
1. 环境变量未正确加载
2. Chrome扩展权限不足
3. JavaScript错误

**解决方案**：
1. 检查浏览器控制台错误
2. 验证 `manifest.json` 权限
3. 重新加载扩展

### 问题：OAuth重定向错误
**可能原因**：
1. 重定向URI不匹配
2. OAuth应用配置错误
3. CORS问题

**解决方案**：
1. 检查OAuth应用中的重定向URI配置
2. 验证前端和后端的URI是否一致
3. 检查后端CORS配置

### 问题：Token交换失败
**可能原因**：
1. Client Secret错误
2. 授权码已过期
3. 网络问题

**解决方案**：
1. 验证环境变量中的Client Secret
2. 重新发起OAuth流程
3. 检查后端日志

## 安全注意事项

### 必须完成
- [ ] 生产环境使用不同的JWT_SECRET
- [ ] 启用HTTPS（Railway自动处理）
- [ ] 限制CORS来源
- [ ] 记录OAuth登录事件

### 建议完成
- [ ] 实现rate limiting
- [ ] 添加登录审计日志
- [ ] 定期轮换OAuth密钥
- [ ] 监控异常登录行为

## 监控和维护

### 部署后监控
1. 检查Railway部署日志
2. 监控错误率
3. 检查用户登录成功率

### 定期维护
1. 每月检查OAuth密钥有效期
2. 每季度更新依赖包
3. 定期备份用户数据

## 支持联系

### 内部支持
- 后端开发团队
- 前端开发团队
- DevOps团队

### 外部资源
- [Railway文档](https://docs.railway.app/)
- [Google OAuth文档](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth文档](https://docs.github.com/en/apps/oauth-apps)

## 版本历史

### v1.0.0 - 初始部署
- 添加Google OAuth支持
- 添加GitHub OAuth支持
- 更新前端登录界面
- 添加测试工具

### 后续计划
- 添加更多OAuth提供商（微信、微博等）
- 实现单点登录（SSO）
- 添加多因素认证（MFA）
- 改进错误处理和用户反馈