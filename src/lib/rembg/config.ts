/** rembg 请求超时（毫秒），首次会下载模型，CPU 推理较慢 */
export const REMBG_TIMEOUT_MS = Math.max(
  60_000,
  Number.parseInt(process.env.REMBG_TIMEOUT_MS ?? "600000", 10) || 600_000
);

/** 上传前自动缩放：最长边像素上限 */
export const REMBG_MAX_IMAGE_SIDE = 1920;
