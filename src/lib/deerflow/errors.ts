export class DeerFlowServiceError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status = 502
  ) {
    super(message);
    this.name = "DeerFlowServiceError";
  }
}

export function deerflowErrorToHttpStatus(err: unknown): number {
  if (err instanceof DeerFlowServiceError) return err.status;
  return 500;
}
