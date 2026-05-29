---
title: "自建技术博客实战（一）：Next.js 架构与深浅色主题设计"
date: "2026-05-27 10:00:00"
description: "介绍 tech-portfolio 项目的整体技术选型、目录分层、配置驱动导航，以及基于 CSS 变量与 next-themes 的深浅色主题实现思路。"
tags: ["Next.js", "React", "技术博客", "主题切换"]
---

## 一、为什么要做这个项目

CSDN 等平台适合写作，但自定义品牌、工具集成、部署方式都受限。`tech-portfolio` 的目标是：

- **内容自主**：Markdown 文件即文章，可 Git 管理、可静态托管；
- **体验统一**：深色科技感 + 可选浅色，适配长时间阅读；
- **能力扩展**：在博客之外增加「工具专栏」，把地图、语音、抠图等能力收进同一站点。

技术栈选用 **Next.js 16（App Router）+ React 19 + Tailwind CSS v4**，兼顾 SSG 性能与按需 API 路由。

---

## 二、整体架构

```
tech-portfolio/
├── content/posts/          # Markdown 文章（319+ 篇）
├── public/                 # 静态资源（logo-cat.svg 等）
├── scripts/                # 迁移、静态构建脚本
└── src/
    ├── app/                # 页面与 API 路由
    ├── components/         # UI 组件
    ├── config/             # site.ts、tools.ts 配置
    └── lib/                # posts、markdown、各工具逻辑
```

### 2.1 路由设计

| 路径 | 类型 | 说明 |
|------|------|------|
| `/` | 静态 | 首页：技能卡片 + 最新文章 |
| `/blog` | 静态 | 文章列表 |
| `/blog/[slug]` | SSG | 单篇文章，`generateStaticParams` 预生成 |
| `/tools/*` | 静态壳 + 客户端 | 工具页 UI |
| `/api/tools/*` | 动态 | 声音复刻、抠图等需 Node 运行时 |

**思路**：页面尽量 Server Component；只有主题切换、地图、上传表单等交互部分使用 `"use client"`。

### 2.2 双模式构建

`next.config.ts` 根据环境变量切换输出模式：

```typescript
const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig = {
  ...(isStaticExport ? { output: "export" } : { output: "standalone" }),
  // ...
};
```

- **`npm run build`**：standalone，保留 `src/app/api`，适合带工具的服务器部署；
- **`npm run build:static`**：临时移走 `api` 目录后 `output: "export"`，产物在 `out/`，适合 Gitee Pages / 对象存储纯静态托管。

这是典型的 **「博客可静态、工具要 API」** 拆分策略。

---

## 三、配置驱动，避免硬编码

### 3.1 站点信息 `src/config/site.ts`

导航、作者、技能矩阵、外链集中在一处：

```typescript
export const siteConfig = {
  name: "jingling",
  nav: [
    { href: "/", label: "首页" },
    { href: "/blog", label: "博客" },
    { href: "/tools", label: "工具" },
    { href: "/about", label: "关于" },
  ],
  skills: [ /* 前端 / GIS / 移动端 / 后端 / 架构 */ ],
};
```

`HeaderNav` 读取 `nav` 渲染，`Footer` 同步，改导航只改一个文件。

### 3.2 工具注册表 `src/config/tools.ts`

每个工具一条元数据（slug、标题、描述、图标、标签、`requiresEnv`），工具列表页与 `ToolsSubnav` 自动派生，新增工具只需注册 + 新建页面。

> **注意**：`requiresEnv` 应写环境变量名（如 `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`），不要写真实 Token，避免被 GitHub Push Protection 拦截。

---

## 四、深浅色主题实现

### 4.1 选型：`next-themes` + `data-theme`

```tsx
// ThemeProvider.tsx
<NextThemesProvider
  attribute="data-theme"
  defaultTheme="dark"
  enableSystem
  themes={["light", "dark", "system"]}
>
```

根节点 `layout.tsx` 设置 `data-theme="dark"` 作为首屏默认值，减少闪烁。

### 4.2 语义化 CSS 变量

在 `globals.css` 中为 `[data-theme="light"]` 与 `[data-theme="dark"]` 分别定义一套变量：

```css
[data-theme="dark"] {
  --background: #04060d;
  --accent-violet: #a78bfa;
  --accent-cyan: #22d3ee;
  --gradient-brand: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
  /* ... */
}
```

组件只使用语义类名，例如：

- `text-heading` → `color: var(--text-heading)`
- `glass-card` → 毛玻璃卡片背景
- `btn-primary` → 渐变主按钮

**好处**：换主题不改组件；Mapbox 地图样式也可在客户端根据 `useTheme()` 切换 `dark-v11` / `light-v11`。

### 4.3 主题切换按钮

`ThemeToggle` 调用 `useTheme()` 在 `light` / `dark` / `system` 间循环，样式复用 `.theme-toggle`，与导航按钮视觉一致。

---

## 五、品牌与布局组件

### 5.1 小猫 Logo

将原字母 `J` 徽章替换为 `SiteLogo` SVG + `SiteLogoBadge`：

- 徽章底： `--gradient-brand` 紫青渐变；
- 猫身：`currentColor` 白色；
- 眼睛：`--logo-cat-eye`，随深浅色微调青色。

顶栏、页脚、关于页复用同一组件，尺寸通过 `sm | md | lg` 控制。

### 5.2 页面壳模式

工具页、关于页等遵循统一结构：

```tsx
<div className="site-container py-12 md:py-16">
  <PageHeader label="..." title="..." description="..." />
  <ToolsSubnav />  {/* 仅工具相关页 */}
  <div className="glass-card mt-8 p-5 md:p-8">
    {/* 具体工具组件 */}
  </div>
</div>
```

工具专用样式以 `tool-*` 为前缀集中在 `globals.css`「工具专栏」段落，与博客 `article-*` 样式分离，避免互相污染。

### 5.3 返回顶部

`BackToTop` 监听滚动，超过阈值显示固定右下角按钮，使用 `--shadow-glow` 与主题变量，不依赖第三方库。

---

## 六、本系列后续文章

| 篇目 | 主题 |
|------|------|
| **（一）本文** | 架构、主题、配置、构建模式 |
| （二） | CSDN 迁移、Markdown 渲染、图片处理 |
| （三） | 工具专栏：地图、声音复刻、rembg 抠图 |

---

## 七、小结

1. **App Router + SSG** 适合大量博客文章；API 路由按需保留给工具。
2. **CSS 变量 + next-themes** 是轻量、可控的主题方案，比逐组件改 Tailwind 暗色类更易维护。
3. **config 驱动** 让导航、工具列表与元数据单一数据源，利于扩展。
4. **双构建脚本** 在「纯静态托管」与「带后端工具」之间取得平衡。

下一篇将介绍如何把 CSDN 历史文章批量迁到 `content/posts/`，以及正文渲染、目录、图片代理等实现细节。
