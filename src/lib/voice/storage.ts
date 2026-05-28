export type VoiceProvider = "minimax" | "aliyun";

export const VOICE_CREDS_STORAGE = "tech-portfolio-voice-creds";

/** @deprecated */
export const MINIMAX_CREDS_STORAGE = "tech-portfolio-minimax-creds";

export type StoredVoiceCreds = {
  provider: VoiceProvider;
  minimax: { apiKey: string; groupId: string };
  aliyun: { apiKey: string };
};

const emptyCreds = (): StoredVoiceCreds => ({
  provider: "aliyun",
  minimax: { apiKey: "", groupId: "" },
  aliyun: { apiKey: "" },
});

export function loadStoredVoiceCreds(): StoredVoiceCreds {
  if (typeof window === "undefined") return emptyCreds();

  try {
    const raw = localStorage.getItem(VOICE_CREDS_STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredVoiceCreds>;
      return {
        provider: parsed.provider === "minimax" ? "minimax" : "aliyun",
        minimax: {
          apiKey: parsed.minimax?.apiKey ?? "",
          groupId: parsed.minimax?.groupId ?? "",
        },
        aliyun: { apiKey: parsed.aliyun?.apiKey ?? "" },
      };
    }

    const legacy = localStorage.getItem(MINIMAX_CREDS_STORAGE);
    if (legacy) {
      const parsed = JSON.parse(legacy) as { apiKey?: string; groupId?: string };
      return {
        provider: "minimax",
        minimax: {
          apiKey: parsed.apiKey ?? "",
          groupId: parsed.groupId ?? "",
        },
        aliyun: { apiKey: "" },
      };
    }

    const legacyEleven = localStorage.getItem("tech-portfolio-elevenlabs-api-key");
    if (legacyEleven) {
      return {
        provider: "minimax",
        minimax: { apiKey: legacyEleven, groupId: "" },
        aliyun: { apiKey: "" },
      };
    }
  } catch {
    /* ignore */
  }

  return emptyCreds();
}

export function saveStoredVoiceCreds(creds: StoredVoiceCreds) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VOICE_CREDS_STORAGE, JSON.stringify(creds));
    localStorage.removeItem(MINIMAX_CREDS_STORAGE);
    localStorage.removeItem("tech-portfolio-elevenlabs-api-key");
  } catch {
    /* ignore */
  }
}

export function clearStoredVoiceCreds() {
  saveStoredVoiceCreds(emptyCreds());
}

/** @deprecated 兼容旧导入 */
export function loadStoredMiniMaxCreds() {
  const c = loadStoredVoiceCreds();
  return c.minimax;
}

export function saveStoredMiniMaxCreds(creds: { apiKey: string; groupId: string }) {
  const all = loadStoredVoiceCreds();
  all.minimax = creds;
  saveStoredVoiceCreds(all);
}

export function clearStoredMiniMaxCreds() {
  const all = loadStoredVoiceCreds();
  all.minimax = { apiKey: "", groupId: "" };
  saveStoredVoiceCreds(all);
}

export function migrateLegacyElevenLabsStorage() {
  if (typeof window === "undefined") return;
  loadStoredVoiceCreds();
}
