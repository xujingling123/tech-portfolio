"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatDuration,
  getAudioDurationSec,
  MINIMAX_AUDIO_MAX_SEC,
  MINIMAX_AUDIO_MIN_SEC,
  trimAudioForAliyun,
  validateAliyunDuration,
} from "@/lib/voice/audio-utils";
import {
  clearStoredVoiceCreds,
  loadStoredVoiceCreds,
  migrateLegacyElevenLabsStorage,
  saveStoredVoiceCreds,
  type VoiceProvider,
} from "@/lib/voice/storage";

const MAX_TEXT = 2000;

export function VoiceCloneTool() {
  const [provider, setProvider] = useState<VoiceProvider>("aliyun");
  const [minimaxKey, setMinimaxKey] = useState("");
  const [groupId, setGroupId] = useState("");
  const [aliyunKey, setAliyunKey] = useState("");
  const [rememberCreds, setRememberCreds] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioHint, setAudioHint] = useState<string | null>(null);
  const [audioDurationSec, setAudioDurationSec] = useState<number | null>(null);
  const [audioProcessing, setAudioProcessing] = useState(false);
  const [text, setText] = useState("");
  const [voiceName, setVoiceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultExt, setResultExt] = useState("mp3");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const credsHydrated = useRef(false);
  const prevProviderRef = useRef<VoiceProvider>(provider);

  useEffect(() => {
    migrateLegacyElevenLabsStorage();
    const stored = loadStoredVoiceCreds();
    setProvider(stored.provider);
    setMinimaxKey(stored.minimax.apiKey);
    setGroupId(stored.minimax.groupId);
    setAliyunKey(stored.aliyun.apiKey);
    if (
      stored.minimax.apiKey ||
      stored.minimax.groupId ||
      stored.aliyun.apiKey
    ) {
      setRememberCreds(true);
    }
    credsHydrated.current = true;
  }, []);

  useEffect(() => {
    if (!credsHydrated.current) return;
    if (rememberCreds) {
      saveStoredVoiceCreds({
        provider,
        minimax: { apiKey: minimaxKey.trim(), groupId: groupId.trim() },
        aliyun: { apiKey: aliyunKey.trim() },
      });
    } else {
      clearStoredVoiceCreds();
    }
  }, [provider, minimaxKey, groupId, aliyunKey, rememberCreds]);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const credsReady =
    provider === "aliyun"
      ? Boolean(aliyunKey.trim())
      : Boolean(minimaxKey.trim() && groupId.trim());

  const analyzeAudioFile = async (
    file: File,
    forProvider: VoiceProvider
  ): Promise<File | null> => {
    const duration = await getAudioDurationSec(file);
    setAudioDurationSec(duration);
    setError(null);
    setAudioHint(null);

    if (forProvider === "aliyun") {
      const warn = validateAliyunDuration(duration);
      if (warn && duration <= 60) {
        setError(warn);
        return file;
      }
      if (duration > 60) {
        const trimmed = await trimAudioForAliyun(file);
        setAudioDurationSec(trimmed.trimmedDuration);
        setAudioHint(
          `原时长 ${formatDuration(trimmed.originalDuration)}，已自动截取前 ${formatDuration(trimmed.trimmedDuration)} 用于复刻（阿里云上限 60 秒）。`
        );
        return trimmed.file;
      }
      setAudioHint(`时长 ${formatDuration(duration)}，符合阿里云要求。`);
      return file;
    }

    if (duration < MINIMAX_AUDIO_MIN_SEC) {
      setError(
        `音频过短（${formatDuration(duration)}），MiniMax 要求至少 ${MINIMAX_AUDIO_MIN_SEC} 秒。`
      );
    } else if (duration > MINIMAX_AUDIO_MAX_SEC) {
      setError(
        `音频过长（${formatDuration(duration)}），MiniMax 要求不超过 ${Math.floor(MINIMAX_AUDIO_MAX_SEC / 60)} 分钟。`
      );
    } else {
      setAudioHint(`时长 ${formatDuration(duration)}。`);
    }
    return file;
  };

  useEffect(() => {
    if (prevProviderRef.current === provider) return;
    prevProviderRef.current = provider;
    if (!audioFile) return;

    void (async () => {
      setAudioProcessing(true);
      try {
        const processed = await analyzeAudioFile(audioFile, provider);
        if (processed && processed !== audioFile) {
          setAudioFile(processed);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "无法解析音频");
      } finally {
        setAudioProcessing(false);
      }
    })();
  }, [provider, audioFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setAudioFile(file ?? null);
    setAudioHint(null);
    setAudioDurationSec(null);
    setError(null);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }

    if (!file) return;

    void (async () => {
      setAudioProcessing(true);
      try {
        const processed = await analyzeAudioFile(file, provider);
        if (processed) setAudioFile(processed);
      } catch (err) {
        setError(err instanceof Error ? err.message : "无法解析音频");
        setAudioFile(null);
      } finally {
        setAudioProcessing(false);
      }
    })();
  };

  const handleClearCreds = () => {
    setMinimaxKey("");
    setGroupId("");
    setAliyunKey("");
    setRememberCreds(false);
    clearStoredVoiceCreds();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (provider === "aliyun") {
      if (!aliyunKey.trim()) {
        setError("请填写阿里云百炼 DashScope API Key");
        return;
      }
    } else {
      if (!minimaxKey.trim()) {
        setError("请填写 MiniMax API Key");
        return;
      }
      if (!groupId.trim()) {
        setError("请填写 MiniMax Group ID");
        return;
      }
    }

    if (!audioFile || audioProcessing) {
      setError(
        audioProcessing
          ? "正在分析音频，请稍候…"
          : provider === "aliyun"
            ? "请上传参考音频（5～60 秒，推荐 10～20 秒清晰人声）"
            : "请上传参考音频（10 秒～5 分钟清晰人声）"
      );
      return;
    }

    let fileForUpload = audioFile;
    if (provider === "aliyun") {
      if (audioDurationSec != null && audioDurationSec < 5) {
        setError("参考音频不足 5 秒，请换一段更长的清晰人声。");
        return;
      }
      if (audioDurationSec != null && audioDurationSec > 60) {
        const trimmed = await trimAudioForAliyun(audioFile);
        fileForUpload = trimmed.file;
        setAudioHint(
          `已截取前 ${formatDuration(trimmed.trimmedDuration)} 上传（原 ${formatDuration(trimmed.originalDuration)}）。`
        );
      }
    }
    if (!text.trim()) {
      setError("请填写要合成的文本内容");
      return;
    }

    setLoading(true);
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      setResultUrl(null);
    }

    try {
      const form = new FormData();
      form.append("provider", provider);
      form.append("audio", fileForUpload);
      form.append("text", text.trim());
      if (voiceName.trim()) form.append("voiceName", voiceName.trim());

      if (provider === "aliyun") {
        form.append("apiKey", aliyunKey.trim());
      } else {
        form.append("apiKey", minimaxKey.trim());
        form.append("groupId", groupId.trim());
      }

      const res = await fetch("/api/tools/voice/synthesize", {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          code?: string;
        };
        throw new Error(data.error || `合成失败（${res.status}）`);
      }

      const blob = await res.blob();
      const ext =
        blob.type.includes("wav") || blob.type.includes("wave")
          ? "wav"
          : "mp3";
      setResultExt(ext);
      setResultUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : "合成失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;
    const a = document.createElement("a");
    a.href = resultUrl;
    a.download = `${provider}-voice-${Date.now()}.${resultExt}`;
    a.click();
  };

  return (
    <form className="tool-stack" onSubmit={handleSubmit}>
      <div className="tool-alert tool-alert--info">
        <p className="text-sm text-subtle">
          <strong className="text-strong">推荐阿里云百炼</strong>
          ：仅需 DashScope API Key，支持 Base64 直传参考音频，无需 OSS 公网链接。
          也可切换 MiniMax（需 API Key + Group ID）。
        </p>
        <p className="mt-2 text-sm text-muted">
          参考音频建议 10～20 秒清晰人声，勿使用歌曲或带伴奏录音。凭证仅用于当次请求转发。
        </p>
      </div>

      <fieldset className="tool-provider-picker">
        <legend className="tool-label">服务商</legend>
        <div className="tool-provider-options">
          <label className="tool-provider-option">
            <input
              type="radio"
              name="voice-provider"
              value="aliyun"
              checked={provider === "aliyun"}
              onChange={() => {
                setProvider("aliyun");
                setError(null);
              }}
            />
            <span>
              <strong className="text-heading">阿里云百炼</strong>
              <span className="block text-xs text-muted">
                CosyVoice / Qwen 声音复刻 · 推荐
              </span>
            </span>
          </label>
          <label className="tool-provider-option">
            <input
              type="radio"
              name="voice-provider"
              value="minimax"
              checked={provider === "minimax"}
              onChange={() => {
                setProvider("minimax");
                setError(null);
              }}
            />
            <span>
              <strong className="text-heading">MiniMax 海螺</strong>
              <span className="block text-xs text-muted">
                需实名认证与 Group ID
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      {provider === "aliyun" ? (
        <div className="tool-field">
          <span className="tool-label">DashScope API Key</span>
          <div className="tool-input-row">
            <input
              type={showKey ? "text" : "password"}
              className="tool-input"
              value={aliyunKey}
              onChange={(e) => setAliyunKey(e.target.value)}
              placeholder="sk-xxx"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="btn-ghost tool-input-row-btn"
              onClick={() => setShowKey((v) => !v)}
            >
              {showKey ? "隐藏" : "显示"}
            </button>
          </div>
          <p className="tool-hint tool-hint--left">
            在{" "}
            <a
              href="https://bailian.console.aliyun.com/?apiKey=1#/api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
            >
              百炼控制台
            </a>{" "}
            创建 API Key，并开通语音合成/声音复刻相关模型。
          </p>
        </div>
      ) : (
        <>
          <div className="tool-form-grid tool-form-grid--2">
            <div className="tool-field">
              <span className="tool-label">MiniMax API Key</span>
              <div className="tool-input-row">
                <input
                  type={showKey ? "text" : "password"}
                  className="tool-input"
                  value={minimaxKey}
                  onChange={(e) => setMinimaxKey(e.target.value)}
                  placeholder="在开放平台创建的密钥"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="button"
                  className="btn-ghost tool-input-row-btn"
                  onClick={() => setShowKey((v) => !v)}
                >
                  {showKey ? "隐藏" : "显示"}
                </button>
              </div>
            </div>
            <label className="tool-field">
              <span className="tool-label">Group ID</span>
              <input
                type="text"
                inputMode="numeric"
                className="tool-input"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                placeholder="19 位 Group ID"
                autoComplete="off"
              />
            </label>
          </div>
          <p className="tool-hint tool-hint--left">
            <a
              href="https://platform.minimaxi.com/user-center/basic-information"
              target="_blank"
              rel="noopener noreferrer"
              className="link-accent"
            >
              MiniMax 开放平台
            </a>
            需完成实名认证；若报 2038 请重新创建 API Key。
          </p>
        </>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <label className="tool-checkbox">
          <input
            type="checkbox"
            checked={rememberCreds}
            onChange={(e) => setRememberCreds(e.target.checked)}
          />
          <span>在本浏览器记住凭证</span>
        </label>
        {(minimaxKey || groupId || aliyunKey) && (
          <button
            type="button"
            className="text-xs text-muted underline-offset-2 hover:text-accent hover:underline"
            onClick={handleClearCreds}
          >
            清除凭证
          </button>
        )}
      </div>

      <label className="tool-field">
        <span className="tool-label">参考音频（要复刻的声音）</span>
        <div
          className={`tool-upload${audioFile ? " tool-upload--filled" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.m4a"
            className="sr-only"
            onChange={onFileChange}
          />
          {audioFile ? (
            <p className="text-sm text-heading">
              已选择：<span className="font-medium">{audioFile.name}</span>
              <span className="text-muted">
                {" "}
                ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted">
              支持 MP3 / WAV / M4A，清晰人声，最大 10MB
            </p>
          )}
        </div>
        {audioProcessing && (
          <p className="tool-hint tool-hint--left">正在分析音频…</p>
        )}
        {audioHint && !audioProcessing && (
          <p className="tool-hint tool-hint--left">{audioHint}</p>
        )}
        {provider === "aliyun" && !audioProcessing && (
          <p className="tool-hint tool-hint--left">
            阿里云要求参考音频 5～60 秒清晰人声（推荐 10～20 秒）；超长文件会自动截取前 30 秒。
          </p>
        )}
      </label>

      <label className="tool-field">
        <span className="tool-label">合成文本</span>
        <textarea
          className="tool-textarea"
          rows={5}
          value={text}
          maxLength={MAX_TEXT}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入希望复刻声音朗读的内容…"
        />
        <span className="tool-hint">
          {text.length} / {MAX_TEXT} 字
        </span>
      </label>

      <label className="tool-field">
        <span className="tool-label">
          {provider === "aliyun" ? "音色名称前缀（可选）" : "自定义音色 ID（可选）"}
        </span>
        <input
          type="text"
          className="tool-input"
          value={voiceName}
          onChange={(e) => setVoiceName(e.target.value)}
          placeholder={
            provider === "aliyun"
              ? "仅字母数字与下划线，≤16 字符"
              : "字母开头，≥8 位，仅字母数字与 - _"
          }
        />
      </label>

      {error && <p className="tool-error">{error}</p>}

      <div className="tool-actions">
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !credsReady || audioProcessing}
        >
          {loading ? "合成中…" : "开始复刻并合成"}
        </button>
      </div>

      {loading && (
        <p className="text-sm text-muted">
          {provider === "aliyun"
            ? "正在调用阿里云百炼（DashScope），通常需 15～60 秒…"
            : "正在调用 MiniMax（api.minimaxi.com），通常需 10～60 秒…"}
        </p>
      )}

      {resultUrl && (
        <div className="tool-result glass-card p-5">
          <p className="text-sm font-medium text-heading">合成完成</p>
          <audio className="tool-audio-player mt-4 w-full" controls src={resultUrl} />
          <div className="tool-actions mt-4">
            <button type="button" className="btn-ghost" onClick={downloadResult}>
              下载音频
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
