export class RembgServiceError extends Error {
  readonly code: string;
  readonly httpStatus?: number;

  constructor(message: string, code = "REMBG_ERROR", httpStatus?: number) {
    super(message);
    this.name = "RembgServiceError";
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

export function rembgErrorToHttpStatus(err: RembgServiceError): number {
  if (err.httpStatus && err.httpStatus >= 400 && err.httpStatus < 600) {
    return err.httpStatus;
  }
  switch (err.code) {
    case "MISSING_SERVICE":
      return 503;
    case "INVALID_INPUT":
      return 400;
    case "TIMEOUT":
      return 504;
    default:
      return 500;
  }
}
