/**
 * 生成扩展图标
 * 需要安装canvas: npm install canvas
 */

const { createCanvas } = require('canvas');
const fs = require('fs');

// 图标尺寸
const sizes = [
  { name: 'icon16', width: 16, height: 16 },
  { name: 'icon48', width: 48, height: 48 },
  { name: 'icon128', width: 128, height: 128 }
];

// 颜色配置
const colors = {
  primary: '#667eea',
  secondary: '#764ba2',
  white: '#ffffff'
};

/**
 * 绘制16x16图标
 */
function drawIcon16(ctx) {
  const width = 16, height = 16;

  // 背景
  ctx.fillStyle = colors.primary;
  ctx.fillRect(0, 0, width, height);

  // 设置绘制样式
  ctx.strokeStyle = colors.white;
  ctx.fillStyle = colors.white;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  // 绘制K线形状
  ctx.beginPath();
  ctx.moveTo(4, 12);   // 开盘价（底部）
  ctx.lineTo(8, 4);    // 最高价
  ctx.lineTo(12, 12);  // 收盘价（底部）
  ctx.stroke();

  // 绘制实体点
  ctx.beginPath();
  ctx.arc(8, 6, 1, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 绘制48x48图标
 */
function drawIcon48(ctx) {
  const width = 48, height = 48;

  // 渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 设置绘制样式
  ctx.strokeStyle = colors.white;
  ctx.fillStyle = colors.white;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  // 绘制K线形状
  ctx.beginPath();
  ctx.moveTo(12, 36);   // 开盘价
  ctx.lineTo(24, 12);   // 最高价
  ctx.lineTo(36, 36);   // 收盘价
  ctx.stroke();

  // 绘制实体点
  ctx.beginPath();
  ctx.arc(24, 18, 3, 0, Math.PI * 2);
  ctx.fill();

  // 绘制水平线
  ctx.lineWidth = 1.5;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(12, 30);
  ctx.lineTo(36, 30);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * 绘制128x128图标
 */
function drawIcon128(ctx) {
  const width = 128, height = 128;

  // 渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, colors.primary);
  gradient.addColorStop(0.5, '#6b6bff');
  gradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 设置绘制样式
  ctx.strokeStyle = colors.white;
  ctx.fillStyle = colors.white;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  // 绘制K线形状
  ctx.beginPath();
  ctx.moveTo(32, 96);   // 开盘价
  ctx.lineTo(64, 32);   // 最高价
  ctx.lineTo(96, 96);   // 收盘价
  ctx.stroke();

  // 绘制实体点
  ctx.beginPath();
  ctx.arc(64, 48, 6, 0, Math.PI * 2);
  ctx.fill();

  // 绘制水平线（实线）
  ctx.lineWidth = 3;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(32, 80);
  ctx.lineTo(96, 80);
  ctx.stroke();

  // 绘制水平线（虚线）
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 2]);
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(40, 64);
  ctx.lineTo(88, 64);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);

  // 绘制文字
  ctx.font = 'bold 28px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('C', 64, 112);
}

// 生成所有图标
sizes.forEach(({ name, width, height }) => {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 根据尺寸选择绘制函数
  if (width === 16) drawIcon16(ctx);
  else if (width === 48) drawIcon48(ctx);
  else if (width === 128) drawIcon128(ctx);

  // 保存为PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icons/${name}.png`, buffer);

  console.log(`✅ 已生成: icons/${name}.png (${width}x${height})`);
});

console.log('\n🎉 所有图标已生成完成！');
console.log('图标文件已保存到 icons/ 目录。');