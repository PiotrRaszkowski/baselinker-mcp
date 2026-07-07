export interface RateLimiter {
  acquire(): Promise<void>;
}

export class SlidingWindowRateLimiter implements RateLimiter {
  private readonly timestamps: number[] = [];

  constructor(
    private readonly maxRequests = 100,
    private readonly windowMs = 60_000,
    private readonly now: () => number = Date.now,
    private readonly sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {}

  async acquire(): Promise<void> {
    for (;;) {
      const current = this.now();
      this.evictExpired(current);
      if (this.timestamps.length < this.maxRequests) {
        this.timestamps.push(current);
        return;
      }
      const waitMs = this.timestamps[0] + this.windowMs - current;
      await this.sleep(Math.max(waitMs, 1));
    }
  }

  private evictExpired(current: number): void {
    while (this.timestamps.length > 0 && this.timestamps[0] <= current - this.windowMs) {
      this.timestamps.shift();
    }
  }
}
