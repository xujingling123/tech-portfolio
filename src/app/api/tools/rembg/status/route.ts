import { NextResponse } from "next/server";
import { checkRembgAvailable } from "@/lib/rembg/remove";

export const runtime = "nodejs";

export async function GET() {
  const status = await checkRembgAvailable();
  return NextResponse.json(status, {
    headers: { "Cache-Control": "no-store" },
  });
}
