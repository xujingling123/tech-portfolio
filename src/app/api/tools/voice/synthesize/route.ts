import { NextResponse } from "next/server";
import { cloneAndSynthesize as aliyunClone } from "@/lib/voice/aliyun";
import { VoiceServiceError, voiceErrorToHttpStatus } from "@/lib/voice/errors";
import { cloneAndSynthesize as minimaxClone } from "@/lib/voice/minimax";

export const runtime = "nodejs";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_TEXT_LENGTH = 2000;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
]);

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const audio = form.get("audio");
    const text = String(form.get("text") ?? "").trim();
    const voiceName = String(form.get("voiceName") ?? "").trim();
    const provider = String(form.get("provider") ?? "aliyun").trim();
    const apiKey = String(form.get("apiKey") ?? "").trim();
    const groupId = String(form.get("groupId") ?? "").trim();

    if (!(audio instanceof File)) {
      return NextResponse.json(
        { error: "请上传参考音频文件" },
        { status: 400 }
      );
    }

    if (!text) {
      return NextResponse.json({ error: "请填写要合成的文本" }, { status: 400 });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `文本长度不能超过 ${MAX_TEXT_LENGTH} 字` },
        { status: 400 }
      );
    }

    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json(
        { error: "参考音频不能超过 10MB" },
        { status: 400 }
      );
    }

    const type = audio.type || "application/octet-stream";
    if (
      type !== "application/octet-stream" &&
      !ALLOWED_AUDIO_TYPES.has(type)
    ) {
      return NextResponse.json(
        { error: "仅支持 MP3、WAV、M4A、OGG、WebM 等常见音频格式" },
        { status: 400 }
      );
    }

    const common = {
      apiKey: apiKey || undefined,
      audio,
      fileName: audio.name || "sample.mp3",
      text,
      voiceName: voiceName || undefined,
    };

    if (provider === "aliyun") {
      const { buffer, contentType } = await aliyunClone(common);
      const ext = contentType.includes("wav") ? "wav" : "mp3";
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="aliyun-voice-${Date.now()}.${ext}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const buffer = await minimaxClone({
      ...common,
      groupId: groupId || undefined,
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="minimax-voice-${Date.now()}.mp3"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof VoiceServiceError) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
          providerCode: err.providerCode,
        },
        { status: voiceErrorToHttpStatus(err) }
      );
    }

    console.error("[voice/synthesize]", err);
    return NextResponse.json({ error: "服务器处理失败，请稍后重试" }, { status: 500 });
  }
}
