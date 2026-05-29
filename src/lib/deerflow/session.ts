import {
  getDeerFlowAuthCredentials,
  getDeerFlowGatewayUrl,
} from "@/lib/deerflow/config";

type SessionCache = {
  cookie: string;
  csrf: string;
  expiresAt: number;
};

let sessionCache: SessionCache | null = null;
const SESSION_TTL_MS = 50 * 60 * 1000;

function parseSetCookieHeader(header: string | null): string {
  if (!header) return "";
  return header
    .split(/,(?=\s*[^;]+=)/)
    .map((part) => part.split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function fetchSetupStatus(base: string): Promise<{
  needsSetup?: boolean;
  authEnabled?: boolean;
}> {
  try {
    const res = await fetch(`${base}/api/v1/auth/setup-status`, {
      cache: "no-store",
    });
    if (!res.ok) return {};
    return (await res.json()) as { needsSetup?: boolean; authEnabled?: boolean };
  } catch {
    return {};
  }
}

async function loginLocal(base: string): Promise<SessionCache | null> {
  const creds = getDeerFlowAuthCredentials();
  if (!creds) return null;

  const res = await fetch(`${base}/api/v1/auth/login/local`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(creds),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `DeerFlow 登录失败（HTTP ${res.status}）${text ? `: ${text.slice(0, 200)}` : ""}`
    );
  }

  const setCookie =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie().join("; ")
      : parseSetCookieHeader(res.headers.get("set-cookie"));

  let csrf = "";
  const csrfMatch = setCookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  if (csrfMatch?.[1]) csrf = decodeURIComponent(csrfMatch[1]);

  if (!setCookie) {
    throw new Error("DeerFlow 登录成功但未返回 Cookie，请检查 Gateway 配置");
  }

  return {
    cookie: setCookie,
    csrf,
    expiresAt: Date.now() + SESSION_TTL_MS,
  };
}

/** 为服务端代理请求附加 DeerFlow 会话头（若已配置账号） */
export async function getDeerFlowRequestHeaders(
  extra?: HeadersInit
): Promise<Headers> {
  const base = getDeerFlowGatewayUrl();
  const headers = new Headers(extra);
  headers.set("Accept", "application/json");

  if (sessionCache && sessionCache.expiresAt > Date.now()) {
    headers.set("Cookie", sessionCache.cookie);
    if (sessionCache.csrf) headers.set("X-CSRF-Token", sessionCache.csrf);
    return headers;
  }

  const creds = getDeerFlowAuthCredentials();
  if (creds) {
    sessionCache = await loginLocal(base);
    if (sessionCache) {
      headers.set("Cookie", sessionCache.cookie);
      if (sessionCache.csrf) headers.set("X-CSRF-Token", sessionCache.csrf);
    }
    return headers;
  }

  return headers;
}

export async function deerFlowFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const base = getDeerFlowGatewayUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = await getDeerFlowRequestHeaders(init?.headers);

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (res.status === 401 && getDeerFlowAuthCredentials()) {
    sessionCache = null;
    const retryHeaders = await getDeerFlowRequestHeaders(init?.headers);
    return fetch(url, { ...init, headers: retryHeaders, cache: "no-store" });
  }

  return res;
}

export async function probeDeerFlowAuth(): Promise<{
  modelsOk: boolean;
  authRequired: boolean;
  needsSetup: boolean;
  detail: string;
}> {
  const base = getDeerFlowGatewayUrl();
  const setup = await fetchSetupStatus(base);

  try {
    const res = await deerFlowFetch("/api/models");
    if (res.ok) {
      return {
        modelsOk: true,
        authRequired: false,
        needsSetup: Boolean(setup.needsSetup),
        detail: base,
      };
    }
    if (res.status === 401 || res.status === 403) {
      const hasCreds = Boolean(getDeerFlowAuthCredentials());
      return {
        modelsOk: false,
        authRequired: true,
        needsSetup: Boolean(setup.needsSetup),
        detail: hasCreds
          ? "需要有效 DeerFlow 账号（DEERFLOW_AUTH_EMAIL / DEERFLOW_AUTH_PASSWORD）"
          : "DeerFlow 已启用鉴权，请在 .env 配置 DEERFLOW_AUTH_EMAIL 与 DEERFLOW_AUTH_PASSWORD",
      };
    }
    return {
      modelsOk: false,
      authRequired: false,
      needsSetup: Boolean(setup.needsSetup),
      detail: `DeerFlow 不可达（HTTP ${res.status}）`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      modelsOk: false,
      authRequired: false,
      needsSetup: Boolean(setup.needsSetup),
      detail: `无法连接 DeerFlow：${msg}`,
    };
  }
}
