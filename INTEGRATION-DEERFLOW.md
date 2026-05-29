# tech-portfolio × DeerFlow 集成说明

本站通过 **BFF（Next.js API Route）** 代理本地 [DeerFlow](https://github.com/bytedance/deer-flow) Gateway，在 `/tools/assistant` 提供精简对话；完整沙箱、Skills、子 Agent 等能力仍使用 DeerFlow 原生 Web UI。

> 官方仓库地址为 `bytedance/deer-flow`（带连字符），不是 `deerflow`。

## 架构

```
浏览器  →  tech-portfolio (Next.js :3000)
              /api/tools/deerflow/*  （服务端代理）
           →  DeerFlow Gateway (:2026)
              /api/langgraph/* 、/api/models 等
```

- **不把** DeerFlow API Key 或会话 Cookie 暴露给浏览器。
- 静态导出（`npm run build:static`）**不包含** `/api`，此工具仅适用于 `standalone` 部署。

## 1. 启动 DeerFlow

在单独目录克隆并配置：

```bash
git clone https://github.com/bytedance/deer-flow.git
cd deer-flow
```

**Windows cmd（无 `make`）** — 在仓库根目录使用自带脚本：

```cmd
setup.cmd
docker-init.cmd
docker-start.cmd
```

详见仓库内 `WINDOWS-快速开始.md`。需先安装 **Git for Windows**、**uv**（`pip install uv`）、**Docker Desktop**。

**Linux / macOS / Git Bash（有 make）**：

```bash
make setup
make docker-start   # 或 make dev
```

默认访问：http://127.0.0.1:2026

## 2. 配置 tech-portfolio

复制并编辑 `.env`（参考 `.env.example`）：

```bash
DEERFLOW_GATEWAY_URL=http://127.0.0.1:2026
# DEERFLOW_PUBLIC_URL=http://127.0.0.1:2026

# DeerFlow 2.x 若已开启登录，配置服务账号供 BFF 使用：
# DEERFLOW_AUTH_EMAIL=admin@example.com
# DEERFLOW_AUTH_PASSWORD=your_password

# 关闭集成：
# DEERFLOW_ENABLED=false
```

启动博客站：

```bash
cd tech-portfolio
npm install
npm run dev
```

打开：http://localhost:3000/tools/assistant

## 3. API 路由（本站）

| 路径 | 说明 |
|------|------|
| `GET /api/tools/deerflow/health` | 探测 Gateway、模型列表、鉴权状态 |
| `POST /api/tools/deerflow/chat` | 流式对话（SSE 透传），请求体见下 |

`POST /api/tools/deerflow/chat` 请求示例：

```json
{
  "message": "帮我列一份 Next.js 16 迁移检查清单",
  "threadId": "可选，续聊",
  "modelName": "config.yaml 中的模型 name",
  "planMode": false
}
```

响应为 `text/event-stream`，响应头 `X-DeerFlow-Thread-Id` 为会话 ID。

## 4. 生产部署注意

| 场景 | 建议 |
|------|------|
| Zeabur / 自有 VPS | DeerFlow 与 Next 同机或内网；`DEERFLOW_GATEWAY_URL` 用内网地址 |
| 纯静态托管（Gitee Pages） | **无法**使用本集成，仅保留工具卡片说明或外链 |
| 公网暴露 DeerFlow | 必须鉴权 + 反向代理；勿将 Gateway 直接暴露公网 |
| 资源 | DeerFlow 建议 8C/16GB 起；与 rembg 等工具分开部署 |

若 Next 与 DeerFlow 不同源，无需改 DeerFlow CORS：浏览器只访问本站 `/api/tools/deerflow/*`。

## 5. 可选扩展

- **博客工作流**：在 DeerFlow 中启用 `research` / `report-generation` Skill，用助手生成 `content/posts/*.md` 大纲，再人工校对发布。
- **MCP**：在 DeerFlow `extensions_config.json` 接入 GitHub、搜索等，与本站 rembg 服务并列。
- **Claude Code**：`npx skills add https://github.com/bytedance/deer-flow --skill claude-to-deerflow` 从终端驱动同一 DeerFlow 实例。

## 6. 故障排查

1. `/tools/assistant` 显示未连接 → 确认 `curl http://127.0.0.1:2026/api/models` 是否 200。
2. HTTP 401 → 配置 `DEERFLOW_AUTH_*` 或先在 DeerFlow UI 完成管理员初始化。
3. 流式无文字 → 检查 `config.yaml` 中模型 API Key；查看 DeerFlow 后端日志。
4. Windows cmd 报 `'make' 不是内部或外部命令` → 用 `deer-flow` 根目录的 **`setup.cmd` / `docker-start.cmd`**，不要直接敲 `make`。
5. Windows 本地开发 DeerFlow → Docker 模式用上述 `.cmd`；纯本地 `make dev` 仍需 Git Bash + make，或继续用 Docker 方式。
