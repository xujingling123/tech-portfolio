type VoiceErrorOpts = {
  providerCode?: number;
  httpStatus?: number;
};

export class VoiceServiceError extends Error {
  readonly providerCode?: number;
  readonly httpStatus?: number;

  constructor(
    message: string,
    public readonly code: string,
    opts?: VoiceErrorOpts
  ) {
    super(message);
    this.name = "VoiceServiceError";
    this.providerCode = opts?.providerCode;
    this.httpStatus = opts?.httpStatus;
  }
}

/** 将业务错误映射为返回给前端的 HTTP 状态 */
export function voiceErrorToHttpStatus(err: VoiceServiceError): number {
  switch (err.code) {
    case "MISSING_CREDENTIALS":
    case "INVALID_VOICE_ID":
    case "INVALID_AUDIO":
    case "INVALID_INPUT":
      return 400;
    case "CLONE_FORBIDDEN":
      return 403;
    default:
      break;
  }

  const c = err.providerCode;
  if (c === 2038) return 403;
  if (c === 2037 || c === 2039 || c === 2013) return 400;
  if (c === 1004) return 401;
  if (c === 1008) return 402;
  if (c === 1002) return 429;

  const http = err.httpStatus;
  if (http != null && http >= 400 && http < 600) return http;

  return 502;
}
