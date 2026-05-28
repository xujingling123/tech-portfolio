"use client";

import { useEffect, useRef, useState } from "react";
import {
  DEFAULT_REMBG_MODEL,
  REMBG_MODELS,
  type RembgModelId,
} from "@/lib/rembg/models";
import { prepareImageForRembg } from "@/lib/rembg/prepare-image";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type ServiceStatus = {
  ok: boolean;
  mode: "server" | "cli" | "none";
  detail: string;
};

export function RembgTool() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [model, setModel] = useState<RembgModelId>(DEFAULT_REMBG_MODEL);
  const [alphaMatting, setAlphaMatting] = useState(false);
  const [onlyMask, setOnlyMask] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prepHint, setPrepHint] = useState<string | null>(null);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void fetch("/api/tools/rembg/status")
      .then((res) => res.json())
      .then((data: ServiceStatus) => setServiceStatus(data))
      .catch(() =>
        setServiceStatus({
          ok: false,
          mode: "none",
          detail: "无法检测 rembg 服务状态",
        })
      );
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [previewUrl, resultUrl]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setPrepHint(null);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }

    if (!file) {
      setImageFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件（JPG / PNG / WebP 等）");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("图片不能超过 10MB");
      return;
    }

    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!imageFile) {
      setError("请先上传图片");
      return;
    }

    setLoading(true);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }

    try {
      const statusRes = await fetch("/api/tools/rembg/status", {
        cache: "no-store",
      });
      const status = (await statusRes.json()) as ServiceStatus;
      setServiceStatus(status);
      if (!status.ok) {
        throw new Error(
          "rembg 未就绪。请在新终端运行 npm run rembg:server 并保持窗口打开。"
        );
      }

      const prepared = await prepareImageForRembg(imageFile);
      if (prepared.hint) setPrepHint(prepared.hint);

      const form = new FormData();
      form.append("image", prepared.file);
      form.append("model", model);
      if (alphaMatting) form.append("alphaMatting", "true");
      if (onlyMask) form.append("onlyMask", "true");

      const res = await fetch("/api/tools/rembg/remove", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || `抠图失败（${res.status}）`);
      }

      const blob = await res.blob();
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "抠图失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    const baseName = imageFile?.name.replace(/\.[^.]+$/, "") || "image";
    a.download = `${baseName}-nobg.png`;
    a.click();
  };

  const selectedModel = REMBG_MODELS.find((m) => m.id === model);

  return (
    <form className="tool-stack" onSubmit={handleSubmit}>
      <div
        className={`tool-alert${serviceStatus?.ok ? "" : " tool-alert--warn"}`}
      >
        {serviceStatus == null ? (
          <p>正在检测 rembg 服务…</p>
        ) : serviceStatus.ok ? (
          <>
            <p>
              rembg 已就绪（
              {serviceStatus.mode === "server" ? "HTTP 服务" : "CLI 命令"}：
              <code className="text-xs">{serviceStatus.detail}</code>
              ）。请在本页上传图片抠图，无需单独打开 rembg 地址。
            </p>
            {serviceStatus.mode === "server" && (
              <p className="mt-2 text-sm text-muted">
                说明：浏览器访问{" "}
                <code className="text-xs">http://127.0.0.1:7000/</code>{" "}
                出现 <code className="text-xs">{`{"detail":"Not Found"}`}</code>{" "}
                是正常现象（根路径无页面）。API 文档见{" "}
                <a
                  href="http://127.0.0.1:7000/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-accent"
                >
                  /api
                </a>
                。
              </p>
            )}
          </>
        ) : (
          <>
            <p>rembg 服务未就绪，抠图前请先启动后端：</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
              <li>
                安装：<code>pip install &quot;rembg[cpu,cli]&quot;</code>
              </li>
              <li>
                启动：<code>rembg s --host 127.0.0.1 --port 7000 --no-ui</code>
              </li>
              <li>
                在 <code>.env.local</code> 设置{" "}
                <code>REMBG_SERVER_URL=http://127.0.0.1:7000</code>
              </li>
            </ol>
            <p className="mt-2 text-sm">
              或使用 Docker：<code>docker compose up rembg -d</code>
            </p>
          </>
        )}
      </div>

      <p className="tool-hint tool-hint--left">
        基于开源项目{" "}
        <a
          href="https://github.com/danielgatis/rembg"
          target="_blank"
          rel="noopener noreferrer"
          className="link-accent"
        >
          rembg
        </a>
        ，在本地运行 AI 模型去除图片背景，输出透明 PNG。
      </p>

      <label className="tool-field">
        <span className="tool-label">上传图片</span>
        <div
          className={`tool-upload${imageFile ? " tool-upload--filled" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/bmp"
            className="sr-only"
            onChange={onFileChange}
          />
          {imageFile ? (
            <p className="text-sm text-heading">
              已选择：<span className="font-medium">{imageFile.name}</span>
              <span className="text-muted">
                {" "}
                ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted">
              支持 JPG / PNG / WebP / GIF / BMP，最大 10MB
            </p>
          )}
        </div>
      </label>

      <div className="tool-form-grid tool-form-grid--2">
        <label className="tool-field">
          <span className="tool-label">模型</span>
          <select
            className="tool-input"
            value={model}
            onChange={(e) => setModel(e.target.value as RembgModelId)}
          >
            {REMBG_MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          {selectedModel && (
            <span className="tool-hint tool-hint--left">{selectedModel.hint}</span>
          )}
        </label>

        <div className="tool-field">
          <span className="tool-label">高级选项</span>
          <div className="tool-checkbox-group">
            <label className="tool-checkbox">
              <input
                type="checkbox"
                checked={alphaMatting}
                onChange={(e) => setAlphaMatting(e.target.checked)}
              />
              Alpha Matting（边缘更精细，较慢）
            </label>
            <label className="tool-checkbox">
              <input
                type="checkbox"
                checked={onlyMask}
                onChange={(e) => setOnlyMask(e.target.checked)}
              />
              仅输出蒙版（黑白图）
            </label>
          </div>
        </div>
      </div>

      {(previewUrl || resultUrl) && (
        <div className="tool-image-compare">
          {previewUrl && (
            <figure className="tool-image-panel">
              <figcaption className="tool-label">原图</figcaption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="原图预览" className="tool-image-preview" />
            </figure>
          )}
          {resultUrl && (
            <figure className="tool-image-panel">
              <figcaption className="tool-label">抠图结果</figcaption>
              <div className="tool-image-checker">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={resultUrl}
                  alt="抠图结果"
                  className="tool-image-preview"
                />
              </div>
            </figure>
          )}
        </div>
      )}

      {error && <p className="tool-error">{error}</p>}

      <div className="tool-actions">
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !imageFile}
        >
          {loading ? "抠图中…" : "开始抠图"}
        </button>
        {resultUrl && (
          <button type="button" className="btn-ghost" onClick={handleDownload}>
            下载 PNG
          </button>
        )}
      </div>

      {prepHint && !loading && (
        <p className="tool-hint tool-hint--left">{prepHint}</p>
      )}

      {loading && (
        <p className="text-sm text-muted">
          正在抠图…首次使用会下载 AI 模型，CPU 模式下可能需要 2～10 分钟，请勿关闭页面。
          若较慢可先选「轻量（u2netp）」模型。
        </p>
      )}
    </form>
  );
}
