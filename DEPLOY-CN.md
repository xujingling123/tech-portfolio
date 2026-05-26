# 国内部署指南（替代 Vercel）

`*.vercel.app` 在国内常无法访问，请使用以下任一方案。

---

## 方案一：Zeabur（推荐，支持完整 Next.js）

1. 打开 [https://zeabur.com](https://zeabur.com) 注册登录  
2. 在项目目录执行：

```bash
cd d:\fairy\project\xu\tech-portfolio
npx zeabur@latest login
npx zeabur@latest deploy
```

3. 按提示创建项目，等待部署完成  
4. 控制台会显示 `https://xxx.zeabur.app` 公网链接（国内一般可访问）

---

## 方案二：腾讯云 CloudBase 静态托管（国内稳定）

### 步骤

1. 打开 [云开发控制台 - 静态网站托管](https://console.cloud.tencent.com/tcb/hosting)  
2. 创建环境，记下 **环境 ID**（如 `blog-xxxxx`）  
3. 安装并登录 CLI：

```bash
npm install -g @cloudbase/cli
tcb login
```

4. 构建静态站点并上传：

```bash
cd d:\fairy\project\xu\tech-portfolio
npm run build:static
tcb hosting deploy out -e 你的环境ID
```

5. 在控制台「静态网站托管」→「基础配置」查看默认域名（`*.tcloudbaseapp.com` 或自定义域名）

---

## 方案三：Gitee Pages（免费、国内快）

```bash
npm run build:static
```

将生成的 **`out` 文件夹** 全部内容：

1. 在 Gitee 新建仓库并上传 `out` 目录内文件到仓库根目录  
2. 仓库 → **服务** → **Gitee Pages** → 启动  
3. 获得 `https://用户名.gitee.io/仓库名` 访问地址  

> 静态版无图片代理 API，线上图片直连 CSDN（已配置 `no-referrer`）。

---

## 方案四：自有服务器 / Docker

```bash
npm run build
docker build -t tech-portfolio .
docker run -p 3000:3000 tech-portfolio
```

将服务器 3000 端口映射到 80/443，绑定域名即可。

---

## 对比

| 方案 | 国内访问 | Next.js API | 难度 |
|------|----------|-------------|------|
| Zeabur | 较好 | 支持 | 低 |
| 腾讯云静态托管 | 很好 | 仅静态 | 中 |
| Gitee Pages | 很好 | 仅静态 | 低 |
| Docker 自建 | 取决于服务器 | 支持 | 中 |

---

## 已废弃

- ~~Vercel `tech-portfolio-liard.vercel.app`~~ — 国内常超时，不建议使用
