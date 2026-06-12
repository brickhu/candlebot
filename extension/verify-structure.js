/**
 * 验证Candlebot扩展结构
 */

const fs = require('fs');
const path = require('path');

// 必需的文件和目录
const REQUIRED_FILES = [
  'manifest.json',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'src/background/simple-background.js',
  'src/content/index.js',
  'src/content/tradingview.js',
  'src/content/aggr.js',
  'src/popup/index.html',
  'src/popup/style.css',
  'src/popup/script.js'
];

// 可选的测试文件
const OPTIONAL_FILES = [
  'test-extension.js',
  'INSTALL_GUIDE.md',
  'README.md',
  'create-simple-icons.sh',
  'generate-icons.js',
  'package.json'
];

console.log('🔍 验证Candlebot扩展结构...\n');

// 检查必需文件
console.log('📁 检查必需文件:');
let allRequiredFilesExist = true;

REQUIRED_FILES.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);

  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${filePath}`);

  if (!exists) {
    allRequiredFilesExist = false;

    // 提供修复建议
    if (filePath.startsWith('icons/')) {
      console.log(`    建议: 运行 ./create-simple-icons.sh 生成图标`);
    } else if (filePath.startsWith('src/')) {
      console.log(`    建议: 检查源代码文件是否完整`);
    }
  }
});

// 检查可选文件
console.log('\n📁 检查可选文件:');
OPTIONAL_FILES.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);

  const status = exists ? '📝' : '➖';
  console.log(`  ${status} ${filePath}`);
});

// 检查manifest.json
console.log('\n📄 检查manifest.json:');
try {
  const manifestPath = path.join(__dirname, 'manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent);

  const checks = [
    { key: 'manifest_version', expected: 3, actual: manifest.manifest_version },
    { key: 'name', required: true, actual: manifest.name },
    { key: 'version', required: true, actual: manifest.version },
    { key: 'action.default_popup', expected: 'src/popup/index.html', actual: manifest.action?.default_popup },
    { key: 'background.service_worker', expected: 'src/background/simple-background.js', actual: manifest.background?.service_worker },
    { key: 'permissions', check: (val) => Array.isArray(val) && val.length > 0, actual: manifest.permissions }
  ];

  let manifestValid = true;
  checks.forEach(check => {
    let passed = false;
    let message = '';

    if (check.expected !== undefined) {
      passed = check.actual === check.expected;
      message = passed ? `正确 (${check.actual})` : `错误: 应为 ${check.expected}, 实际为 ${check.actual}`;
    } else if (check.required) {
      passed = !!check.actual;
      message = passed ? `存在` : `缺失`;
    } else if (check.check) {
      passed = check.check(check.actual);
      message = passed ? `有效` : `无效`;
    }

    const status = passed ? '✅' : '❌';
    console.log(`  ${status} ${check.key}: ${message}`);

    if (!passed) {
      manifestValid = false;
    }
  });

  // 检查content_scripts
  console.log('\n🔧 检查content_scripts配置:');
  const contentScripts = manifest.content_scripts || [];
  if (contentScripts.length > 0) {
    contentScripts.forEach((script, i) => {
      console.log(`  📦 脚本 ${i + 1}:`);
      console.log(`    匹配: ${script.matches?.length || 0} 个模式`);
      console.log(`    文件: ${script.js?.length || 0} 个JS文件`);
    });
  } else {
    console.log('  ❌ 未配置content_scripts');
    manifestValid = false;
  }

  // 检查权限
  console.log('\n🔐 检查权限配置:');
  const permissions = manifest.permissions || [];
  const hostPermissions = manifest.host_permissions || [];

  const requiredPermissions = ['activeTab', 'tabs', 'storage'];
  requiredPermissions.forEach(perm => {
    const hasPerm = permissions.includes(perm);
    const status = hasPerm ? '✅' : '❌';
    console.log(`  ${status} ${perm}`);
    if (!hasPerm) manifestValid = false;
  });

  console.log(`  📡 host_permissions: ${hostPermissions.length} 个主机权限`);

  if (allRequiredFilesExist && manifestValid) {
    console.log('\n🎉 扩展结构验证通过！');
    console.log('\n下一步:');
    console.log('  1. 在Chrome中加载扩展: chrome://extensions/');
    console.log('  2. 运行测试: 打开 test-extension.html');
    console.log('  3. 参考 INSTALL_GUIDE.md 进行完整测试');
  } else {
    console.log('\n❌ 扩展结构验证失败！');
    console.log('请修复上述问题后重试。');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ 解析manifest.json失败:', error.message);
  process.exit(1);
}

// 生成扩展结构树
console.log('\n🌳 扩展目录结构:');
function printTree(dir, prefix = '') {
  const items = fs.readdirSync(dir).filter(item => !item.startsWith('.'));

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    const connector = isLast ? '└── ' : '├── ';
    console.log(prefix + connector + item);

    if (stat.isDirectory() && !item.includes('node_modules')) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      printTree(fullPath, newPrefix);
    }
  });
}

try {
  printTree(__dirname);
} catch (error) {
  console.log('无法生成目录树:', error.message);
}

console.log('\n📊 统计信息:');
const countFiles = (dir, pattern = /.*/) => {
  let count = 0;
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.includes('node_modules')) {
      count += countFiles(fullPath, pattern);
    } else if (stat.isFile() && pattern.test(item)) {
      count++;
    }
  });

  return count;
};

const totalFiles = countFiles(__dirname);
const jsFiles = countFiles(__dirname, /\.js$/);
const htmlFiles = countFiles(__dirname, /\.html$/);
const cssFiles = countFiles(__dirname, /\.css$/);
const jsonFiles = countFiles(__dirname, /\.json$/);
const pngFiles = countFiles(__dirname, /\.png$/);

console.log(`  总文件数: ${totalFiles}`);
console.log(`  JS文件: ${jsFiles}`);
console.log(`  HTML文件: ${htmlFiles}`);
console.log(`  CSS文件: ${cssFiles}`);
console.log(`  JSON文件: ${jsonFiles}`);
console.log(`  PNG图标: ${pngFiles}`);

console.log('\n✅ 验证完成！');