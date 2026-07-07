import { describe, expect, it, vi } from "vitest";
import { BaseLinkerClient } from "../src/client.js";
import { BaseLinkerHttpError } from "../src/errors.js";

const noopLimiter = { acquire: async () => {} };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("BaseLinkerClient", () => {
  it("callGivenMethodAndParametersWhenSuccessThenSendsFormEncodedRequestWithTokenHeader", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ status: "SUCCESS", orders: [] }));
    const client = new BaseLinkerClient({
      token: "test-token",
      fetchFn,
      limiter: noopLimiter,
    });

    const result = await client.call("getOrders", { order_id: 123 });

    expect(result).toEqual({ status: "SUCCESS", orders: [] });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("https://api.baselinker.com/connector.php");
    expect(init.method).toBe("POST");
    expect(init.headers["X-BLToken"]).toBe("test-token");
    expect(init.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    const params = new URLSearchParams(init.body);
    expect(params.get("method")).toBe("getOrders");
    expect(JSON.parse(params.get("parameters")!)).toEqual({ order_id: 123 });
  });

  it("callGivenNoParametersWhenCalledThenSendsEmptyJsonObject", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ status: "SUCCESS" }));
    const client = new BaseLinkerClient({ token: "t", fetchFn, limiter: noopLimiter });

    await client.call("getInventories");

    const params = new URLSearchParams(fetchFn.mock.calls[0][1].body);
    expect(params.get("parameters")).toBe("{}");
  });

  it("callGivenApiErrorResponseWhenCalledThenThrowsBaseLinkerApiError", async () => {
    const fetchFn = vi.fn().mockImplementation(async () =>
      jsonResponse({
        status: "ERROR",
        error_code: "ERROR_AUTH_TOKEN",
        error_message: "Invalid token",
      }),
    );
    const client = new BaseLinkerClient({ token: "bad", fetchFn, limiter: noopLimiter });

    const call = client.call("getOrders");

    await expect(call).rejects.toMatchObject({
      name: "BaseLinkerApiError",
      errorCode: "ERROR_AUTH_TOKEN",
      errorMessage: "Invalid token",
      method: "getOrders",
    });
  });

  it("callGivenHttpErrorStatusWhenCalledThenThrowsBaseLinkerHttpError", async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response("Server error", { status: 500 }));
    const client = new BaseLinkerClient({ token: "t", fetchFn, limiter: noopLimiter });

    const call = client.call("getOrders");

    await expect(call).rejects.toThrow(BaseLinkerHttpError);
  });

  it("callGivenCustomBaseUrlWhenCalledThenUsesCustomUrl", async () => {
    const fetchFn = vi.fn().mockResolvedValue(jsonResponse({ status: "SUCCESS" }));
    const client = new BaseLinkerClient({
      token: "t",
      baseUrl: "https://example.com/api",
      fetchFn,
      limiter: noopLimiter,
    });

    await client.call("getOrders");

    expect(fetchFn.mock.calls[0][0]).toBe("https://example.com/api");
  });

  it("callWhenCalledThenAcquiresRateLimiterBeforeRequest", async () => {
    const order: string[] = [];
    const limiter = {
      acquire: async () => {
        order.push("acquire");
      },
    };
    const fetchFn = vi.fn().mockImplementation(async () => {
      order.push("fetch");
      return jsonResponse({ status: "SUCCESS" });
    });
    const client = new BaseLinkerClient({ token: "t", fetchFn, limiter });

    await client.call("getOrders");

    expect(order).toEqual(["acquire", "fetch"]);
  });
});
