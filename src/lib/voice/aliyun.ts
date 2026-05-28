import { VoiceServiceError } from "./errors";

const CUSTOMIZATION_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization";
const SYNTHESIS_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";

/** 与创建音色时的 target_model 必须一致 */
const TARGET_MODEL = "qwen3-tts-vc-2026-01-22";
const ENROLLMENT_MODEL = "qwen-voice-enrollment";

type DashScopeResp<T = Record<string, unknown>> = {
  output?: T;
  code?: string;
  message?: string;
  request_id?: string;
};

function resolveApiKey(userApiKey?: string): string {
  const key = userApiKey?.trim() || process.env.DASHSCOPE_API_KEY?.trim();
  if (!key) {
    throw new VoiceServiceError(
      "请填写阿里云百炼 DashScope API Key（在 bailian.console.aliyun.com 获取）。",
      "MISSING_CREDENTIALS"
    );
  }
  return key;
}

function mimeFromFileName(fileName: string, fallbackType: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (fallbackType && fallbackType !== "application/octet-stream") {
    return fallbackType;
  }
  return "audio/mpeg";
}

function sanitizePreferredName(name?: string): string {
  const raw = (name?.trim() || `vc${Date.now().toString(36).slice(-8)}`)
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 16);
  if (raw.length >= 2) return raw;
  return `vc${Date.now().toString(36).slice(-6)}`;
}

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new VoiceServiceError(
      text || `请求失败（HTTP ${res.status}）`,
      "API_ERROR",
      { httpStatus: res.status }
    );
  }
}

function humanizeDashScopeMessage(msg: string, fallback: string): string {
  const lower = msg.toLowerCase();
  if (
    lower.includes("duration") &&
    (lower.includes("exceed") || lower.includes("maximum") || lower.includes("limit"))
  ) {
    return (
      "参考音频时长不符合阿里云要求：需 5～60 秒清晰人声（推荐 10～20 秒）。" +
      "歌曲或长音频请在上传后使用自动截取，或自行剪辑后再试。"
    );
  }
  if (lower.includes("audio") && lower.includes("invalid")) {
    return "参考音频格式或内容无效，请使用 MP3/WAV/M4A 清晰人声，避免歌曲与强背景音。";
  }
  if (lower.includes("insufficient") && lower.includes("balance")) {
    return "阿里云账户余额不足，请前往百炼控制台充值后再试。";
  }
  if (lower.includes("invalid") && lower.includes("api")) {
    return "DashScope API Key 无效或未开通相关模型，请检查百炼控制台。";
  }
  return msg || fallback;
}

function assertDashScopeOk<T extends DashScopeResp>(
  data: T,
  res: Response,
  fallback: string
) {
  if (res.ok && !data.code) return;

  const raw =
    data.message ||
    (typeof data.code === "string" ? `DashScope 错误：${data.code}` : fallback);

  throw new VoiceServiceError(
    humanizeDashScopeMessage(raw, fallback),
    raw.toLowerCase().includes("duration") ? "INVALID_INPUT" : "API_ERROR",
    { httpStatus: res.status >= 400 ? res.status : 502 }
  );
}

async function blobToDataUri(audio: Blob, fileName: string): Promise<string> {
  const buf = Buffer.from(await audio.arrayBuffer());
  const mime = mimeFromFileName(fileName, audio.type);
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function createVoice(params: {
  apiKey: string;
  audio: Blob;
  fileName: string;
  preferredName?: string;
}): Promise<string> {
  const dataUri = await blobToDataUri(params.audio, params.fileName);
  const preferredName = sanitizePreferredName(params.preferredName);

  const res = await fetch(CUSTOMIZATION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: ENROLLMENT_MODEL,
      input: {
        action: "create",
        target_model: TARGET_MODEL,
        preferred_name: preferredName,
        audio: { data: dataUri },
      },
    }),
  });

  const data = await readJson<DashScopeResp<{ voice?: string; voice_id?: string }>>(
    res
  );
  assertDashScopeOk(data, res, "创建复刻音色失败");

  const voice = data.output?.voice ?? data.output?.voice_id;
  if (!voice) {
    throw new VoiceServiceError("未返回音色 ID", "CLONE_FAILED");
  }

  const out = data.output as
    | { fallback_mode?: boolean; fallback_reason?: string }
    | undefined;
  if (out?.fallback_mode) {
    console.warn(
      "[aliyun/voice] fallback_mode:",
      out.fallback_reason ?? "音频质量或内容可能不理想"
    );
  }

  return voice;
}

async function synthesizeSpeech(params: {
  apiKey: string;
  voice: string;
  text: string;
}): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const res = await fetch(SYNTHESIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TARGET_MODEL,
      input: {
        text: params.text,
        voice: params.voice,
      },
    }),
  });

  const data = await readJson<
    DashScopeResp<{
      audio?: { url?: string; data?: string };
    }>
  >(res);
  assertDashScopeOk(data, res, "语音合成失败");

  const audio = data.output?.audio;
  if (audio?.url) {
    const audioRes = await fetch(audio.url);
    if (!audioRes.ok) {
      throw new VoiceServiceError("下载合成音频失败", "SYNTHESIS_FAILED", {
        httpStatus: audioRes.status,
      });
    }
    const contentType =
      audioRes.headers.get("content-type") || "audio/wav";
    return {
      buffer: await audioRes.arrayBuffer(),
      contentType,
    };
  }

  if (audio?.data) {
    const match = audio.data.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const buf = Buffer.from(match[2], "base64");
      return {
        buffer: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
        contentType: match[1],
      };
    }
  }

  throw new VoiceServiceError("未返回合成音频", "SYNTHESIS_FAILED");
}

/**
 * 阿里云百炼：Qwen 声音复刻（Base64 上传，无需 OSS 公网链接）
 * 产品文档称 CosyVoice 系列；本实现使用 Qwen3-TTS-VC 复刻链路。
 */
export async function cloneAndSynthesize(params: {
  apiKey?: string;
  audio: Blob;
  fileName: string;
  text: string;
  voiceName?: string;
}): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const apiKey = resolveApiKey(params.apiKey);

  const voice = await createVoice({
    apiKey,
    audio: params.audio,
    fileName: params.fileName,
    preferredName: params.voiceName,
  });

  return synthesizeSpeech({
    apiKey,
    voice,
    text: params.text,
  });
}
