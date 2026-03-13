# Google OAuth 401 invalid_client 错误修复指南

## 问题描述
Google OAuth登录时出现错误：`401: invalid_client`

## 错误原因分析
`invalid_client` 错误通常表示以下问题之一：

1. **客户端ID无效或已删除**
2. **重定向URI不匹配**（最常见）
3. **OAuth同意屏幕未配置**
4. **API未启用**
5. **客户端密钥无效**

## 快速诊断

### 1. 检查当前配置
```javascript
// 你的当前配置：
客户端ID: 825821602627-gbr3dpccu2r42rptp114feb6igjmrjan.apps.googleusercontent.com
重定向URI: chrome-extension://[你的扩展ID]/oauth2
```

### 2. 诊断步骤

#### 步骤1：验证客户端ID
访问：https://console.cloud.google.com/apis/credentials
- 检查客户端ID `825821602627-gbr3dpccu2r42rptp114feb6igjmrjan.apps.googleusercontent.com` 是否存在
- 检查客户端是否已启用

#### 步骤2：检查重定向URI
**这是最常见的问题！**

在Google Cloud Console中，重定向URI必须**精确匹配**Chrome扩展生成的重定向URI。

获取你的扩展重定向URI：
1. 打开Chrome扩展页面 (`chrome://extensions/`)
2. 找到你的扩展ID（类似 `abcdefghijklmnopqrstuvwxyz012345`）
3. 计算重定向URI：`chrome-extension://扩展ID/oauth2`

**示例：**
```
扩展ID: abcdefghijklmnopqrstuvwxyz012345
重定向URI: chrome-extension://abcdefghijklmnopqrstuvwxyz012345/oauth2
```

#### 步骤3：检查OAuth同意屏幕
1. 访问：https://console.cloud.google.com/apis/credentials/consent
2. 确保已配置：
   - 应用名称
   - 用户支持邮箱
   - 开发者联系信息
3. 发布状态：测试模式或正式发布

#### 步骤4：检查API启用状态
确保以下API已启用：
- Google+ API
- Google People API（如果使用profile scope）

## 修复步骤

### 方案A：更新现有OAuth客户端

1. **登录Google Cloud Console**
   - 访问：https://console.cloud.google.com/
   - 选择正确的项目

2. **导航到凭据页面**
   - 左侧菜单：APIs & Services → Credentials
   - 或直接访问：https://console.cloud.google.com/apis/credentials

3. **找到你的OAuth 2.0客户端ID**
   - 点击客户端ID名称进入编辑页面

4. **添加重定向URI**
   - 在"Authorized redirect URIs"部分
   - 添加：`chrome-extension://你的扩展ID/oauth2`
   - **注意**：替换`你的扩展ID`为实际ID

5. **保存更改**
   - 点击"Save"
   - 等待几分钟让更改生效

### 方案B：创建新的OAuth客户端（推荐）

如果现有客户端有问题，创建新的更简单：

1. **创建新的OAuth客户端ID**
   - 点击"Create Credentials" → "OAuth client ID"
   - 应用类型选择："Chrome App"
   - 名称：`Candlebot Chrome Extension`

2. **配置重定向URI**
   - 在"Authorized redirect URIs"中：
   - 添加：`chrome-extension://你的扩展ID/oauth2`
   - **重要**：先获取你的扩展ID！

3. **获取扩展ID的方法**
   ```bash
   # 方法1：查看已安装的扩展
   # 打开 chrome://extensions/ 查看扩展ID

   # 方法2：从manifest.json计算（开发时）
   # 扩展ID基于公钥计算，较复杂
   ```

4. **使用固定扩展ID（推荐）**
   在`manifest.json`中添加：
   ```json
   {
     "key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyour_public_key_here...",
     "oauth2": {
       "client_id": "825821602627-gbr3dpccu2r42rptp114feb6igjmrjan.apps.googleusercontent.com",
       "scopes": [
         "profile",
         "email"
       ]
     }
   }
   ```

### 方案C：使用测试扩展ID

对于开发阶段，可以使用临时扩展ID：

1. **加载未打包的扩展**
   - 扩展ID会每次变化
   - 不适合生产环境

2. **打包扩展获取固定ID**
   ```bash
   # 1. 打包扩展
   # 在Chrome扩展页面点击"打包扩展程序"

   # 2. 使用生成的.crx文件
   # 会有固定的扩展ID
   ```

## 验证修复

### 1. 更新环境变量
如果创建了新的客户端ID，更新`.env.local`：
```env
VITE_GOOGLE_CLIENT_ID=你的新客户端ID.apps.googleusercontent.com
```

### 2. 重新构建扩展
```bash
npm run build
```

### 3. 重新加载扩展
1. 打开 `chrome://extensions/`
2. 找到你的扩展
3. 点击刷新按钮 🔄

### 4. 测试OAuth
使用诊断工具测试：
1. 打开 `oauth-diagnostic.html`
2. 点击"测试Google OAuth"
3. 观察结果

## 常见问题排查

### Q1: 如何获取准确的扩展ID？
**方法1：查看已安装扩展**
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 找到你的扩展，ID显示在名称下方

**方法2：从代码获取**
```javascript
// 在扩展的background或popup脚本中
console.log('扩展ID:', chrome.runtime.id);
```

### Q2: 重定向URI格式错误？
**正确格式**：`chrome-extension://扩展ID/oauth2`
**错误格式**：
- `chrome-extension://扩展ID` （缺少/oauth2）
- `chrome-extension://扩展ID/` （斜杠位置错误）
- `https://扩展ID/oauth2` （协议错误）

### Q3: OAuth同意屏幕显示"未验证"？
对于测试环境：
1. 进入OAuth同意屏幕设置
2. 添加测试用户（你的Google账号）
3. 发布状态选择"Testing"

### Q4: 仍然收到invalid_client？
1. **清除浏览器缓存**：有时Google会缓存旧的配置
2. **等待几分钟**：Google配置更新需要时间
3. **检查控制台**：查看完整的错误信息
4. **使用Incognito模式**：排除缓存和插件干扰

## 备用方案：使用Web OAuth

如果Chrome扩展OAuth问题无法解决，可以考虑：

### 方案1：使用弹出窗口
```javascript
// 在新窗口中进行OAuth
window.open(
  `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin)}&response_type=code&scope=profile%20email`,
  'Google OAuth',
  'width=500,height=600'
);
```

### 方案2：使用后端代理
1. 扩展打开你的网站页面
2. 在网站上进行OAuth
3. 通过消息传递返回token

## 联系支持

如果所有方法都失败：

1. **Google Cloud支持**：https://cloud.google.com/support
2. **Chrome扩展论坛**：https://groups.google.com/a/chromium.org/g/chromium-extensions
3. **Stack Overflow**：使用标签 `[google-oauth]` `[chrome-extension]`

## 预防措施

1. **文档化配置**：记录所有OAuth配置
2. **使用环境变量**：不要硬编码客户端ID
3. **定期检查**：每月检查一次OAuth配置状态
4. **备份配置**：保存OAuth客户端配置截图
5. **测试脚本**：创建自动化测试脚本

## 成功标志

修复成功后，你应该看到：
1. Google OAuth授权页面正常显示
2. 用户能够授权应用
3. 成功获取授权码
4. 能够用授权码交换access token
5. 能够获取用户信息

如果仍有问题，请提供：
- 完整的错误信息
- 你的扩展ID
- Google Cloud Console截图
- 浏览器控制台输出