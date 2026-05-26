# 部署上线指南

本项目为 Next.js 应用（含 `/api/image-proxy` 图片代理），推荐 **Vercel** 免费部署，几分钟即可获得公网链接。

## 方式一：Vercel 网页部署（推荐）

1. 将代码推送到 GitHub（见下方「提交到 GitHub」）
2. 打开 [https://vercel.com/new](https://vercel.com/new) 并登录
3. 选择 **Import Git Repository**，选中你的仓库
4. 框架自动识别为 **Next.js**，无需改配置，点击 **Deploy**
5. 等待 2–5 分钟，获得形如 `https://xxx.vercel.app` 的链接

## 方式二：Vercel 命令行部署

```bash
cd tech-portfolio
npx vercel@latest login    # 浏览器完成登录
npx vercel@latest --prod   # 生产环境部署
```

终端会输出 **Production** 地址，即为公网访问链接。

## 提交到 GitHub

```bash
cd tech-portfolio
git add .
git commit -m "feat: 个人技术博客站，含 CSDN 迁移与图片代理"
git branch -M main
git remote add origin https://github.com/你的用户名/tech-portfolio.git
git push -u origin main
```

## 部署后检查

- [ ] 首页可打开
- [ ] `/blog` 文章列表正常
- [ ] 任意文章页图片可点击放大
- [ ] 图片代理：`https://你的域名/api/image-proxy?url=...` 返回 200

## 自定义域名（可选）

在 Vercel 项目 → **Settings** → **Domains** 添加你的域名并按提示解析 DNS。
