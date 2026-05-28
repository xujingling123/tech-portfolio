import { execFile } from "child_process";
import { mkdtemp, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { REMBG_TIMEOUT_MS } from "./config";
import { RembgServiceError } from "./errors";
import type { RembgModelId } from "./models";

const execFileAsync = promisify(execFile);

export type RemoveBackgroundOptions = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  model: RembgModelId;
  alphaMatting?: boolean;
  onlyMask?: boolean;
};

const SETUP_HINT =
  "请先启动 rembg 服务：在终端运行 `pip install \"rembg[cpu,cli]\"` 后执行 `rembg s --host 127.0.0.1 --port 7000 --no-ui`，" +
  "或运行 `docker compose up rembg -d`，并在 .env.local 中设置 REMBG_SERVER_URL=http://127.0.0.1:7000。";

function resolveServerUrl(): string | null {
  const url = process.env.REMBG_SERVER_URL?.trim();
  return url || null;
}

function resolveCliCommand(): string {
  return process.env.REMBG_COMMAND?.trim() || "rembg";
}

async function removeViaServer(
  serverUrl: string,
  options: RemoveBackgroundOptions
): Promise<Buffer> {
  const endpoint = `${serverUrl.replace(/\/$/, "")}/api/remove`;
  const form = new FormData();
  const uploadFile = new File([new Uint8Array(options.buffer)], options.fileName, {
    type: options.mimeType,
  });
  form.append("file", uploadFile);
  form.append("model", options.model);
  if (options.alphaMatting) form.append("a", "true");
  if (options.onlyMask) form.append("om", "true");

  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(REMBG_TIMEOUT_MS),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("abort") || msg.includes("timeout")) {
      throw new RembgServiceError(
        `抠图处理超时（超过 ${Math.round(REMBG_TIMEOUT_MS / 60_000)} 分钟）。` +
          "首次使用需下载模型，请换更小图片、选用「轻量（u2netp）」模型，或稍后重试。",
        "TIMEOUT",
        504
      );
    }
    throw new RembgServiceError(
      `无法连接 rembg 服务（${serverUrl}）。${SETUP_HINT}`,
      "MISSING_SERVICE",
      503
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new RembgServiceError(
      text || `rembg 服务返回错误（HTTP ${res.status}）`,
      "API_ERROR",
      res.status
    );
  }

  return Buffer.from(await res.arrayBuffer());
}

async function removeViaCli(
  options: RemoveBackgroundOptions
): Promise<Buffer> {
  const command = resolveCliCommand();
  const dir = await mkdtemp(path.join(tmpdir(), "rembg-"));
  const ext = path.extname(options.fileName) || ".png";
  const inputPath = path.join(dir, `input${ext}`);
  const outputPath = path.join(dir, "output.png");

  try {
    await writeFile(inputPath, options.buffer);
    const args = ["i", "-m", options.model];
    if (options.alphaMatting) args.push("-a");
    if (options.onlyMask) args.push("-om");
    args.push(inputPath, outputPath);

    try {
      await execFileAsync(command, args, {
        timeout: REMBG_TIMEOUT_MS,
        maxBuffer: 20 * 1024 * 1024,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("ENOENT") || msg.includes("not found")) {
        throw new RembgServiceError(SETUP_HINT, "MISSING_SERVICE", 503);
      }
      if (msg.includes("ETIMEDOUT") || msg.includes("timed out")) {
        throw new RembgServiceError(
          `抠图处理超时（超过 ${Math.round(REMBG_TIMEOUT_MS / 60_000)} 分钟）。` +
            "首次使用需下载模型，请换更小图片、选用「轻量（u2netp）」模型，或稍后重试。",
          "TIMEOUT",
          504
        );
      }
      throw new RembgServiceError(
        `rembg 命令执行失败：${msg.split("\n")[0]}`,
        "CLI_ERROR",
        500
      );
    }

    return await readFile(outputPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function isConnectionError(err: unknown): boolean {
  if (!(err instanceof RembgServiceError)) return false;
  return err.code === "MISSING_SERVICE";
}

export async function removeBackground(
  options: RemoveBackgroundOptions
): Promise<Buffer> {
  const serverUrl = resolveServerUrl();
  if (serverUrl) {
    try {
      return await removeViaServer(serverUrl, options);
    } catch (err) {
      if (!isConnectionError(err)) throw err;
      console.warn(
        "[rembg] HTTP 服务不可达，尝试使用 rembg CLI 回退:",
        err instanceof Error ? err.message : err
      );
      try {
        return await removeViaCli(options);
      } catch (cliErr) {
        throw new RembgServiceError(
          `rembg HTTP 服务（${serverUrl}）未启动或无法连接，且 CLI 回退失败。` +
            `请在终端执行：rembg s --host 127.0.0.1 --port 7000 --no-ui（或 npm run rembg:server）`,
          "MISSING_SERVICE",
          503
        );
      }
    }
  }
  return removeViaCli(options);
}

export async function checkRembgAvailable(): Promise<{
  ok: boolean;
  mode: "server" | "cli" | "none";
  detail: string;
}> {
  const serverUrl = resolveServerUrl();
  if (serverUrl) {
    try {
      const res = await fetch(`${serverUrl.replace(/\/$/, "")}/api`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok) {
        return { ok: true, mode: "server", detail: serverUrl };
      }
      return {
        ok: false,
        mode: "server",
        detail: `rembg 服务不可达（HTTP ${res.status}）：${serverUrl}`,
      };
    } catch {
      const command = resolveCliCommand();
      try {
        await execFileAsync(command, ["--help"], { timeout: 8_000 });
        return {
          ok: true,
          mode: "cli",
          detail: `${command}（HTTP 未启动，将使用命令行）`,
        };
      } catch {
        return {
          ok: false,
          mode: "server",
          detail: `无法连接 rembg 服务：${serverUrl}。请运行 npm run rembg:server`,
        };
      }
    }
  }

  const command = resolveCliCommand();
  try {
    await execFileAsync(command, ["--help"], { timeout: 8_000 });
    return { ok: true, mode: "cli", detail: command };
  } catch {
    return {
      ok: false,
      mode: "none",
      detail: SETUP_HINT,
    };
  }
}
