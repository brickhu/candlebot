#!/bin/bash

echo "=== Google OAuth修复脚本 ==="
echo "错误：401 invalid_client"
echo ""

# 获取当前目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "1. 检查当前配置..."
echo ""

# 检查环境变量
if [ -f ".env.local" ]; then
    echo "找到 .env.local 文件"
    GOOGLE_CLIENT_ID=$(grep "VITE_GOOGLE_CLIENT_ID" .env.local | cut -d'=' -f2)
    echo "当前Google Client ID: $GOOGLE_CLIENT_ID"
else
    echo "❌ 未找到 .env.local 文件"
    exit 1
fi

echo ""
echo "2. 检查扩展配置..."
echo ""

# 检查manifest.json
if [ -f "manifest.json" ]; then
    echo "找到 manifest.json"

    # 检查权限
    if grep -q '"identity"' manifest.json; then
        echo "✅ manifest.json包含'identity'权限"
    else
        echo "❌ manifest.json缺少'identity'权限"
        echo "请添加: \"permissions\": [\"identity\", ...]"
    fi

    # 检查key字段（用于固定扩展ID）
    if grep -q '"key"' manifest.json; then
        echo "✅ manifest.json包含key字段（固定扩展ID）"
    else
        echo "⚠️  manifest.json缺少key字段（扩展ID可能变化）"
    fi
else
    echo "❌ 未找到 manifest.json"
fi

echo ""
echo "3. 诊断问题..."
echo ""

# 常见问题检查
if [[ -z "$GOOGLE_CLIENT_ID" ]]; then
    echo "❌ 问题：Google Client ID为空"
    echo "   修复：在.env.local中设置VITE_GOOGLE_CLIENT_ID"
elif [[ ! "$GOOGLE_CLIENT_ID" =~ \.apps\.googleusercontent\.com$ ]]; then
    echo "❌ 问题：Google Client ID格式不正确"
    echo "   正确格式：*.apps.googleusercontent.com"
else
    echo "✅ Google Client ID格式正确"
fi

echo ""
echo "4. 获取扩展重定向URI..."
echo ""

# 尝试从构建输出获取扩展信息
if [ -d "dist" ]; then
    echo "找到dist目录（构建输出）"

    # 检查manifest.json中的扩展ID提示
    if [ -f "dist/manifest.json" ]; then
        echo "构建的manifest.json:"
        cat dist/manifest.json | python3 -m json.tool 2>/dev/null || cat dist/manifest.json
    fi
else
    echo "⚠️  未找到dist目录，请先构建扩展：npm run build"
fi

echo ""
echo "5. 修复步骤："
echo ""
echo "A. 获取准确的扩展ID："
echo "   1. 打开 chrome://extensions/"
echo "   2. 开启'开发者模式'"
echo "   3. 找到'Candlebot · K线专家'扩展"
echo "   4. 复制扩展ID（类似：abcdefghijklmnopqrstuvwxyz012345）"
echo ""
echo "B. 计算重定向URI："
echo "   格式：chrome-extension://扩展ID/oauth2"
echo "   示例：chrome-extension://abcdefghijklmnopqrstuvwxyz012345/oauth2"
echo ""
echo "C. 更新Google Cloud Console："
echo "   1. 访问 https://console.cloud.google.com/apis/credentials"
echo "   2. 找到客户端ID：$GOOGLE_CLIENT_ID"
echo "   3. 点击编辑"
echo "   4. 在'Authorized redirect URIs'中添加上述重定向URI"
echo "   5. 点击保存"
echo ""
echo "D. 测试配置："
echo "   1. 重新构建扩展：npm run build"
echo "   2. 重新加载扩展（在chrome://extensions/中点击刷新）"
echo "   3. 测试Google OAuth登录"
echo ""
echo "6. 备用方案：创建新的OAuth客户端"
echo ""
echo "如果现有客户端无法修复："
echo "   1. 在Google Cloud Console创建新的OAuth客户端"
echo "   2. 应用类型选择：Chrome App"
echo "   3. 名称：Candlebot Chrome Extension"
echo "   4. 添加重定向URI（同上）"
echo "   5. 获取新的Client ID"
echo "   6. 更新.env.local中的VITE_GOOGLE_CLIENT_ID"
echo "   7. 重新构建和测试"
echo ""
echo "7. 使用诊断工具："
echo ""
echo "打开 oauth-diagnostic.html 文件进行详细诊断："
echo "   - 检查环境变量"
echo "   - 检查Chrome API"
echo "   - 测试Google OAuth"
echo "   - 查看配置指南"
echo ""
echo "=== 详细指南 ==="
echo ""
echo "查看完整修复指南："
echo "   cat FIX_GOOGLE_OAUTH.md"
echo "或打开文件查看"
echo ""
echo "=== 脚本完成 ==="
echo ""
echo "下一步：按照上述步骤操作，然后重新测试Google OAuth"