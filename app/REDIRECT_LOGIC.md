# 登录/注册重定向逻辑优化

## 概述

本次优化解决了登录和注册页面作为中间页面的重定向问题，确保用户从哪里来就跳转回哪里，并且不会丢失URL中的查询参数。

## 核心功能

1. **完整URL保存**：保存来源页面的完整URL（包括路径、查询参数、哈希）
2. **智能重定向**：登录/注册成功后自动跳转回来源页面
3. **参数保留**：保留所有查询参数（如`?auto=true&from=extension`）
4. **多场景支持**：支持普通登录、OAuth登录、注册等多种场景
5. **向后兼容**：保持与现有代码的兼容性

## 文件结构

```
src/lib/redirect.js          # 重定向工具函数
src/lib/auth.jsx            # 更新了AuthProvider的重定向逻辑
src/pages/Login.jsx         # 更新了登录页面的重定向逻辑
src/pages/Register.jsx      # 更新了注册页面的重定向逻辑
src/pages/OAuthCallback.jsx # 更新了OAuth回调的重定向逻辑
src/lib/oauth.js            # 更新了OAuth的URL保存逻辑
src/pages/TestRedirect.jsx  # 测试页面
```

## 主要工具函数

### `getCurrentFullUrl()`
获取当前页面的完整URL。

### `parseFullUrl(fullUrl)`
解析完整URL，返回包含`path`、`search`、`hash`、`fullPath`的对象。

### `getRedirectTarget(defaultPath = '/dashboard')`
获取重定向目标URL，优先级：
1. URL参数中的`from`参数
2. OAuth保存的`oauth_redirect_url`
3. 默认路径

### `getLoginRedirectUrl()`
生成重定向到登录页的URL，保存当前完整URL作为`from`参数。

### `getRegisterRedirectUrl()`
生成重定向到注册页的URL，保存当前完整URL作为`from`参数。

### `performRedirect(navigate, target)`
执行重定向，正确处理URL解析。

### `redirectAfterAuth(navigate)`
在登录/注册成功后执行重定向。

### `checkAndHandleRedirect(navigate)`
检查并处理重定向逻辑，用于页面加载时。

## 使用示例

### 1. 在受保护页面重定向到登录页
```javascript
// 在AuthProvider中
import { getLoginRedirectUrl } from './lib/redirect'

// 当访问受保护页面但未认证时
const redirectUrl = getLoginRedirectUrl()
window.location.href = redirectUrl
```

### 2. 登录成功后重定向
```javascript
// 在Login.jsx中
import { redirectAfterAuth } from '../lib/redirect'

const handleSubmit = async (e) => {
  // ... 登录逻辑
  if (success) {
    redirectAfterAuth(navigate)
  }
}
```

### 3. 注册成功后重定向
```javascript
// 在Register.jsx中
import { redirectAfterAuth } from '../lib/redirect'

const handleSubmit = async (e) => {
  // ... 注册逻辑
  if (success) {
    redirectAfterAuth(navigate)
  }
}
```

### 4. OAuth登录重定向
```javascript
// 在OAuthCallback.jsx中
import { redirectAfterAuth } from '../lib/redirect'

// OAuth登录成功后
setTimeout(() => {
  redirectAfterAuth(navigate)
}, 2000)
```

## 测试方法

### 测试页面
访问 `/test-redirect` 查看重定向逻辑测试页面。

### 测试用例

#### 用例1: 普通页面重定向
1. 访问 `/new?test=123`
2. 由于未登录，会被重定向到 `/login?from=/new?test=123`
3. 登录成功后，跳转回 `/new?test=123`

#### 用例2: 带复杂参数页面重定向
1. 访问 `/dashboard?filter=recent&sort=date&page=2`
2. 重定向到 `/login?from=/dashboard?filter=recent&sort=date&page=2`
3. 登录成功后，跳转回原页面并保留所有参数

#### 用例3: OAuth登录重定向
1. 从浏览器扩展跳转到 `/new?from=extension&auto=true`
2. 点击Google登录，保存当前URL到`oauth_redirect_url`
3. OAuth登录成功后，从localStorage读取并跳转回 `/new?from=extension&auto=true`

#### 用例4: 注册后重定向
1. 访问受保护页面 `/analysis/123`
2. 重定向到 `/register?from=/analysis/123`
3. 注册成功后，跳转回 `/analysis/123`

## 浏览器扩展集成

### 扩展跳转流程
1. 扩展发送消息到网页：`{ action: 'redirect_to_login', url: '/new?from=extension&auto=true' }`
2. 网页保存URL到`oauth_redirect_url`
3. 用户进行OAuth登录
4. 登录成功后，从`oauth_redirect_url`读取并跳转

### 扩展代码示例
```javascript
// 在扩展中
chrome.runtime.sendMessage({
  action: 'redirect_to_login',
  url: '/new?from=extension&auto=true&screenshot=...'
})

// 在网页中
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'redirect_to_login') {
    localStorage.setItem('oauth_redirect_url', message.url)
    window.location.href = '/login'
  }
})
```

## 注意事项

1. **安全性**：`from`参数经过URL编码，防止注入攻击
2. **循环重定向**：避免登录/注册页面保存自身URL作为`from`参数
3. **localStorage清理**：OAuth重定向URL使用后自动清除
4. **错误处理**：重定向失败时回退到默认路径`/dashboard`
5. **日志输出**：所有重定向操作都有详细的console.log输出

## 向后兼容

- 现有的`from`参数逻辑保持不变
- 新增的完整URL保存是附加功能
- 默认重定向路径仍然是`/dashboard`

## 调试技巧

1. 打开浏览器开发者工具查看console日志
2. 检查localStorage中的`oauth_redirect_url`
3. 使用测试页面 `/test-redirect` 验证各种场景
4. 监控网络请求中的重定向URL

## 常见问题

### Q: 重定向后查询参数丢失？
A: 确保使用`getCurrentFullUrl()`获取完整URL，而不是`window.location.pathname`

### Q: OAuth登录后没有跳转回原页面？
A: 检查localStorage中是否有`oauth_redirect_url`，以及OAuth回调页面是否正确调用`redirectAfterAuth()`

### Q: 登录/注册页面循环重定向？
A: 检查`getLoginRedirectUrl()`和`getRegisterRedirectUrl()`中的逻辑，避免保存登录/注册页面自身的URL

### Q: 重定向到不存在的页面？
A: `performRedirect()`函数有错误处理，重定向失败时会跳转到`/dashboard`