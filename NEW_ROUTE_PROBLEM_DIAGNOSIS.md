# /new 路由跳转到 /login 问题诊断报告

## 问题描述
即使已登录，访问 `http://localhost:5173/new` 也会被重定向到 `/login`。

## 根本原因分析

### 1. 认证状态检查时机问题
**文件**: `app/src/pages/NewAnalysis.jsx` (第20-24行)
```javascript
// 检查认证
if (!auth?.user?.()) {
  console.log('❌ 用户未认证，重定向到登录页')
  navigate('/login', { state: { from: '/new' } })
  return
}
```

**问题**:
- `NewAnalysis` 组件的 `onMount` 立即检查 `auth?.user?.()`
- 但 `AuthProvider` 也在 `onMount` 中异步加载用户数据
- 存在竞争条件：用户数据可能还在加载中就被判定为"未认证"

### 2. 扩展数据键名不匹配
**扩展发送**: `candlebot_screenshot` (在 `extension/src/content/minimal.js` 中)
**Web应用检查**: `candlebot_extension_image` (在 `app/src/lib/extension.js` 中)

### 3. 认证状态加载逻辑
**文件**: `app/src/lib/auth.jsx`
- `AuthProvider` 在 `onMount` 中调用 `loadUser()`
- `loadUser()` 是异步的，需要时间完成
- 在此期间 `user()` 信号返回 `null`

## 已实施的修复

### 1. 修复扩展数据键名 ✅
- 更新 `extension/src/content/minimal.js`
- 统一使用 `candlebot_extension_image` 作为键名

### 2. 改进NewAnalysis认证检查 ✅
- 添加等待逻辑，直到 `isLoading()` 为 `false`
- 添加详细的调试日志
- 避免在用户数据加载期间重定向

### 3. 创建测试页面 ✅
- `app/src/pages/TestUpload.jsx`
- 不需要认证，用于验证扩展功能
- 显示接收到的截图数据

### 4. 更新路由配置 ✅
- 添加 `/test-upload` 路由
- 扩展暂时跳转到测试页面

### 5. 增强扩展调试信息 ✅
- 添加URL检查逻辑
- 如果页面已被重定向到 `/login`，不发送截图数据

## 测试步骤

### 步骤1: 验证扩展基本功能
1. 重新加载浏览器扩展
2. 访问支持的网站 (如 TradingView)
3. 点击扩展图标
4. 点击"截图并分析"按钮
5. 应该跳转到 `http://localhost:5173/test-upload`
6. 检查是否显示截图

### 步骤2: 诊断认证问题
1. 在测试页面点击"测试 /new 页面访问"
2. 观察是否被重定向到 `/login`
3. 检查控制台日志：
   - `auth?.user?.()` 的值
   - `auth?.isLoading?.()` 的值
   - `localStorage.getItem('auth_token')` 的值

### 步骤3: 检查认证流程
1. 确保已登录 (访问 `/dashboard` 确认)
2. 检查 `localStorage` 中是否有 `auth_token`
3. 检查API响应：`/auth/me` 端点是否返回用户数据

## 可能的问题场景

### 场景1: Token存在但用户加载失败
- `localStorage` 中有 `auth_token`
- 但 `/auth/me` API 调用失败
- 导致 `user()` 始终为 `null`

### 场景2: 异步加载竞争条件
- `NewAnalysis` 在 `AuthProvider` 完成加载前检查
- 即使token有效，`user()` 暂时为 `null`
- 触发重定向到 `/login`

### 场景3: Token过期或无效
- `auth_token` 存在但已过期
- API 返回 401 错误
- `api.clearToken()` 被调用

## 下一步调试建议

### 1. 检查控制台日志
```javascript
// 在浏览器控制台执行
console.log('auth_token:', localStorage.getItem('auth_token'))
console.log('当前URL:', window.location.href)
```

### 2. 测试API端点
```bash
# 使用curl测试
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/auth/me
```

### 3. 修改认证检查逻辑
如果问题持续，考虑：
- 在 `NewAnalysis` 中添加更长的等待时间
- 或者先显示加载状态，不立即重定向
- 添加重试机制

### 4. 验证扩展数据传递
- 确保扩展发送的数据键名正确
- 确保Web应用能正确读取数据
- 检查 `sessionStorage` 内容

## 紧急解决方案

### 方案A: 临时移除认证检查
```javascript
// 在NewAnalysis.jsx中注释掉重定向逻辑
// if (!auth?.user?.()) {
//   navigate('/login', { state: { from: '/new' } })
//   return
// }
```

### 方案B: 使用测试页面作为临时方案
- 扩展跳转到 `/test-upload`
- 验证所有功能正常工作
- 修复认证问题后再切回 `/new`

### 方案C: 添加认证状态监控
```javascript
// 监听认证状态变化
createEffect(() => {
  console.log('认证状态变化:', {
    isLoading: auth?.isLoading?.(),
    user: auth?.user?.(),
    hasToken: !!localStorage.getItem('auth_token')
  })
})
```

## 当前配置状态

### 扩展配置
- **Popup**: `final-solution.html` → 跳转到 `/test-upload`
- **Content脚本**: 发送数据到 `candlebot_extension_image`
- **Background脚本**: 仅截图功能

### Web应用配置
- **NewAnalysis**: 改进的认证检查逻辑
- **TestUpload**: 新增的测试页面
- **AuthProvider**: 原有的用户加载逻辑

### 路由配置
- `/new` → `NewAnalysis` (需要认证)
- `/test-upload` → `TestUpload` (不需要认证)
- 其他路由保持不变

## 预期结果
1. 扩展应该能成功截图并跳转到测试页面
2. 测试页面应该显示接收到的截图
3. 点击"测试 /new 页面访问"应该：
   - 如果认证正常：显示NewAnalysis页面
   - 如果认证有问题：重定向到 `/login`

根据测试结果，我们可以进一步定位和修复问题。