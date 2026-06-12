# Qwen3.6-Plus 配置指南

## 1. 获取API密钥

1. 访问 [阿里云百炼平台](https://bailian.console.aliyun.com/)
2. 注册并登录阿里云账号
3. 进入"模型服务" -> "模型广场"
4. 搜索"Qwen3.6-Plus"模型
5. 点击"开通服务"并创建API密钥

## 2. 配置环境变量

在 `.env.local` 文件中配置以下环境变量：

```bash
# 模型提供商选择：deepseek、minimax 或 qwen
MODEL_PROVIDER=qwen

# Qwen API配置
QWEN_API_KEY=your_qwen_api_key_here
```

## 3. API端点说明

- **API URL**: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- **模型名称**: `qwen-plus`
- **格式**: OpenAI兼容格式

## 4. 支持的视觉功能

Qwen3.6-Plus支持视觉理解，使用以下格式传递图片：

```json
{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {"url": "data:image/png;base64,{base64_string}"}
        },
        {
          "type": "text",
          "text": "请分析这张图表截图。"
        }
      ]
    }
  ]
}
```

## 5. 计费说明

- Qwen3.6-Plus按Token计费
- 支持视觉输入的模型通常价格较高
- 建议在阿里云控制台查看具体定价

## 6. 测试配置

启动应用后，访问以下端点验证配置：

1. `/health` - 查看当前使用的模型提供商
2. `/analyze` - 测试完整的分析流程

## 7. 故障排除

### 常见问题

1. **API密钥无效**
   - 检查API密钥是否正确
   - 确认服务已开通

2. **图片解析失败**
   - 确保图片格式为PNG或JPEG
   - 检查base64编码是否正确

3. **模型不支持视觉**
   - 确认使用的是`qwen-plus`模型
   - 检查API端点是否正确

### 调试信息

查看应用启动日志：
```
MODEL_PROVIDER: qwen
QWEN_API_KEY长度: [密钥长度]
```

## 8. 性能优化建议

1. **图片压缩**: 在上传前压缩图片，减少Token消耗
2. **缓存结果**: 对相同图片的分析结果进行缓存
3. **批量处理**: 如有批量分析需求，考虑异步处理

## 9. 备用方案

如果Qwen API出现问题，可以快速切换回其他模型：

1. 修改 `.env.local` 中的 `MODEL_PROVIDER`
2. 重启应用即可生效