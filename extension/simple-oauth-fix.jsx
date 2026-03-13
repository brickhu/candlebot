// 最简单的Google OAuth修复方案
// 替换原来的复杂OAuth逻辑

import { createSignal } from 'solid-js';

// 使用简单的弹出窗口进行OAuth
export function useSimpleOAuth() {
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal('');

  // 获取扩展重定向URI
  const getRedirectUri = () => {
    if (chrome.identity && chrome.identity.getRedirectURL) {
      return chrome.identity.getRedirectURL('oauth2');
    }
    // 备用方案：使用固定格式
    const extensionId = chrome.runtime.id;
    return `chrome-extension://${extensionId}/oauth2`;
  };

  // 简单的Google登录
  const loginWithGoogle = () => {
    setLoading(true);
    setError('');

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '825821602627-gbr3dpccu2r42rptp114feb6igjmrjan.apps.googleusercontent.com';
    const redirectUri = getRedirectUri();

    console.log('Google OAuth配置:');
    console.log('- 客户端ID:', clientId);
    console.log('- 重定向URI:', redirectUri);
    console.log('- 扩展ID:', chrome.runtime.id);

    // 构建OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'token'); // 使用token而不是code
    authUrl.searchParams.append('scope', 'profile email');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');

    console.log('OAuth URL:', authUrl.toString());

    // 方法1：使用chrome.identity（首选）
    if (chrome.identity && chrome.identity.launchWebAuthFlow) {
      chrome.identity.launchWebAuthFlow({
        url: authUrl.toString(),
        interactive: true
      }, (responseUrl) => {
        setLoading(false);

        if (chrome.runtime.lastError) {
          const err = chrome.runtime.lastError.message;
          setError(`Google登录失败: ${err}`);

          // 分析错误
          if (err.includes('invalid_client')) {
            setError(`invalid_client错误 - 请检查：
1. 客户端ID: ${clientId}
2. 重定向URI: ${redirectUri}
3. 确保在Google Cloud Console中正确配置`);
          }
        } else if (responseUrl) {
          console.log('OAuth成功，响应:', responseUrl);
          // 解析响应
          try {
            const url = new URL(responseUrl);
            const hash = url.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');

            if (accessToken) {
              console.log('获取到access token:', accessToken.substring(0, 20) + '...');
              // 这里可以调用后端验证token
              handleOAuthSuccess('google', accessToken);
            }
          } catch (e) {
            setError('解析OAuth响应失败');
          }
        } else {
          setError('用户取消了登录');
        }
      });
    }
    // 方法2：使用弹出窗口（备用）
    else {
      console.warn('chrome.identity不可用，使用弹出窗口');

      const width = 500;
      const height = 600;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;

      const popup = window.open(
        authUrl.toString(),
        'Google登录',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      if (!popup) {
        setError('无法打开登录窗口，请检查弹出窗口阻止设置');
        setLoading(false);
        return;
      }

      // 监听弹出窗口关闭
      const checkPopup = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkPopup);
          setLoading(false);
          setError('登录窗口已关闭');
        }
      }, 500);
    }
  };

  // 处理OAuth成功
  const handleOAuthSuccess = async (provider, accessToken) => {
    try {
      // 调用后端验证token
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'https://api.candlebot.app'}/auth/oauth/${provider}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_token: accessToken })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('OAuth登录成功:', data);

        // 保存token和用户信息
        if (chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({
            auth_token: data.access_token,
            user_info: data.user
          });
        }

        // 刷新页面或跳转
        window.location.reload();
      } else {
        setError('后端验证失败');
      }
    } catch (err) {
      setError('网络错误: ' + err.message);
    }
  };

  // 测试OAuth配置
  const testOAuthConfig = () => {
    console.log('=== OAuth配置测试 ===');

    const config = {
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      redirectUri: getRedirectUri(),
      extensionId: chrome.runtime.id,
      chromeIdentity: !!chrome.identity,
      chromeIdentityLaunch: !!chrome.identity?.launchWebAuthFlow
    };

    console.table(config);

    // 检查问题
    const issues = [];
    if (!config.clientId) issues.push('客户端ID未设置');
    if (!config.extensionId) issues.push('无法获取扩展ID');
    if (!config.chromeIdentityLaunch) issues.push('chrome.identity.launchWebAuthFlow不可用');

    if (issues.length > 0) {
      console.error('发现问题:', issues);
      return { success: false, issues };
    }

    return { success: true, config };
  };

  return {
    loginWithGoogle,
    loading,
    error,
    testOAuthConfig
  };
}

// 简单的Google登录按钮组件
export function GoogleLoginButton() {
  const { loginWithGoogle, loading, error, testOAuthConfig } = useSimpleOAuth();

  const handleTestConfig = () => {
    const result = testOAuthConfig();
    alert(JSON.stringify(result, null, 2));
  };

  return (
    <div style={styles.container}>
      <button
        onClick={loginWithGoogle}
        disabled={loading()}
        style={loading() ? { ...styles.button, ...styles.buttonLoading } : styles.button}
      >
        {loading() ? 'Google登录中...' : '使用Google登录'}
      </button>

      {error() && (
        <div style={styles.error}>
          {error()}
        </div>
      )}

      <button
        onClick={handleTestConfig}
        style={styles.testButton}
      >
        测试OAuth配置
      </button>

      <div style={styles.help}>
        <p><strong>如果遇到invalid_client错误：</strong></p>
        <ol style={styles.helpList}>
          <li>复制重定向URI（查看控制台）</li>
          <li>访问 <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console</a></li>
          <li>找到客户端ID并编辑</li>
          <li>在"Authorized redirect URIs"中添加重定向URI</li>
          <li>保存并重新测试</li>
        </ol>
      </div>
    </div>
  );
}

const styles = {
  container: {
    margin: '20px 0'
  },
  button: {
    width: '100%',
    padding: '12px',
    background: '#4285F4',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  buttonLoading: {
    opacity: '0.7',
    cursor: 'not-allowed'
  },
  error: {
    marginTop: '10px',
    padding: '10px',
    background: '#FFEBEE',
    border: '1px solid #FFCDD2',
    borderRadius: '4px',
    color: '#C62828',
    fontSize: '12px',
    whiteSpace: 'pre-line'
  },
  testButton: {
    marginTop: '10px',
    width: '100%',
    padding: '8px',
    background: '#757575',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  help: {
    marginTop: '15px',
    padding: '15px',
    background: '#F5F5F5',
    borderRadius: '4px',
    fontSize: '12px'
  },
  helpList: {
    margin: '10px 0 0 20px',
    padding: '0'
  }
};

export default GoogleLoginButton;