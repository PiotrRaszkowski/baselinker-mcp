export class BaseLinkerApiError extends Error {
  constructor(
    readonly errorCode: string,
    readonly errorMessage: string,
    readonly method: string,
  ) {
    super(`BaseLinker API error for ${method}: [${errorCode}] ${errorMessage}`);
    this.name = "BaseLinkerApiError";
  }
}

export class BaseLinkerHttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`BaseLinker HTTP error: status ${status}`);
    this.name = "BaseLinkerHttpError";
  }
}
