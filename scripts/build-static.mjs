/**
 * 构建纯静态站点（用于 Gitee Pages / 腾讯云静态托管）
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiPath = path.join(root, "src", "app", "api");
const backupPath = path.join(root, "src", "app", "_api_backup_deploy");
const nextDir = path.join(root, ".next");

let moved = false;

try {
  if (fs.existsSync(apiPath)) {
    fs.renameSync(apiPath, backupPath);
    moved = true;
    console.log("已临时移走 API 路由");
  }

  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log("已清理 .next 缓存");
  }

  execSync("npx next build", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "true" },
  });

  console.log("\n✓ 静态站点已生成到 out/ 目录");
} finally {
  if (moved && fs.existsSync(backupPath)) {
    fs.renameSync(backupPath, apiPath);
    console.log("已恢复 API 路由");
  }
}
