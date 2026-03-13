// Google OAuth快速修复脚本
// 直接在Chrome扩展控制台运行此脚本

(function() {
    console.log('=== Google OAuth快速修复 ===');
    console.log('错误：401 invalid_client');
    console.log('');

    // 获取扩展信息
    const extensionId = chrome.runtime.id;
    const redirectUri = chrome.identity ? chrome.identity.getRedirectURL('oauth2') : null;
    const clientId = '825821602627-gbr3dpccu2r42rptp114feb6igjmrjan.apps.googleusercontent.com';

    console.log('📋 当前配置：');
    console.log('扩展ID:', extensionId);
    console.log('重定向URI:', redirectUri);
    console.log('客户端ID:', clientId);
    console.log('');

    if (!extensionId) {
        console.error('❌ 无法获取扩展ID，请确保在扩展上下文中运行此脚本');
        return;
    }

    if (!redirectUri) {
        console.error('❌ 无法获取重定向URI，chrome.identity API可能不可用');
        console.log('检查manifest.json是否包含"identity"权限');
        return;
    }

    console.log('🔍 问题分析：');
    console.log('"invalid_client"错误通常表示：');
    console.log('1. 客户端ID无效或已删除');
    console.log('2. 重定向URI不匹配（最常见）');
    console.log('3. OAuth同意屏幕未配置');
    console.log('4. API未启用');
    console.log('');

    console.log('🎯 最可能的问题：重定向URI不匹配');
    console.log('你的重定向URI必须是：', redirectUri);
    console.log('在Google Cloud Console中必须精确匹配此URI');
    console.log('');

    console.log('🚀 修复步骤：');
    console.log('');
    console.log('步骤1：复制以下重定向URI：');
    console.log('----------------------------------------');
    console.log(redirectUri);
    console.log('----------------------------------------');
    console.log('');
    console.log('步骤2：访问Google Cloud Console：');
    console.log('https://console.cloud.google.com/apis/credentials');
    console.log('');
    console.log('步骤3：找到客户端ID：');
    console.log(clientId);
    console.log('');
    console.log('步骤4：点击编辑，在"Authorized redirect URIs"中添加：');
    console.log(redirectUri);
    console.log('');
    console.log('步骤5：点击保存');
    console.log('');
    console.log('步骤6：等待几分钟让配置生效');
    console.log('');
    console.log('步骤7：重新测试Google OAuth');
    console.log('');

    // 提供测试函数
    window.testGoogleOAuth = function() {
        console.log('🧪 测试Google OAuth...');

        if (!chrome.identity || !chrome.identity.launchWebAuthFlow) {
            console.error('❌ chrome.identity.launchWebAuthFlow不可用');
            return;
        }

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.append('client_id', clientId);
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', 'profile email');
        authUrl.searchParams.append('access_type', 'offline');
        authUrl.searchParams.append('prompt', 'consent');

        console.log('测试URL:', authUrl.toString());

        chrome.identity.launchWebAuthFlow({
            url: authUrl.toString(),
            interactive: true
        }, (responseUrl) => {
            if (chrome.runtime.lastError) {
                console.error('❌ OAuth错误:', chrome.runtime.lastError.message);

                // 分析错误
                const error = chrome.runtime.lastError.message;
                if (error.includes('invalid_client')) {
                    console.log('');
                    console.log('🔍 详细分析：');
                    console.log('1. 确认客户端ID正确：', clientId);
                    console.log('2. 确认重定向URI已添加：', redirectUri);
                    console.log('3. 检查Google Cloud Console中的配置');
                    console.log('4. 确保OAuth同意屏幕已配置');
                    console.log('5. 尝试清除浏览器缓存后重试');
                }
            } else if (responseUrl) {
                console.log('✅ OAuth流程成功！');
                console.log('响应URL:', responseUrl);

                try {
                    const url = new URL(responseUrl);
                    const code = url.searchParams.get('code');
                    if (code) {
                        console.log('✅ 收到授权码:', code.substring(0, 20) + '...');
                    }
                } catch (e) {
                    console.log('响应:', responseUrl);
                }
            } else {
                console.log('ℹ️ 用户取消了OAuth流程');
            }
        });
    };

    // 提供检查函数
    window.checkOAuthConfig = function() {
        console.log('🔧 检查OAuth配置...');

        // 检查环境变量
        const env = {
            googleClientId: clientId,
            hasClientId: clientId && clientId.includes('.apps.googleusercontent.com'),
            hasRedirectUri: !!redirectUri,
            redirectUriFormat: redirectUri ? redirectUri.startsWith('chrome-extension://') : false
        };

        console.log('配置检查结果：');
        console.log('- 客户端ID格式正确:', env.hasClientId ? '✅' : '❌');
        console.log('- 重定向URI可用:', env.hasRedirectUri ? '✅' : '❌');
        console.log('- 重定向URI格式:', env.redirectUriFormat ? '✅ Chrome扩展格式' : '❌ 格式错误');

        if (!env.hasClientId) {
            console.log('❌ 问题：客户端ID格式不正确');
            console.log('   应该以 .apps.googleusercontent.com 结尾');
        }

        if (!env.redirectUriFormat) {
            console.log('❌ 问题：重定向URI不是Chrome扩展格式');
            console.log('   应该是：chrome-extension://扩展ID/oauth2');
        }

        return env;
    };

    console.log('🛠️ 可用命令：');
    console.log('- testGoogleOAuth() - 测试Google OAuth');
    console.log('- checkOAuthConfig() - 检查OAuth配置');
    console.log('');
    console.log('📚 更多帮助：');
    console.log('查看文件：FIX_GOOGLE_OAUTH.md');
    console.log('运行脚本：./fix-google-oauth.sh');
    console.log('');
    console.log('=== 修复完成 ===');
    console.log('请按照上述步骤操作，然后运行 testGoogleOAuth() 测试');

})();