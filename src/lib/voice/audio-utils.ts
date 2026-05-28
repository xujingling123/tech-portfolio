/** 阿里云百炼声音复刻音频时长要求（秒） */
export const ALIYUN_AUDIO_MIN_SEC = 5;
export const ALIYUN_AUDIO_MAX_SEC = 60;
/** 超长音频自动截取长度（推荐复刻片段） */
export const ALIYUN_AUDIO_TRIM_SEC = 30;

export const MINIMAX_AUDIO_MIN_SEC = 10;
export const MINIMAX_AUDIO_MAX_SEC = 300;

export function formatDuration(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "未知";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`;
}

/** 用浏览器读取本地音频时长 */
export function getAudioDurationSec(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const d = audio.duration;
      if (!Number.isFinite(d) || d <= 0) {
        reject(new Error("无法读取音频时长，请换 MP3/WAV 格式重试"));
        return;
      }
      resolve(d);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("无法读取音频文件，请确认格式正确"));
    };
    audio.src = url;
  });
}

function encodeWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

/**
 * 将音频截取为前 maxSeconds 秒并转为 WAV，供阿里云复刻（避免超过 60 秒限制）
 */
export async function trimAudioForAliyun(file: File): Promise<{
  file: File;
  originalDuration: number;
  trimmedDuration: number;
  wasTrimmed: boolean;
}> {
  const originalDuration = await getAudioDurationSec(file);

  if (originalDuration <= ALIYUN_AUDIO_MAX_SEC) {
    return {
      file,
      originalDuration,
      trimmedDuration: originalDuration,
      wasTrimmed: false,
    };
  }

  const maxSeconds = ALIYUN_AUDIO_TRIM_SEC;
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();
  try {
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const maxFrames = Math.min(
      decoded.length,
      Math.floor(maxSeconds * decoded.sampleRate)
    );
    const trimmed = audioContext.createBuffer(
      decoded.numberOfChannels,
      maxFrames,
      decoded.sampleRate
    );
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      trimmed
        .getChannelData(ch)
        .set(decoded.getChannelData(ch).subarray(0, maxFrames));
    }
    const wavBlob = encodeWav(trimmed);
    const baseName = file.name.replace(/\.[^.]+$/, "") || "sample";
    const outFile = new File([wavBlob], `${baseName}-trim.wav`, {
      type: "audio/wav",
    });
    return {
      file: outFile,
      originalDuration,
      trimmedDuration: maxFrames / decoded.sampleRate,
      wasTrimmed: true,
    };
  } finally {
    await audioContext.close();
  }
}

export function validateAliyunDuration(sec: number): string | null {
  if (sec < ALIYUN_AUDIO_MIN_SEC) {
    return `参考音频过短（约 ${formatDuration(sec)}），阿里云要求至少 ${ALIYUN_AUDIO_MIN_SEC} 秒清晰人声。`;
  }
  if (sec > ALIYUN_AUDIO_MAX_SEC) {
    return `参考音频过长（约 ${formatDuration(sec)}），阿里云要求不超过 ${ALIYUN_AUDIO_MAX_SEC} 秒。将自动截取前 ${ALIYUN_AUDIO_TRIM_SEC} 秒。`;
  }
  return null;
}
