"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { iterateSseText } from "@/lib/deerflow/parse-sse";

type HealthState = {
  ok: boolean;
  detail: string;
  publicUrl?: string;
  authRequired?: boolean;
  needsSetup?: boolean;
  models: { name: string; display_name?: string }[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function DeerFlowAssistantTool() {
  const [health, setHealth] = useState<HealthState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [modelName, setModelName] = useState("");
  const [planMode, setPlanMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void fetch("/api/tools/deerflow/health")
      .then((res) => res.json())
      .then((data: HealthState & { gatewayUrl?: string; publicUrl?: string }) => {
        setHealth({
          ok: Boolean(data.ok),
          detail: data.detail ?? "",
          publicUrl: data.publicUrl,
          authRequired: data.authRequired,
          needsSetup: data.needsSetup,
          models: data.models ?? [],
        });
        if (data.models?.length && !modelName) {
          setModelName(data.models[0].name);
        }
      })
      .catch(() =>
        setHealth({
          ok: false,
          detail: "无法检测 DeerFlow 服务",
          models: [],
        })
      );
  }, [modelName]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setError(null);
    setInput("");
    setLoading(true);

    const userMsg: ChatMessage = { id: newId(), role: "user", content: text };
    const assistantId = newId();
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/tools/deerflow/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          threadId: threadId ?? undefined,
          modelName: modelName || undefined,
          planMode,
        }),
      });

      const nextThread = res.headers.get("X-DeerFlow-Thread-Id");
      if (nextThread) setThreadId(nextThread);

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(errBody.error ?? `请求失败（HTTP ${res.status}）`);
      }

      if (!res.body) throw new Error("未收到流式响应");

      for await (const chunk of iterateSseText(res.body)) {
        if (!chunk.text) continue;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + chunk.text }
              : m
          )
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "发送失败";
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== assistantId || m.content));
    } finally {
      setLoading(false);
    }
  }, [input, loading, threadId, modelName, planMode]);

  const publicUrl =
    health?.publicUrl?.replace(/\/$/, "") || "http://127.0.0.1:2026";

  return (
    <div className="tool-stack">
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          health?.ok
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
            : "border-amber-500/30 bg-amber-500/10 text-amber-100"
        }`}
      >
        {health?.ok ? (
          <p>DeerFlow 已连接。{health.detail}</p>
        ) : (
          <p>
            DeerFlow 未就绪：{health?.detail ?? "检测中…"}
            {health?.authRequired && (
              <>
                {" "}
                请在服务端 <code className="text-xs">.env</code> 配置{" "}
                <code className="text-xs">DEERFLOW_AUTH_EMAIL</code> /{" "}
                <code className="text-xs">DEERFLOW_AUTH_PASSWORD</code>。
              </>
            )}
            {health?.needsSetup && (
              <> 首次使用请先在 DeerFlow 完成管理员初始化。</>
            )}
          </p>
        )}
        <p className="mt-2 text-xs opacity-80">
          本地需先启动 DeerFlow（默认{" "}
          <code className="text-xs">http://127.0.0.1:2026</code>）。详见项目{" "}
          <code className="text-xs">INTEGRATION-DEERFLOW.md</code>。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary text-sm"
        >
          打开完整 DeerFlow 界面 ↗
        </a>
        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={loading}
          onClick={() => {
            setThreadId(null);
            setMessages([]);
            setError(null);
          }}
        >
          新对话
        </button>
      </div>

      {health?.models && health.models.length > 0 && (
        <div className="tool-form-grid tool-form-grid--2">
          <label className="tool-field">
            <span className="tool-label">模型</span>
            <select
              className="tool-input"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={loading}
            >
              {health.models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.display_name ?? m.name}
                </option>
              ))}
            </select>
          </label>
          <label className="tool-checkbox mt-6 sm:mt-8">
            <input
              type="checkbox"
              checked={planMode}
              onChange={(e) => setPlanMode(e.target.checked)}
              disabled={loading}
            />
            计划模式（多步 Todo）
          </label>
        </div>
      )}

      <div
        ref={listRef}
        className="deerflow-chat-log max-h-[min(28rem,50vh)] overflow-y-auto rounded-lg border border-section bg-[var(--surface)] p-4"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <p className="text-sm text-faint">
            向 DeerFlow 提问：技术调研、写脚本、整理博客大纲等。回复通过站内代理流式返回。
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`deerflow-chat-bubble deerflow-chat-bubble--${m.role}`}
              >
                <span className="deerflow-chat-role">
                  {m.role === "user" ? "你" : "DeerFlow"}
                </span>
                <div className="deerflow-chat-content whitespace-pre-wrap">
                  {m.content || (m.role === "assistant" && loading ? "…" : "")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="tool-field">
        <label className="tool-label" htmlFor="deerflow-input">
          消息
        </label>
        <textarea
          id="deerflow-input"
          className="tool-textarea"
          rows={3}
          placeholder="输入问题，Enter 发送（Shift+Enter 换行）"
          value={input}
          disabled={loading || !health?.ok}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void sendMessage();
            }
          }}
        />
      </div>

      <button
        type="button"
        className="btn-primary w-full sm:w-auto"
        disabled={loading || !health?.ok || !input.trim()}
        onClick={() => void sendMessage()}
      >
        {loading ? "思考中…" : "发送"}
      </button>
    </div>
  );
}
