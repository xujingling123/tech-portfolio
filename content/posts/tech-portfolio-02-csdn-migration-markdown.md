---
title: "自建技术博客实战（二）：CSDN 批量迁移与 Markdown 渲染管线"
date: "2026-05-27 14:00:00"
description: "讲解从 CSDN 抓取文章列表与正文、HTML 转 Markdown、frontmatter 规范，以及 Next.js 侧 SSG、目录提取、图片代理与阅读体验优化。"
tags: ["Next.js", "Markdown", "CSDN", "SSG"]
---

## 一、内容模型：文件即文章

文章存放在 `content/posts/{slug}.md`，使用 **gray-matter** 解析 YAML 头 + 正文：

```typescript
// src/lib/posts.ts
const postsDirectory = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  viewCount?: number;
  sourceUrl?: string;
  cover?: string;
};
```

核心 API：

- `getAllPosts()`：列表页排序（按 `date` 降序）；
- `getPostBySlug(slug)`：详情页；
- `getAllSlugs()`：供 `generateStaticParams` 预生成路径。

**设计思路**：构建时读文件系统，无需数据库；319 篇文章全部 SSG，访问速度接近静态 HTML。

---

## 二、CSDN 迁移脚本

脚本路径：`scripts/migrate-csdn.mjs`。

### 2.1 流程概览

```
CSDN 列表 API → 逐篇拉 HTML → cheerio 提取正文
    → Turndown 转 Markdown → 写 content/posts/{articleId}.md
```

### 2.2 列表接口

通过 CSDN 社区 API 分页获取文章 ID：

```javascript
const url = new URL(
  "https://blog.csdn.net/community/home-api/v1/get-business-list",
);
// 参数：username、page、size ...
```

请求间 `sleep(800)`，降低被封风险；支持 `--limit=N`、`--skip-existing` 断点续迁。

### 2.3 HTML → Markdown

使用 **cheerio** 解析 DOM，**turndown** 转 Markdown，并过滤 `script`、`style`、`iframe`：

```javascript
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});
turndown.addRule("removeScripts", {
  filter: ["script", "style", "iframe"],
  replacement: () => "",
});
```

### 2.4 frontmatter 约定

每篇文章头部示例：

```yaml
---
title: "文章标题"
date: "2025-10-25 12:15:00"
description: "摘要"
tags: ["标签1", "标签2"]
viewCount: 932
articleId: "153825837"
sourceUrl: "https://blog.csdn.net/.../article/details/153825837"
cover: "https://i-blog.csdnimg.cn/..."
---
```

`slug` 与文件名一致，沿用 CSDN `articleId`，便于对照原文链接。

### 2.5 迁移后清洗

`scripts/fix-frontmatter.mjs` 可批量修正异常 frontmatter（如 `---` 与正文粘连）。

正文侧由 `normalizeMarkdown()` 处理迁移瑕疵：

```typescript
export function normalizeMarkdown(content: string): string {
  return content
    .replace(/^\uFEFF/, "")
    .replace(/^---+(?=#)/, "")
    .replace(/\\([#*_[\]`])/g, "$1")
    .replace(/^(#{1,6}\s+\d+)\\\./gm, "$1.")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
```

---

## 三、静态生成 319+ 文章页

```typescript
// src/app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}
```

构建时 Next.js 为每个 slug 生成 HTML。首次 `next build` 会较慢，属正常现象。

`generateMetadata` 从 frontmatter 注入 `title`、`description`，利于 SEO。

---

## 四、Markdown 渲染栈

链路：**remark → remark-gfm → remark-rehype → rehype-slug → rehype-stringify**

`MarkdownContent` 组件负责渲染；样式由 `globals.css` 中 `.article-prose` 等类控制：

- 标题层级、引用块、表格斑马纹；
- 行内代码与代码块分区；
- 链接、图片间距。

与站点主题变量绑定，深浅色下对比度一致。

---

## 五、阅读体验增强

### 5.1 文章目录 TOC

`extractHeadings()` 扫描正文中的 `##`、`###`，生成 `{ id, text, level }` 列表。

`ArticleToc` 在宽屏侧边展示锚点；标题 id 由 `rehype-slug` 与 `slugifyHeading` 对齐。

### 5.2 图片点击放大

`ZoomableImage` + `ImageLightbox`：文内图片可灯箱预览，遮罩层使用 `--lightbox-bg` 等主题变量。

### 5.3 图片代理（可选）

CSDN 图床外链在部分环境存在防盗链或混合内容问题。提供 API：

```
GET /api/image-proxy?url=编码后的图片地址
```

服务端 `fetch` 后回传二进制，带缓存头。仅在需要时启用，避免把所有图片流量打到自己的服务器。

---

## 六、列表与首页展示

- **`/blog`**：`PostCard` 网格，展示标题、日期、标签、摘要；
- **首页**：取最新若干篇 + `siteConfig.skills` 技能矩阵。

`PostCard` 封面图使用 `next/image`（静态导出时 `unoptimized: true`），远程域名在 `next.config.ts` 的 `remotePatterns` 中声明 `i-blog.csdnimg.cn`。

---

## 七、纯静态部署注意事项

执行 `npm run build:static` 时：

1. 临时将 `src/app/api` 移出，避免 `output: "export"` 与 API 路由冲突；
2. 构建完成后恢复 API 目录。

因此：

- **仅博客**：可部署 `out/` 到任意静态托管；
- **含工具 API**：必须用 `npm run build` + Node 进程或容器。

---

## 八、小结

| 环节 | 技术点 |
|------|--------|
| 存储 | Markdown + gray-matter |
| 迁移 | cheerio + turndown + 分页 API |
| 构建 | `generateStaticParams` 全量 SSG |
| 渲染 | remark / rehype 生态 |
| 体验 | TOC、灯箱、主题化排版 |

下一篇介绍 **工具专栏**：Mapbox 中文地图、阿里云/MiniMax 声音复刻、rembg 一键抠图的接入架构与踩坑记录。
