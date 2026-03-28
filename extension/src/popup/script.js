/**
 * Candlebot扩展弹窗脚本
 * 处理弹窗UI交互和状态管理
 */

// 弹窗状态
let popupState = {
    currentTab: null,
    siteInfo: null,
    isChartPage: false,
    screenshotData: null,
    chartInfo: null,
    environment: 'development',
    connectionStatus: 'checking'
};

// DOM元素
const elements = {
    // 状态区域
    statusSection: document.getElementById('statusSection'),

    // 截图区域
    screenshotSection: document.getElementById('screenshotSection'),
    screenshotPreview: document.getElementById('screenshotPreview'),
    screenshotSize: document.getElementById('screenshotSize'),
    screenshotTime: document.getElementById('screenshotTime'),
    refreshScreenshot: document.getElementById('refreshScreenshot'),

    // 信息区域
    infoSection: document.getElementById('infoSection'),
    infoSymbol: document.getElementById('infoSymbol'),
    infoTimeframe: document.getElementById('infoTimeframe'),
    infoExchange: document.getElementById('infoExchange'),
    infoSite: document.getElementById('infoSite'),

    // 操作按钮
    actionsSection: document.getElementById('actionsSection'),
    captureBtn: document.getElementById('captureBtn'),
    retryCaptureBtn: document.getElementById('retryCaptureBtn'),

    // 不支持提示
    unsupportedSection: document.getElementById('unsupportedSection'),
    unsupportedReason: document.getElementById('unsupportedReason'),

    // 设置
    environmentBadge: document.getElementById('environmentBadge'),
    environmentSelect: document.getElementById('environmentSelect'),
    testConnectionBtn: document.getElementById('testConnectionBtn'),
    clearDataBtn: document.getElementById('clearDataBtn'),

    // 链接
    openDashboard: document.getElementById('openDashboard'),
    openNewAnalysis: document.getElementById('openNewAnalysis'),

    // 底部状态
    footerStatus: document.getElementById('footerStatus'),

    // 通知容器
    notificationContainer: document.getElementById('notificationContainer')
};

/**
 * 初始化弹窗
 */
async function initializePopup() {
    console.log('初始化Candlebot弹窗...');

    // 加载保存的设置
    await loadSettings();

    // 获取当前标签页信息
    await getCurrentTabInfo();

    // 设置事件监听器
    setupEventListeners();

    // 更新UI状态
    updateUI();

    console.log('弹窗初始化完成');
}

/**
 * 加载设置
 */
async function loadSettings() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['candlebot_environment'], (result) => {
            if (result.candlebot_environment) {
                popupState.environment = result.candlebot_environment;
                elements.environmentSelect.value = popupState.environment;
                updateEnvironmentBadge();
            }
            resolve();
        });
    });
}

/**
 * 获取当前标签页信息
 */
async function getCurrentTabInfo() {
    try {
        // 获取当前激活的标签页
        const tabs = await new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, resolve);
        });

        if (!tabs || tabs.length === 0) {
            throw new Error('无法获取当前标签页');
        }

        popupState.currentTab = tabs[0];
        console.log('当前标签页:', popupState.currentTab.url);

        // 获取扩展状态
        const stateResponse = await sendMessageToBackground('GET_CURRENT_STATE');
        if (stateResponse?.success) {
            Object.assign(popupState, stateResponse.state);
        }

        // 获取图表信息
        if (popupState.currentSite) {
            const infoResponse = await sendMessageToBackground('GET_CHART_INFO');
            if (infoResponse?.success) {
                popupState.chartInfo = infoResponse.info;
            }
        }

        // 检查是否为图表页面
        const checkResponse = await sendMessageToBackground({
            type: 'CHECK_SITE_SUPPORT',
            url: popupState.currentTab.url
        });

        if (checkResponse?.supported !== undefined) {
            popupState.isChartPage = checkResponse.isChartPage;
            popupState.siteInfo = {
                name: checkResponse.site?.name,
                reason: checkResponse.reason
            };
        }

        // 获取最后截图数据
        const screenshotResponse = await sendMessageToBackground('GET_LAST_SCREENSHOT');
        if (screenshotResponse?.success && screenshotResponse.screenshot) {
            popupState.screenshotData = screenshotResponse.screenshot;
            console.log('加载最后截图数据:', screenshotResponse.screenshot.timestamp);
        }

        // 测试连接
        await testConnection();

    } catch (error) {
        console.error('获取标签页信息失败:', error);
        showNotification('错误', '无法获取当前页面信息', 'error');
    }
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 截图按钮
    elements.captureBtn.addEventListener('click', handleCaptureClick);
    elements.retryCaptureBtn.addEventListener('click', handleRetryCaptureClick);
    elements.refreshScreenshot.addEventListener('click', handleRefreshScreenshot);

    // 设置
    elements.environmentSelect.addEventListener('change', handleEnvironmentChange);
    elements.testConnectionBtn.addEventListener('click', handleTestConnection);
    elements.clearDataBtn.addEventListener('click', handleClearData);

    // 链接
    elements.openDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        openWebApp('/dashboard');
    });

    elements.openNewAnalysis.addEventListener('click', (e) => {
        e.preventDefault();
        openWebApp('/new');
    });

    // 监听storage变化（用于状态同步）
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.candlebot_current_state) {
            updateFromStorage(changes.candlebot_current_state.newValue);
        }
    });
}

/**
 * 更新UI状态
 */
function updateUI() {
    // 更新环境徽章
    updateEnvironmentBadge();

    // 更新底部状态
    updateFooterStatus();

    // 根据页面类型显示不同内容
    if (!popupState.currentTab?.url) {
        showLoading();
        return;
    }

    if (popupState.isChartPage) {
        showChartPageUI();
    } else {
        showUnsupportedPageUI();
    }
}

/**
 * 显示图表页面UI
 */
function showChartPageUI() {
    // 隐藏加载状态
    elements.statusSection.classList.add('hidden');

    // 显示截图和信息区域
    elements.screenshotSection.classList.remove('hidden');
    elements.infoSection.classList.remove('hidden');
    elements.actionsSection.classList.remove('hidden');

    // 隐藏不支持提示
    elements.unsupportedSection.classList.add('hidden');

    // 更新图表信息
    updateChartInfo();

    // 更新按钮文本
    updateActionButtons();

    // 如果有截图数据，显示预览
    if (popupState.screenshotData) {
        updateScreenshotPreview();
    }
}

/**
 * 更新操作按钮状态
 */
function updateActionButtons() {
    if (popupState.screenshotData) {
        // 已有截图，显示"立即分析"按钮
        elements.captureBtn.innerHTML = '<i class="fas fa-rocket"></i> 立即分析';
        elements.captureBtn.classList.add('btn-analyze');
        elements.retryCaptureBtn.style.display = 'flex';
    } else {
        // 没有截图，显示"截图并分析"按钮
        elements.captureBtn.innerHTML = '<i class="fas fa-camera"></i> 截图并分析';
        elements.captureBtn.classList.remove('btn-analyze');
        elements.retryCaptureBtn.style.display = 'none';
    }
}

/**
 * 显示不支持页面UI
 */
function showUnsupportedPageUI() {
    // 隐藏加载状态
    elements.statusSection.classList.add('hidden');

    // 隐藏图表页面内容
    elements.screenshotSection.classList.add('hidden');
    elements.infoSection.classList.add('hidden');
    elements.actionsSection.classList.add('hidden');

    // 显示不支持提示
    elements.unsupportedSection.classList.remove('hidden');

    // 更新不支持原因
    if (popupState.siteInfo?.reason) {
        elements.unsupportedReason.textContent = popupState.siteInfo.reason;
    }
}

/**
 * 显示加载状态
 */
function showLoading() {
    elements.statusSection.classList.remove('hidden');
    elements.screenshotSection.classList.add('hidden');
    elements.infoSection.classList.add('hidden');
    elements.actionsSection.classList.add('hidden');
    elements.unsupportedSection.classList.add('hidden');
}

/**
 * 更新图表信息显示
 */
function updateChartInfo() {
    if (popupState.chartInfo) {
        elements.infoSymbol.textContent = popupState.chartInfo.symbol || '-';
        elements.infoTimeframe.textContent = popupState.chartInfo.timeframe || '-';
        elements.infoExchange.textContent = popupState.chartInfo.exchange || '-';
        elements.infoSite.textContent = popupState.siteInfo?.name || '-';
    } else {
        elements.infoSymbol.textContent = '-';
        elements.infoTimeframe.textContent = '-';
        elements.infoExchange.textContent = '-';
        elements.infoSite.textContent = popupState.siteInfo?.name || '-';
    }
}

/**
 * 更新截图预览
 */
function updateScreenshotPreview() {
    if (!popupState.screenshotData?.dataUrl) {
        // 显示占位符
        elements.screenshotPreview.innerHTML = `
            <div class="screenshot-placeholder">
                <i class="fas fa-image"></i>
                <p>${popupState.isChartPage ? '点击下方按钮截图' : '请在支持的图表页面使用'}</p>
            </div>
        `;
        elements.screenshotSize.textContent = '-';
        elements.screenshotTime.textContent = '-';
        return;
    }

    // 显示图片
    const img = document.createElement('img');
    img.src = popupState.screenshotData.dataUrl;
    img.alt = '图表截图';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '200px';
    img.style.objectFit = 'contain';

    elements.screenshotPreview.innerHTML = '';
    elements.screenshotPreview.appendChild(img);

    // 更新信息
    const sizeKB = Math.round(popupState.screenshotData.dataUrl.length / 1024);
    elements.screenshotSize.textContent = `${sizeKB} KB`;

    const time = new Date(popupState.screenshotData.timestamp).toLocaleTimeString();
    elements.screenshotTime.textContent = time;
}

/**
 * 更新环境徽章
 */
function updateEnvironmentBadge() {
    const envText = popupState.environment === 'production' ? '生产' : '本地';
    elements.environmentBadge.querySelector('.env-text').textContent = envText;

    if (popupState.environment === 'production') {
        elements.environmentBadge.classList.add('production');
    } else {
        elements.environmentBadge.classList.remove('production');
    }
}

/**
 * 更新底部状态
 */
function updateFooterStatus() {
    const statusDot = elements.footerStatus.querySelector('.status-dot');
    const statusText = elements.footerStatus.querySelector('span');

    switch (popupState.connectionStatus) {
        case 'connected':
            statusDot.className = 'fas fa-circle status-dot';
            statusDot.style.color = '#10b981';
            statusText.textContent = '已连接';
            break;
        case 'disconnected':
            statusDot.className = 'fas fa-circle status-dot error';
            statusText.textContent = '未连接';
            break;
        case 'checking':
            statusDot.className = 'fas fa-circle status-dot connecting';
            statusText.textContent = '检查连接...';
            break;
    }
}

/**
 * 处理截图按钮点击
 */
async function handleCaptureClick() {
    console.log('处理截图按钮点击，当前状态:', {
        hasScreenshot: !!popupState.screenshotData,
        isChartPage: popupState.isChartPage
    });

    if (popupState.screenshotData) {
        // 已有截图，跳转到分析页面
        await handleAnalyzeClick();
    } else {
        // 没有截图，执行截图流程
        await handleCaptureScreenshot();
    }
}

/**
 * 处理截图流程
 */
async function handleCaptureScreenshot() {
    console.log('开始截图流程...');

    // 显示加载状态
    showLoading();
    showNotification('处理中', '正在截图...', 'info');

    try {
        // 发送截图请求
        const response = await sendMessageToBackground('CAPTURE_SCREENSHOT');

        if (response?.success) {
            console.log('截图成功:', response);

            // 更新截图数据
            if (response.lastScreenshot) {
                popupState.screenshotData = response.lastScreenshot;

                // 保存到storage
                await sendMessageToBackground({
                    type: 'SAVE_SCREENSHOT',
                    screenshot: response.lastScreenshot
                });
            }

            showNotification('成功', '截图完成，请在弹窗中预览', 'success');

            // 更新UI显示截图
            updateUI();

        } else {
            console.error('截图失败:', response?.error);
            showNotification('失败', response?.error || '截图失败', 'error');
            updateUI();
        }

    } catch (error) {
        console.error('截图流程异常:', error);
        showNotification('错误', error.message || '未知错误', 'error');
        updateUI();
    }
}

/**
 * 处理分析按钮点击
 */
async function handleAnalyzeClick() {
    console.log('开始分析流程，截图数据:', popupState.screenshotData);

    if (!popupState.screenshotData?.transferResult?.url) {
        showNotification('错误', '没有可用的分析链接', 'error');
        return;
    }

    showNotification('跳转中', '正在打开分析页面...', 'info');

    try {
        // 打开分析页面
        await sendMessageToBackground({
            type: 'OPEN_WEB_APP',
            url: popupState.screenshotData.transferResult.url
        });

        // 清除截图数据
        await sendMessageToBackground('CLEAR_LAST_SCREENSHOT');
        popupState.screenshotData = null;

        // 等待一会儿后关闭弹窗
        setTimeout(() => {
            window.close();
        }, 1000);

    } catch (error) {
        console.error('跳转失败:', error);
        showNotification('错误', '跳转到分析页面失败', 'error');
    }
}

/**
 * 处理重新截图按钮点击
 */
async function handleRetryCaptureClick() {
    console.log('重新截图...');

    try {
        // 清除现有截图数据
        popupState.screenshotData = null;
        updateScreenshotPreview();

        // 清除storage中的截图数据
        await sendMessageToBackground('CLEAR_LAST_SCREENSHOT');

        showNotification('已清除', '截图数据已清除，请重新截图', 'info');

    } catch (error) {
        console.error('清除截图数据失败:', error);
        showNotification('错误', error.message || '未知错误', 'error');
    }
}

/**
 * 处理刷新截图按钮点击
 */
function handleRefreshScreenshot() {
    popupState.screenshotData = null;
    updateScreenshotPreview();
    showNotification('已重置', '截图预览已清除', 'info');
}

/**
 * 处理环境切换
 */
async function handleEnvironmentChange() {
    const newEnv = elements.environmentSelect.value;

    if (newEnv !== popupState.environment) {
        popupState.environment = newEnv;

        // 保存设置
        chrome.storage.local.set({ candlebot_environment: newEnv });

        // 通知background
        await sendMessageToBackground({
            type: 'SET_ENVIRONMENT',
            environment: newEnv
        });

        // 更新UI
        updateEnvironmentBadge();

        // 测试新环境连接
        await testConnection();

        showNotification('设置已更新', `环境已切换到${newEnv === 'production' ? '生产' : '本地'}`, 'success');
    }
}

/**
 * 处理测试连接
 */
async function handleTestConnection() {
    await testConnection(true);
}

/**
 * 测试连接
 */
async function testConnection(showNotification = false) {
    popupState.connectionStatus = 'checking';
    updateFooterStatus();

    try {
        const response = await sendMessageToBackground('TEST_CONNECTION');

        if (response?.success) {
            popupState.connectionStatus = response.connected ? 'connected' : 'disconnected';

            if (showNotification) {
                const message = response.connected
                    ? `已连接到${popupState.environment === 'production' ? '生产' : '本地'}环境`
                    : `无法连接到${popupState.environment === 'production' ? '生产' : '本地'}环境`;
                const type = response.connected ? 'success' : 'warning';
                showNotification('连接测试', message, type);
            }

        } else {
            popupState.connectionStatus = 'disconnected';
            if (showNotification) {
                showNotification('连接测试', '测试失败', 'error');
            }
        }

    } catch (error) {
        popupState.connectionStatus = 'disconnected';
        if (showNotification) {
            showNotification('连接测试', error.message, 'error');
        }
    }

    updateFooterStatus();
}

/**
 * 处理清理数据
 */
async function handleClearData() {
    try {
        // 清理本地存储
        chrome.storage.local.clear(() => {
            // 重置状态
            popupState.screenshotData = null;

            // 更新UI
            updateScreenshotPreview();

            showNotification('已清理', '所有本地数据已清除', 'success');
        });

    } catch (error) {
        showNotification('错误', '清理数据失败', 'error');
    }
}

/**
 * 打开web app页面
 */
function openWebApp(path) {
    const baseUrl = popupState.environment === 'production'
        ? 'https://chat.candlebot.app'
        : 'http://localhost:5173';

    const url = `${baseUrl}${path}`;

    sendMessageToBackground({
        type: 'OPEN_WEB_APP',
        url: url
    });
}

/**
 * 从storage更新状态
 */
function updateFromStorage(state) {
    if (state) {
        // 更新相关状态
        if (state.site) {
            popupState.siteInfo = state.site;
        }
        if (state.isChartPage !== undefined) {
            popupState.isChartPage = state.isChartPage;
        }

        // 更新UI
        updateUI();
    }
}

/**
 * 发送消息到background脚本
 */
function sendMessageToBackground(message) {
    return new Promise((resolve) => {
        if (typeof message === 'string') {
            message = { type: message };
        }

        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                console.error('发送消息失败:', chrome.runtime.lastError.message);
                resolve({ success: false, error: chrome.runtime.lastError.message });
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * 显示通知
 */
function showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
    `;

    elements.notificationContainer.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 3000);
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 初始化弹窗
document.addEventListener('DOMContentLoaded', initializePopup);