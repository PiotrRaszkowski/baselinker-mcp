import { BaseLinkerApiError, BaseLinkerHttpError } from "./errors.js";
import { RateLimiter, SlidingWindowRateLimiter } from "./rate-limiter.js";

const DEFAULT_BASE_URL = "https://api.baselinker.com/connector.php";
const DEFAULT_TIMEOUT_MS = 30_000;

export interface BaseLinkerClientOptions {
  token: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
  limiter?: RateLimiter;
}

export class BaseLinkerClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;
  private readonly limiter: RateLimiter;

  constructor(options: BaseLinkerClientOptions) {
    this.token = options.token;
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.fetchFn = options.fetchFn ?? fetch;
    this.limiter = options.limiter ?? new SlidingWindowRateLimiter();
  }

  async call<T = Record<string, unknown>>(
    method: string,
    parameters: Record<string, unknown> = {},
  ): Promise<T> {
    await this.limiter.acquire();
    const body = new URLSearchParams({
      method,
      parameters: JSON.stringify(parameters),
    });
    const response = await this.fetchFn(this.baseUrl, {
      method: "POST",
      headers: {
        "X-BLToken": this.token,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!response.ok) {
      throw new BaseLinkerHttpError(response.status, await response.text());
    }
    const data = (await response.json()) as Record<string, unknown>;
    if (data.status === "ERROR") {
      throw new BaseLinkerApiError(
        String(data.error_code ?? "UNKNOWN"),
        String(data.error_message ?? "Unknown error"),
        method,
      );
    }
    return data as T;
  }
}
