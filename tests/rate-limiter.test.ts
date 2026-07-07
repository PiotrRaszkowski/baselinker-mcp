import { describe, expect, it } from "vitest";
import { SlidingWindowRateLimiter } from "../src/rate-limiter.js";

function createLimiter(maxRequests: number, windowMs: number) {
  let currentTime = 0;
  const sleeps: number[] = [];
  const limiter = new SlidingWindowRateLimiter(
    maxRequests,
    windowMs,
    () => currentTime,
    async (ms) => {
      sleeps.push(ms);
      currentTime += ms;
    },
  );
  return {
    limiter,
    sleeps,
    advance: (ms: number) => {
      currentTime += ms;
    },
  };
}

describe("SlidingWindowRateLimiter", () => {
  it("acquireGivenRequestsUnderLimitWhenAcquiredThenResolvesWithoutSleeping", async () => {
    const { limiter, sleeps } = createLimiter(3, 1000);

    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    expect(sleeps).toEqual([]);
  });

  it("acquireGivenLimitReachedWhenAcquiredThenWaitsUntilWindowSlides", async () => {
    const { limiter, sleeps } = createLimiter(2, 1000);

    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();

    expect(sleeps).toEqual([1000]);
  });

  it("acquireGivenOldRequestsOutsideWindowWhenAcquiredThenDoesNotWait", async () => {
    const { limiter, sleeps, advance } = createLimiter(2, 1000);

    await limiter.acquire();
    await limiter.acquire();
    advance(1001);
    await limiter.acquire();

    expect(sleeps).toEqual([]);
  });
});
