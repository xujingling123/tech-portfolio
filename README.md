# jingling 个人技术博客站

从 [CSDN 博客](https://blog.csdn.net/jingling555) 迁移的个人技术展示网站，基于 Next.js 16 + Tailwind CSS。

## 功能

- 首页：技术栈展示 + 最新文章
- 博客列表与文章详情（Markdown）
- 关于页
- CSDN 批量迁移脚本

## 开发

```bash
cd tech-portfolio
npm install
npm run dev
```

访问 http://localhost:3000

## 从 CSDN 迁移博客

首次全量导入（约 319 篇，需 5–15 分钟，含请求间隔）：

```bash
npm run migrate:csdn
```

断点续传（跳过已存在的文章）：

```bash
npm run migrate:csdn:resume
```

限制导入数量（测试用）：

```bash
node scripts/migrate-csdn.mjs --limit=10
```

文章保存在 `content/posts/{articleId}.md`。

## 部署上线

**推荐 Vercel（免费、自动 HTTPS）：**

```bash
npx vercel@latest login
npx vercel@latest --prod
```

或推送到 GitHub 后在 [vercel.com/new](https://vercel.com/new) 导入仓库一键部署。

详细步骤见 [DEPLOY.md](./DEPLOY.md)。

## 配置

编辑 `src/config/site.ts` 修改站点名称、技能栈、外链等。
