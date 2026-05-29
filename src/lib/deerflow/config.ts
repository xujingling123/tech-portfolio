/** DeerFlow Gateway 基址（仅服务端，勿用 NEXT_PUBLIC_ 暴露到浏览器） */
export function getDeerFlowGatewayUrl(): string {
  const raw =
    process.env.DEERFLOW_GATEWAY_URL?.trim() ||
    process.env.DEERFLOW_URL?.trim() ||
    "http://127.0.0.1:2026";
  return raw.replace(/\/$/, "");
}

/** 可选：在页面中「打开完整 DeerFlow UI」的地址 */
export function getDeerFlowPublicUrl(): string {
  const raw =
    process.env.DEERFLOW_PUBLIC_URL?.trim() ||
    process.env.NEXT_PUBLIC_DEERFLOW_URL?.trim() ||
    getDeerFlowGatewayUrl();
  return raw.replace(/\/$/, "");
}

export function isDeerFlowConfigured(): boolean {
  return process.env.DEERFLOW_ENABLED !== "false";
}

export function getDeerFlowAuthCredentials():
  | { email: string; password: string }
  | null {
  const email = process.env.DEERFLOW_AUTH_EMAIL?.trim();
  const password = process.env.DEERFLOW_AUTH_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}
