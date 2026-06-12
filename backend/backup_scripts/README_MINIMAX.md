# Minimax API 配置说明

## 环境变量设置

将原来的 `DEEPSEEK_API_KEY` 替换为 `MINIMAX_API_KEY`：

```bash
# Railway 环境变量设置
MINIMAX_API_KEY=your_minimax_api_key_here
```

## 获取Minimax API密钥

1. 访问 [Minimax 平台](https://platform.minimax.io)
2. 注册账号并登录
3. 在API密钥管理页面创建新的API密钥
4. 复制API密钥并设置为环境变量

## API端点信息

- **API URL**: `https://api.minimax.chat/v1/chat/completions`
- **模型名称**: `abab6-chat` (当前使用的模型)
- **认证方式**: Bearer Token

## 图片处理说明

Minimax API支持图片分析，代码中已配置：
- 图片格式：base64编码的PNG
- 图片细节级别：`high` (可调整为 `low` 或 `auto` 以节省token)

## 注意事项

1. **API调用限制**: 注意Minimax的API调用频率和配额限制
2. **图片大小**: 大图片可能会消耗更多token，建议前端压缩图片
3. **错误处理**: 代码已包含Minimax API错误处理，会返回相应的错误信息

## 测试API

可以使用以下curl命令测试Minimax API：

```bash
curl https://api.minimax.chat/v1/chat/completions \
  -H "Authorization: Bearer $MINIMAX_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "abab6-chat",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```