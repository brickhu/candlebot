/**
 * 内容脚本诊断工具
 * 用于调试内容脚本加载和通信问题
 */

console.log('=== 内容脚本诊断工具 ===');

// 模拟诊断函数
async function diagnoseContentScript() {
  console.log('\n1. 检查manifest.json配置...');

  const manifest = {
    content_scripts: [
      {
        matches: [
          "*://*.tradingview.com/*",
          "*://*.aggr.trade/*",
          "*://*.dextools.io/*",
          "*://*.dexscreener.com/*",
          "*://*.birdeye.so/*",
          "*://*.geckoterminal.com/*"
        ],
        js: ["src/content/index.js"],
        run_at: "document_idle"
      }
    ]
  };

  console.log('✅ manifest配置正确');
  console.log('支持的网站:', manifest.content_scripts[0].matches);

  console.log('\n2. 模拟内容脚本加载流程...');

  // 模拟内容脚本加载
  const testUrls = [
    'https://www.tradingview.com/chart/BTCUSDT/BINANCE',
    'https://aggr.trade/BTC/USDT',
    'https://www.dextools.io/app/ether/pair-explorer/0x123',
    'https://example.com/not-supported' // 不支持
  ];

  for (const url of testUrls) {
    const isSupported = manifest.content_scripts[0].matches.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    });

    console.log(`${isSupported ? '✅' : '❌'} ${url}: ${isSupported ? '支持' : '不支持'}`);
  }

  console.log('\n3. 诊断常见问题...');

  const commonIssues = [
    {
      issue: '内容脚本未加载',
      symptoms: ['Could not establish connection', 'Receiving end does not exist'],
      solutions: [
        '确保访问的是支持的网站',
        '等待页面完全加载（document_idle）',
        '检查控制台是否有内容脚本加载日志'
      ]
    },
    {
      issue: '权限问题',
      symptoms: ['Missing permissions', 'Cannot access'],
      solutions: [
        '检查manifest.json中的permissions',
        '确保有activeTab和scripting权限',
        '重新加载扩展'
      ]
    },
    {
      issue: '时机问题',
      symptoms: ['消息发送过早', '内容脚本未初始化'],
      solutions: [
        '添加延迟等待内容脚本加载',
        '使用PING/PONG机制检查就绪状态',
        '实现重试机制'
      ]
    }
  ];

  commonIssues.forEach((issue, index) => {
    console.log(`\n问题 ${index + 1}: ${issue.issue}`);
    console.log('症状:', issue.symptoms.join(', '));
    console.log('解决方案:');
    issue.solutions.forEach((sol, i) => console.log(`  ${i + 1}. ${sol}`));
  });

  console.log('\n4. 推荐的调试步骤:');
  const debugSteps = [
    '1. 打开Chrome开发者工具 (F12)',
    '2. 切换到Console标签页',
    '3. 访问支持的网站（如aggr.trade）',
    '4. 查看是否有"Candlebot内容脚本已加载"日志',
    '5. 点击扩展图标，查看background脚本日志',
    '6. 检查是否有错误信息',
    '7. 使用diagnose()函数进一步诊断'
  ];

  debugSteps.forEach(step => console.log(step));

  console.log('\n=== 诊断完成 ===');
}

// 添加全局诊断函数
window.diagnoseCandlebotExtension = async function() {
  console.log('🔧 运行Candlebot扩展诊断...');

  try {
    // 检查内容脚本状态
    if (typeof window.candlebotExtension !== 'undefined') {
      console.log('✅ 内容脚本已加载');
      console.log('内容脚本状态:', window.candlebotExtension.getState());
    } else {
      console.log('❌ 内容脚本未加载');
      console.log('可能原因:');
      console.log('  - 页面不在支持的网站列表中');
      console.log('  - 内容脚本加载失败');
      console.log('  - 页面未完全加载');
    }

    // 检查localStorage
    const hasImage = localStorage.getItem('candlebot_extension_image');
    const hasMetadata = localStorage.getItem('candlebot_extension_metadata');

    console.log('\n📦 localStorage状态:');
    console.log(`  图片数据: ${hasImage ? `有 (${hasImage.length} 字符)` : '无'}`);
    console.log(`  元数据: ${hasMetadata ? '有' : '无'}`);

    // 检查sessionStorage
    const sessionImage = sessionStorage.getItem('candlebot_extension_image');
    console.log(`  sessionStorage图片数据: ${sessionImage ? `有 (${sessionImage.length} 字符)` : '无'}`);

    // 检查URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const fromExtension = urlParams.get('from_extension');
    const imageData = urlParams.get('image_data');

    console.log('\n🔗 URL参数状态:');
    console.log(`  from_extension: ${fromExtension || '无'}`);
    console.log(`  image_data: ${imageData ? `有 (${imageData.length} 字符)` : '无'}`);

    // 发送测试消息到background
    console.log('\n📡 测试与background脚本的通信...');

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        const response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });

        console.log('✅ 与background通信正常:', response);
      } catch (error) {
        console.log('❌ 与background通信失败:', error.message);
      }
    } else {
      console.log('⚠️  chrome.runtime不可用（可能不在扩展上下文中）');
    }

    console.log('\n🎯 诊断建议:');

    if (!window.candlebotExtension) {
      console.log('1. 确保访问的是支持的网站（如aggr.trade）');
      console.log('2. 等待页面完全加载后重试');
      console.log('3. 重新加载页面');
    } else if (!hasImage && !sessionImage && !imageData) {
      console.log('1. 点击扩展图标进行截图');
      console.log('2. 检查background脚本是否有错误');
    } else {
      console.log('1. 数据已存储，可以跳转到分析页面');
      console.log('2. 使用扩展的"截图并分析"功能');
    }

  } catch (error) {
    console.error('诊断过程中发生错误:', error);
  }
};

// 自动运行基础诊断
diagnoseContentScript();

console.log('\n💡 提示: 在支持的网站上，可以在控制台运行 diagnoseCandlebotExtension() 进行详细诊断');