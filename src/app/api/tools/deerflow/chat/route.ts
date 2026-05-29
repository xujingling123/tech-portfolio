import { NextResponse } from "next/server";
import {
  createDeerFlowThread,
  streamDeerFlowRun,
} from "@/lib/deerflow/chat";
import { isDeerFlowConfigured } from "@/lib/deerflow/config";
import {
  DeerFlowServiceError,
  deerflowErrorToHttpStatus,
} from "@/lib/deerflow/errors";
import { probeDeerFlowAuth } from "@/lib/deerflow/session";

export const runtime = "nodejs";
export const maxDuration = 600;

type ChatBody = {
  message?: string;
  threadId?: string;
  modelName?: string;
  thinkingEnabled?: boolean;
  planMode?: boolean;
};

export async function POST(request: Request) {
  try {
    if (!isDeerFlowConfigured() && process.env.DEERFLOW_ENABLED === "false") {
      return NextResponse.json(
        { error: "DeerFlow 集成未启用（DEERFLOW_ENABLED=false）" },
        { status: 503 }
      );
    }

    const probe = await probeDeerFlowAuth();
    if (!probe.modelsOk) {
      return NextResponse.json(
        {
          error: probe.detail,
          authRequired: probe.authRequired,
          needsSetup: probe.needsSetup,
        },
        { status: 503 }
      );
    }

    const body = (await request.json()) as ChatBody;
    const message = body.message?.trim();
    if (!message) {
      return NextResponse.json({ error: "请输入消息内容" }, { status: 400 });
    }

    const threadId = body.threadId?.trim() || (await createDeerFlowThread());

    const upstream = await streamDeerFlowRun({
      threadId,
      message,
      modelName: body.modelName?.trim() || undefined,
      thinkingEnabled: body.thinkingEnabled,
      planMode: body.planMode,
    });

    const headers = new Headers(upstream.headers);
    headers.set("Content-Type", "text/event-stream; charset=utf-8");
    headers.set("Cache-Control", "no-cache, no-transform");
    headers.set("Connection", "keep-alive");
    headers.set("X-DeerFlow-Thread-Id", threadId);

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch (err) {
    if (err instanceof DeerFlowServiceError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: deerflowErrorToHttpStatus(err) }
      );
    }
    const msg = err instanceof Error ? err.message : "DeerFlow 请求失败";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
