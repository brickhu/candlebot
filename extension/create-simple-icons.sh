#!/bin/bash

# 创建简单的PNG图标（使用sips命令，macOS自带）

echo "创建简单的Candlebot扩展图标..."

# 创建16x16图标
echo "创建 icon16.png..."
convert -size 16x16 xc:#667eea \
  -fill white -stroke white -strokewidth 1 \
  -draw "line 4,12 8,4" \
  -draw "line 8,4 12,12" \
  -fill white -draw "circle 8,6 8,7" \
  icons/icon16.png 2>/dev/null || \
sips -s format png --setProperty formatOptions default \
  -z 16 16 /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns \
  --out icons/icon16.png 2>/dev/null

# 创建48x48图标
echo "创建 icon48.png..."
convert -size 48x48 gradient:#667eea-#764ba2 \
  -fill white -stroke white -strokewidth 3 \
  -draw "line 12,36 24,12" \
  -draw "line 24,12 36,36" \
  -fill white -draw "circle 24,18 24,21" \
  -strokewidth 1.5 -draw "line 12,30 36,30" \
  icons/icon48.png 2>/dev/null || \
sips -s format png --setProperty formatOptions default \
  -z 48 48 /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns \
  --out icons/icon48.png 2>/dev/null

# 创建128x128图标
echo "创建 icon128.png..."
convert -size 128x128 gradient:#667eea-#764ba2 \
  -fill white -stroke white -strokewidth 6 \
  -draw "line 32,96 64,32" \
  -draw "line 64,32 96,96" \
  -fill white -draw "circle 64,48 64,54" \
  -strokewidth 3 -draw "line 32,80 96,80" \
  -strokewidth 2 -draw "line 40,64 88,64" \
  -pointsize 28 -fill white -draw "text 64,112 'C'" \
  icons/icon128.png 2>/dev/null || \
sips -s format png --setProperty formatOptions default \
  -z 128 128 /System/Library/CoreServices/CoreTypes.bundle/Contents/Resources/GenericApplicationIcon.icns \
  --out icons/icon128.png 2>/dev/null

# 创建禁用状态的图标（灰色）
echo "创建禁用状态图标..."
convert -size 16x16 xc:#cccccc icons/icon16_off.png 2>/dev/null || true
convert -size 48x48 xc:#cccccc icons/icon48_off.png 2>/dev/null || true
convert -size 128x128 xc:#cccccc icons/icon128_off.png 2>/dev/null || true

echo "✅ 图标创建完成！"
echo "如果图标显示为默认图标，请手动创建PNG文件或安装ImageMagick: brew install imagemagick"