# DaisyUI 模板使用指南

## 概述

本项目已成功集成 DaisyUI，这是一个基于 Tailwind CSS 的组件库，提供了大量美观、可访问且可自定义的 UI 组件。

## 安装的依赖

- `daisyui@latest` - DaisyUI 组件库

## 配置更改

### 1. CSS 配置 (`src/index.css`)

已更新 CSS 文件以包含 DaisyUI 插件：

```css
@import "tailwindcss";
@plugin "daisyui";  <!-- 新增 -->

/* Tailwind 4.0 Theme Configuration */
@theme {
  /* 原有配置保持不变 */
}
```

### 2. 创建的组件

#### `src/components/DaisyUITemplate.jsx`

这是一个完整的 DaisyUI 模板组件，展示了以下功能：

- **导航栏 (Navbar)** - 带有主题切换器和抽屉菜单按钮
- **抽屉菜单 (Drawer)** - 侧边导航菜单
- **英雄区域 (Hero)** - 大型标题和描述区域
- **卡片 (Cards)** - 展示不同类型的内容
- **表单 (Forms)** - 包含输入框、文本域、复选框等
- **统计卡片 (Stats)** - 数据展示组件
- **页脚 (Footer)** - 网站页脚
- **主题切换** - 支持 30+ 种 DaisyUI 主题

### 3. 更新的页面

#### `src/pages/Home.jsx`

已更新 Home 页面以使用 DaisyUI 模板。你可以：

1. **使用 DaisyUI 模板**（当前启用）：
   ```jsx
   return <DaisyUITemplate />
   ```

2. **使用原始简单页面**（注释状态）：
   ```jsx
   return (
     <div class="animate-fade-in">
       <button onClick={handleGetStarted}>Get started</button>
     </div>
   )
   ```

## 如何使用 DaisyUI 组件

### 基本用法

DaisyUI 组件通过 CSS 类名使用，例如：

```jsx
{/* 按钮 */}
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-accent">Accent Button</button>

{/* 卡片 */}
<div class="card bg-base-100 shadow-xl">
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Card content goes here.</p>
  </div>
</div>

{/* 表单 */}
<div class="form-control">
  <label class="label">
    <span class="label-text">Your Email</span>
  </label>
  <input type="email" class="input input-bordered" />
</div>
```

### 主题系统

DaisyUI 支持多种主题。在模板中，我们实现了主题切换功能：

```jsx
const [theme, setTheme] = createSignal('dark')
// ...
<div data-theme={theme()}>
```

可用主题包括：light, dark, cupcake, bumblebee, emerald, corporate, synthwave, retro, cyberpunk 等 30+ 种。

### 响应式设计

所有 DaisyUI 组件都支持 Tailwind CSS 的响应式断点：

```jsx
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 在手机上单列，平板双列，桌面三列 */}
</div>
```

## 常用组件示例

### 按钮 (Buttons)
```jsx
<button class="btn">Default</button>
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-link">Link</button>
<button class="btn btn-outline">Outline</button>
```

### 警告框 (Alerts)
```jsx
<div class="alert alert-info">
  <span>Info alert</span>
</div>
<div class="alert alert-success">
  <span>Success alert</span>
</div>
<div class="alert alert-warning">
  <span>Warning alert</span>
</div>
<div class="alert alert-error">
  <span>Error alert</span>
</div>
```

### 模态框 (Modal)
```jsx
{/* 打开模态框的按钮 */}
<button class="btn" onClick={() => document.getElementById('my_modal').showModal()}>
  Open Modal
</button>

{/* 模态框 */}
<dialog id="my_modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Hello!</h3>
    <p class="py-4">Press ESC key or click outside to close</p>
    <div class="modal-action">
      <form method="dialog">
        <button class="btn">Close</button>
      </form>
    </div>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
```

### 下拉菜单 (Dropdown)
```jsx
<div class="dropdown">
  <div tabindex="0" role="button" class="btn m-1">Click</div>
  <ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
    <li><a>Item 1</a></li>
    <li><a>Item 2</a></li>
  </ul>
</div>
```

## 自定义主题

你可以在 `src/index.css` 文件的 `@theme` 部分自定义主题颜色：

```css
@theme {
  --color-primary: #7c6aff;
  --color-secondary: #00e87a;
  --color-accent: #ff3b5c;
  /* ... 其他颜色 */
}
```

## 最佳实践

1. **保持一致性**：在整个应用中使用相同的组件样式
2. **利用主题系统**：使用主题切换功能让用户选择喜欢的界面风格
3. **响应式设计**：确保组件在所有设备上都能良好显示
4. **可访问性**：DaisyUI 组件默认具有良好的可访问性，不要破坏它
5. **组合使用**：可以将 DaisyUI 组件与自定义 Tailwind 类组合使用

## 故障排除

### 组件不显示正确样式
- 确保 `@plugin "daisyui"` 已添加到 CSS 文件
- 检查是否正确安装了 daisyui 依赖
- 重启开发服务器：`npm run dev`

### 主题切换不工作
- 确保组件有 `data-theme` 属性
- 检查主题名称是否正确（大小写敏感）

### 响应式问题
- 检查是否正确使用了 Tailwind 响应式前缀（sm:, md:, lg:, xl:）
- 确保视口 meta 标签正确设置

## 更多资源

- [DaisyUI 官方文档](https://daisyui.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [DaisyUI 组件示例](https://daisyui.com/components/)
- [DaisyUI 主题](https://daisyui.com/docs/themes/)

## 下一步

1. 探索 DaisyUI 的其他组件
2. 根据项目需求自定义主题
3. 将 DaisyUI 组件应用到其他页面
4. 创建可复用的组件库