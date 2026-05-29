import { NextResponse } from "next/server";
import {
  getDeerFlowGatewayUrl,
  getDeerFlowPublicUrl,
  isDeerFlowConfigured,
} from "@/lib/deerflow/config";
import { listDeerFlowModels } from "@/lib/deerflow/chat";
import { probeDeerFlowAuth } from "@/lib/deerflow/session";

export const runtime = "nodejs";

export async function GET() {
  const probe = await probeDeerFlowAuth();
  let models: { name: string; display_name?: string }[] = [];

  if (probe.modelsOk) {
    try {
      models = await listDeerFlowModels();
    } catch {
      /* 模型列表非阻塞 */
    }
  }

  return NextResponse.json({
    ok: probe.modelsOk,
    configured: isDeerFlowConfigured(),
    gatewayUrl: getDeerFlowGatewayUrl(),
    publicUrl: getDeerFlowPublicUrl(),
    authRequired: probe.authRequired,
    needsSetup: probe.needsSetup,
    models,
    detail: probe.detail,
  });
}
