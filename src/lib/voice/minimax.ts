import { VoiceServiceError } from "./errors";

export { VoiceServiceError, voiceErrorToHttpStatus } from "./errors";

const MINIMAX_BASE = "https://api.minimaxi.com";
const SPEECH_MODEL = "speech-2.8-hd";

type MiniMaxBaseResp = {
  status_code: number;
  status_msg: string;
};

function resolveCredentials(user?: { apiKey?: string; groupId?: string }) {
  const apiKey = user?.apiKey?.trim() || process.env.MINIMAX_API_KEY?.trim();
  const groupId = user?.groupId?.trim() || process.env.MINIMAX_GROUP_ID?.trim();

  if (!apiKey || !groupId) {
    throw new VoiceServiceError(
      "请填写 MiniMax API Key 与 Group ID（可在 platform.minimaxi.com 账户中心获取）。",
      "MISSING_CREDENTIALS"
    );
  }

  return { apiKey, groupId };
}

function buildUrl(path: string, groupId: string) {
  const url = new URL(path, MINIMAX_BASE);
  url.searchParams.set("GroupId", groupId);
  return url.toString();
}

function authHeaders(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}` };
}

const MINIMAX_ERROR_HINTS: Record<number, string> = {
  1004: "API Key 或 Group ID 无效，请检查是否与当前账户匹配。",
  1008: "账户余额不足，请前往 MiniMax 控制台充值后再试。",
  2038:
    "MiniMax 返回 2038：该 API Key 对应账户未开通或未启用「声音复刻」。控制台里的合规通知只表示你在网页上尝试过该功能，不代表本站填写的 Key 已有权限。请用同一组 Key + Group ID 在开放平台「API 调试台」测试；实名认证通过后建议重新创建 API Key，并确认 Key 与 Group ID 来自同一主账号。",
  2039: "音色 ID 已存在，请清空「自定义音色 ID」后重试，或换一个未使用过的 ID。",
  2037:
    "参考音频时长不符合要求：需 10 秒～5 分钟，且为清晰人声（勿用歌曲/带 BGM 的片段）。",
};

function codeForMiniMax(statusCode: number): string {
  if (statusCode === 2038) return "CLONE_FORBIDDEN";
  if (statusCode === 2037 || statusCode === 2039 || statusCode === 2013) {
    return "INVALID_INPUT";
  }
  return "API_ERROR";
}

function humanizeMiniMaxError(
  statusCode: number | undefined,
  statusMsg: string | undefined,
  fallback: string
): string {
  if (statusCode != null && MINIMAX_ERROR_HINTS[statusCode]) {
    return MINIMAX_ERROR_HINTS[statusCode];
  }
  const msg = (statusMsg ?? "").toLowerCase();
  if (msg.includes("forbidden") && msg.includes("clone")) {
    return MINIMAX_ERROR_HINTS[2038];
  }
  return statusMsg || fallback;
}

function assertBaseResp(data: { base_resp?: MiniMaxBaseResp }, fallback: string) {
  const resp = data.base_resp;
  if (!resp) return;
  if (resp.status_code !== 0) {
    throw new VoiceServiceError(
      humanizeMiniMaxError(resp.status_code, resp.status_msg, fallback),
      codeForMiniMax(resp.status_code),
      { providerCode: resp.status_code }
    );
  }
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const clean = hex.replace(/^0x/i, "").trim();
  if (!clean || clean.length % 2 !== 0) {
    throw new VoiceServiceError("音频数据格式异常", "INVALID_AUDIO");
  }
  const buf = Buffer.from(clean, "hex");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
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

function createVoiceId() {
  return `voice${Date.now()}${Math.random().toString(36).slice(2, 6)}`;
}

async function uploadCloneAudio(
  apiKey: string,
  groupId: string,
  audio: Blob,
  fileName: string
): Promise<number> {
  const form = new FormData();
  form.append("purpose", "voice_clone");
  form.append("file", audio, fileName);

  const res = await fetch(buildUrl("/v1/files/upload", groupId), {
    method: "POST",
    headers: authHeaders(apiKey),
    body: form,
  });

  const data = await readJson<{
    file?: { file_id?: number };
    base_resp?: MiniMaxBaseResp;
  }>(res);

  const miniMaxCode = data.base_resp?.status_code;

  if (!res.ok) {
    throw new VoiceServiceError(
      humanizeMiniMaxError(
        miniMaxCode,
        data.base_resp?.status_msg,
        "上传参考音频失败"
      ),
      miniMaxCode != null ? codeForMiniMax(miniMaxCode) : "UPLOAD_FAILED",
      { providerCode: miniMaxCode, httpStatus: res.status }
    );
  }

  assertBaseResp(data, "上传参考音频失败");

  const fileId = data.file?.file_id;
  if (fileId == null) {
    throw new VoiceServiceError("未获取到 file_id", "UPLOAD_FAILED");
  }

  return fileId;
}

async function cloneVoice(
  apiKey: string,
  groupId: string,
  fileId: number,
  voiceId: string,
  text: string
) {
  const res = await fetch(buildUrl("/v1/voice_clone", groupId), {
    method: "POST",
    headers: {
      ...authHeaders(apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_id: fileId,
      voice_id: voiceId,
      text,
      model: SPEECH_MODEL,
      need_noise_reduction: true,
      need_volume_normalization: true,
    }),
  });

  const data = await readJson<{
    demo_audio?: string;
    data?: { audio?: string };
    base_resp?: MiniMaxBaseResp;
  }>(res);

  const miniMaxCode = data.base_resp?.status_code;

  if (!res.ok) {
    const msg = humanizeMiniMaxError(
      miniMaxCode,
      data.base_resp?.status_msg,
      "音色复刻失败"
    );
    throw new VoiceServiceError(
      res.status === 401 ? MINIMAX_ERROR_HINTS[1004] : msg,
      miniMaxCode != null ? codeForMiniMax(miniMaxCode) : "CLONE_FAILED",
      { providerCode: miniMaxCode, httpStatus: res.status }
    );
  }

  assertBaseResp(data, "音色复刻失败");
  return data;
}

async function synthesizeSpeech(
  apiKey: string,
  groupId: string,
  voiceId: string,
  text: string
): Promise<ArrayBuffer> {
  const res = await fetch(buildUrl("/v1/t2a_v2", groupId), {
    method: "POST",
    headers: {
      ...authHeaders(apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: SPEECH_MODEL,
      text,
      stream: false,
      voice_setting: {
        voice_id: voiceId,
        speed: 1,
        vol: 1,
        pitch: 0,
      },
      audio_setting: {
        sample_rate: 32000,
        format: "mp3",
        channel: 1,
      },
      output_format: "hex",
    }),
  });

  const data = await readJson<{
    data?: { audio?: string };
    base_resp?: MiniMaxBaseResp;
  }>(res);

  const miniMaxCode = data.base_resp?.status_code;

  if (!res.ok) {
    throw new VoiceServiceError(
      humanizeMiniMaxError(
        miniMaxCode,
        data.base_resp?.status_msg,
        "语音合成失败"
      ),
      miniMaxCode != null ? codeForMiniMax(miniMaxCode) : "SYNTHESIS_FAILED",
      { providerCode: miniMaxCode, httpStatus: res.status }
    );
  }

  assertBaseResp(data, "语音合成失败");

  const hex = data.data?.audio;
  if (!hex) {
    throw new VoiceServiceError("未返回合成音频", "SYNTHESIS_FAILED");
  }

  return hexToArrayBuffer(hex);
}

async function fetchAudioFromUrl(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new VoiceServiceError("下载试听音频失败", "SYNTHESIS_FAILED", {
      httpStatus: res.status,
    });
  }
  return await res.arrayBuffer();
}

/** MiniMax 国内：上传参考音频 → 快速复刻 → 合成 MP3 */
export async function cloneAndSynthesize(params: {
  apiKey?: string;
  groupId?: string;
  audio: Blob;
  fileName: string;
  text: string;
  voiceName?: string;
}): Promise<ArrayBuffer> {
  const { apiKey, groupId } = resolveCredentials({
    apiKey: params.apiKey,
    groupId: params.groupId,
  });

  let voiceId = params.voiceName?.trim().replace(/[^a-zA-Z0-9_-]/g, "") ?? "";
  if (voiceId.length < 8 || !/^[a-zA-Z]/.test(voiceId)) {
    if (voiceId && params.voiceName?.trim()) {
      throw new VoiceServiceError(
        "自定义音色 ID 需以字母开头且不少于 8 个字符（仅字母、数字、-、_）",
        "INVALID_VOICE_ID"
      );
    }
    voiceId = createVoiceId();
  }

  const fileId = await uploadCloneAudio(
    apiKey,
    groupId,
    params.audio,
    params.fileName
  );

  const cloneResult = await cloneVoice(
    apiKey,
    groupId,
    fileId,
    voiceId,
    params.text
  );

  if (cloneResult.demo_audio) {
    if (cloneResult.demo_audio.startsWith("http")) {
      return fetchAudioFromUrl(cloneResult.demo_audio);
    }
    return hexToArrayBuffer(cloneResult.demo_audio);
  }

  if (cloneResult.data?.audio) {
    return hexToArrayBuffer(cloneResult.data.audio);
  }

  return synthesizeSpeech(apiKey, groupId, voiceId, params.text);
}
