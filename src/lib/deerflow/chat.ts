import { DeerFlowServiceError } from "@/lib/deerflow/errors";
import { deerFlowFetch } from "@/lib/deerflow/session";

export type DeerFlowModel = {
  name: string;
  display_name?: string;
};

export async function listDeerFlowModels(): Promise<DeerFlowModel[]> {
  const res = await deerFlowFetch("/api/models");
  if (!res.ok) {
    throw new DeerFlowServiceError(
      `获取模型列表失败（HTTP ${res.status}）`,
      "MODELS_ERROR",
      res.status
    );
  }
  const data = (await res.json()) as { models?: DeerFlowModel[] };
  return data.models ?? [];
}

export async function createDeerFlowThread(): Promise<string> {
  const res = await deerFlowFetch("/api/langgraph/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ metadata: { source: "tech-portfolio" } }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new DeerFlowServiceError(
      `创建会话失败（HTTP ${res.status}）${text ? `: ${text.slice(0, 160)}` : ""}`,
      "THREAD_ERROR",
      res.status
    );
  }
  const data = (await res.json()) as { thread_id?: string };
  if (!data.thread_id) {
    throw new DeerFlowServiceError("创建会话失败：未返回 thread_id", "THREAD_ERROR");
  }
  return data.thread_id;
}

export type DeerFlowChatOptions = {
  threadId: string;
  message: string;
  modelName?: string;
  thinkingEnabled?: boolean;
  planMode?: boolean;
};

/** 返回 DeerFlow SSE 原始流，由 Route 直接 pipe 给浏览器 */
export async function streamDeerFlowRun(
  options: DeerFlowChatOptions
): Promise<Response> {
  const body = {
    input: {
      messages: [{ role: "user", content: options.message }],
    },
    config: {
      recursion_limit: 100,
      configurable: {
        ...(options.modelName ? { model_name: options.modelName } : {}),
        thinking_enabled: options.thinkingEnabled ?? false,
        is_plan_mode: options.planMode ?? false,
        subagent_enabled: false,
      },
    },
    stream_mode: ["values", "messages-tuple", "custom"],
  };

  const res = await deerFlowFetch(
    `/api/langgraph/threads/${encodeURIComponent(options.threadId)}/runs/stream`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new DeerFlowServiceError(
      `Agent 执行失败（HTTP ${res.status}）${text ? `: ${text.slice(0, 200)}` : ""}`,
      "RUN_ERROR",
      res.status
    );
  }

  if (!res.body) {
    throw new DeerFlowServiceError("Agent 未返回流式响应", "RUN_ERROR");
  }

  return res;
}
