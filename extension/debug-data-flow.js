/**
 * Candlebot扩展数据流调试脚本
 * 在扩展背景页控制台运行此脚本进行调试
 */

console.log('=== Candlebot扩展数据流调试开始 ===');

// 1. 检查当前状态
async function checkCurrentState() {
    console.log('1. 检查当前状态...');

    const tabs = await new Promise(resolve => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve);
    });

    if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        console.log('当前标签页:', {
            id: tab.id,
            url: tab.url,
            title: tab.title
        });

        // 检查网站支持
        const checkResult = await new Promise(resolve => {
            chrome.runtime.sendMessage({ type: 'CHECK_SITE_SUPPORT', url: tab.url }, resolve);
        });

        console.log('网站支持检查:', checkResult);

        return { tab, checkResult };
    }

    console.error('无法获取当前标签页');
    return null;
}

// 2. 模拟截图流程
async function simulateScreenshot() {
    console.log('\n2. 模拟截图流程...');

    try {
        // 发送截图请求
        const result = await new Promise(resolve => {
            chrome.runtime.sendMessage({ type: 'CAPTURE_SCREENSHOT' }, resolve);
        });

        console.log('截图结果:', {
            success: result.success,
            error: result.error,
            transferResult: result.transferResult ? {
                method: result.transferResult.method,
                url: result.transferResult.url,
                note: result.transferResult.note
            } : null,
            dataSize: result.screenshotInfo?.dataSize
        });

        if (result.success && result.transferResult?.url) {
            console.log('生成的URL:', result.transferResult.url);

            // 分析URL参数
            try {
                const url = new URL(result.transferResult.url);
                console.log('URL分析:', {
                    pathname: url.pathname,
                    searchParams: Object.fromEntries(url.searchParams.entries())
                });

                // 检查image_data参数
                const imageData = url.searchParams.get('image_data');
                if (imageData) {
                    console.log('image_data参数:', {
                        length: imageData.length,
                        isDataUrl: imageData.startsWith('data:'),
                        first50: imageData.substring(0, 50) + '...'
                    });
                } else {
                    console.warn('URL中没有image_data参数');
                }
            } catch (urlError) {
                console.error('URL分析失败:', urlError);
            }
        }

        return result;
    } catch (error) {
        console.error('模拟截图失败:', error);
        return null;
    }
}

// 3. 检查存储的数据
async function checkStorageData() {
    console.log('\n3. 检查存储数据...');

    // 检查扩展存储
    const storageData = await new Promise(resolve => {
        chrome.storage.local.get(['candlebot_last_screenshot'], resolve);
    });

    if (storageData.candlebot_last_screenshot) {
        const screenshot = storageData.candlebot_last_screenshot;
        console.log('最后截图数据:', {
            timestamp: screenshot.timestamp,
            hasDataUrl: !!screenshot.dataUrl,
            dataUrlLength: screenshot.dataUrl?.length || 0,
            transferResult: screenshot.transferResult ? {
                method: screenshot.transferResult.method,
                url: screenshot.transferResult.url
            } : null
        });

        if (screenshot.dataUrl) {
            console.log('dataUrl前100字符:', screenshot.dataUrl.substring(0, 100) + '...');
            console.log('是否为data URL:', screenshot.dataUrl.startsWith('data:image/'));
        }
    } else {
        console.log('没有找到存储的截图数据');
    }

    return storageData;
}

// 4. 测试内容脚本通信
async function testContentScript() {
    console.log('\n4. 测试内容脚本通信...');

    const tabs = await new Promise(resolve => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve);
    });

    if (tabs && tabs.length > 0) {
        const tab = tabs[0];

        try {
            // 发送ping测试
            const pingResult = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tab.id, { type: 'PING' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            console.log('内容脚本ping响应:', pingResult);

            // 测试数据传递
            const testData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

            const dataResult = await new Promise((resolve, reject) => {
                chrome.tabs.sendMessage(tab.id, {
                    type: 'SET_SCREENSHOT_DATA',
                    data: testData,
                    metadata: { test: true }
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(response);
                    }
                });
            });

            console.log('数据传递测试:', dataResult);

        } catch (error) {
            console.error('内容脚本通信失败:', error.message);

            // 检查是否在支持的网站上
            const checkResult = await new Promise(resolve => {
                chrome.runtime.sendMessage({ type: 'CHECK_SITE_SUPPORT', url: tab.url }, resolve);
            });

            console.log('当前网站支持状态:', checkResult);

            if (checkResult.supported) {
                console.log('在支持的网站上，但内容脚本未加载。可能原因:');
                console.log('- 页面未完全加载');
                console.log('- 内容脚本注入失败');
                console.log('- 跨域限制');
            }
        }
    }
}

// 5. 测试web app连接
async function testWebAppConnection() {
    console.log('\n5. 测试web app连接...');

    const connectionResult = await new Promise(resolve => {
        chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' }, resolve);
    });

    console.log('web app连接测试:', connectionResult);

    return connectionResult;
}

// 6. 完整流程测试
async function runFullTest() {
    console.log('=== 开始完整数据流测试 ===\n');

    // 检查当前状态
    const state = await checkCurrentState();
    if (!state) return;

    // 测试web app连接
    await testWebAppConnection();

    // 测试内容脚本
    await testContentScript();

    // 检查存储数据
    await checkStorageData();

    // 模拟截图（可选）
    const shouldSimulate = confirm('是否模拟截图流程？');
    if (shouldSimulate) {
        await simulateScreenshot();

        // 再次检查存储数据
        await checkStorageData();
    }

    console.log('\n=== 数据流测试完成 ===');

    // 提供诊断建议
    provideDiagnosis();
}

// 7. 提供诊断建议
function provideDiagnosis() {
    console.log('\n=== 诊断建议 ===');

    console.log('常见问题及解决方案:');
    console.log('1. 内容脚本未加载');
    console.log('   - 确保在支持的网站上（TradingView, aggr.trade等）');
    console.log('   - 刷新页面后重试');
    console.log('   - 检查manifest.json的content_scripts配置');

    console.log('2. 数据传递失败');
    console.log('   - 检查截图数据大小（应在2000字符以内）');
    console.log('   - 检查生成的URL是否包含image_data参数');
    console.log('   - 检查web app是否能解析base64数据');

    console.log('3. web app连接失败');
    console.log('   - 确保web app运行在http://localhost:5173');
    console.log('   - 检查扩展的host_permissions配置');
    console.log('   - 测试网络连接');

    console.log('4. 弹窗不显示截图');
    console.log('   - 检查popupState.screenshotData是否正确设置');
    console.log('   - 检查updateScreenshotPreview()函数');
    console.log('   - 检查图片数据格式');

    console.log('\n调试命令:');
    console.log('- 在扩展背景页运行: runFullTest()');
    console.log('- 在web app控制台运行: checkExtensionRedirect()');
    console.log('- 清理数据: cleanupExtensionData()');
}

// 导出函数供控制台使用
window.debugCandlebot = {
    checkCurrentState,
    simulateScreenshot,
    checkStorageData,
    testContentScript,
    testWebAppConnection,
    runFullTest,
    provideDiagnosis
};

console.log('调试函数已加载，在控制台使用:');
console.log('- debugCandlebot.runFullTest() - 运行完整测试');
console.log('- debugCandlebot.simulateScreenshot() - 模拟截图');
console.log('- debugCandlebot.checkStorageData() - 检查存储数据');

// 自动运行基本检查
setTimeout(async () => {
    console.log('\n=== 自动运行基本检查 ===');
    await checkCurrentState();
    await testWebAppConnection();
}, 1000);