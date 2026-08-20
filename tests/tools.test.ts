import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BaseLinkerClient } from "../src/client.js";
import { allCategories } from "../src/categories/index.js";
import { createServer } from "../src/server.js";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("MCP tools", () => {
  let fetchFn: ReturnType<typeof vi.fn>;
  let mcpClient: Client;

  beforeEach(async () => {
    fetchFn = vi.fn();
    const apiClient = new BaseLinkerClient({
      token: "test-token",
      fetchFn: fetchFn as unknown as typeof fetch,
      limiter: { acquire: async () => {} },
    });
    const server = createServer(apiClient, allCategories);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    mcpClient = new Client({ name: "test-client", version: "1.0.0" });
    await Promise.all([server.connect(serverTransport), mcpClient.connect(clientTransport)]);
  });

  it("listToolsWhenCalledThenReturnsAllCategoryTools", async () => {
    const { tools } = await mcpClient.listTools();

    const toolNames = tools.map((tool) => tool.name).sort();
    expect(toolNames).toEqual(allCategories.map((category) => category.toolName).sort());
  });

  it("callToolGivenValidParametersWhenCalledThenDispatchesToApiMethod", async () => {
    fetchFn.mockResolvedValue(jsonResponse({ status: "SUCCESS", orders: [] }));

    const result = await mcpClient.callTool({
      name: "baselinker_orders",
      arguments: { method: "getOrders", parameters: { status_id: 5 } },
    });

    expect(result.isError).toBeFalsy();
    const body = new URLSearchParams(fetchFn.mock.calls[0][1].body);
    expect(body.get("method")).toBe("getOrders");
    expect(JSON.parse(body.get("parameters")!)).toEqual({ status_id: 5 });
  });

  it("callToolGivenMissingRequiredParameterWhenCalledThenReturnsValidationError", async () => {
    const result = await mcpClient.callTool({
      name: "baselinker_orders",
      arguments: { method: "getOrdersByEmail", parameters: {} },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("Invalid parameters for getOrdersByEmail");
    expect(text).toContain("email");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("callToolGivenUnknownExtraParameterWhenCalledThenPassesItThrough", async () => {
    fetchFn.mockResolvedValue(jsonResponse({ status: "SUCCESS" }));

    const result = await mcpClient.callTool({
      name: "baselinker_orders",
      arguments: {
        method: "getOrdersByEmail",
        parameters: { email: "a@b.com", some_future_param: 1 },
      },
    });

    expect(result.isError).toBeFalsy();
    const body = new URLSearchParams(fetchFn.mock.calls[0][1].body);
    expect(JSON.parse(body.get("parameters")!)).toEqual({
      email: "a@b.com",
      some_future_param: 1,
    });
  });

  it("callToolGivenApiErrorWhenCalledThenReturnsErrorResultWithCode", async () => {
    fetchFn.mockResolvedValue(
      jsonResponse({
        status: "ERROR",
        error_code: "ERROR_AUTH_TOKEN",
        error_message: "Invalid token",
      }),
    );

    const result = await mcpClient.callTool({
      name: "baselinker_orders",
      arguments: { method: "getOrders" },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("ERROR_AUTH_TOKEN");
    expect(text).toContain("Invalid token");
  });

  it("callToolGivenFileMethodWithoutSavePathWhenCalledThenReturnsEmbeddedResource", async () => {
    const base64Pdf = Buffer.from("%PDF-1.4 fake").toString("base64");
    fetchFn.mockResolvedValue(
      jsonResponse({ status: "SUCCESS", label: base64Pdf, extension: "pdf" }),
    );

    const result = await mcpClient.callTool({
      name: "baselinker_courier",
      arguments: {
        method: "getLabel",
        parameters: { courier_code: "dpd", package_id: 123 },
      },
    });

    expect(result.isError).toBeFalsy();
    const content = result.content as Array<Record<string, unknown>>;
    const resource = content.find((block) => block.type === "resource");
    expect(resource).toBeDefined();
    expect((resource!.resource as Record<string, unknown>).mimeType).toBe("application/pdf");
    expect((resource!.resource as Record<string, unknown>).blob).toBe(base64Pdf);
  });

  it("callToolGivenFileMethodWithSavePathWhenCalledThenStripsSyntheticParamFromApiCall", async () => {
    const base64Pdf = Buffer.from("%PDF-1.4 fake").toString("base64");
    fetchFn.mockResolvedValue(
      jsonResponse({ status: "SUCCESS", label: base64Pdf, extension: "pdf" }),
    );
    const savePath = `${process.env.TMPDIR ?? "/tmp"}/baselinker-mcp-test-label.pdf`;

    const result = await mcpClient.callTool({
      name: "baselinker_courier",
      arguments: {
        method: "getLabel",
        parameters: { courier_code: "dpd", package_id: 123, save_to_path: savePath },
      },
    });

    expect(result.isError).toBeFalsy();
    const body = new URLSearchParams(fetchFn.mock.calls[0][1].body);
    expect(JSON.parse(body.get("parameters")!)).toEqual({
      courier_code: "dpd",
      package_id: 123,
    });
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(JSON.parse(text)).toMatchObject({ saved_to: savePath, extension: "pdf" });
  });
});

describe("write gating", () => {
  async function connectClient(options: { allowWrites?: boolean }): Promise<{
    mcpClient: Client;
    fetchFn: ReturnType<typeof vi.fn>;
  }> {
    const fetchFn = vi.fn();
    const apiClient = new BaseLinkerClient({
      token: "test-token",
      fetchFn: fetchFn as unknown as typeof fetch,
      limiter: { acquire: async () => {} },
    });
    const server = createServer(apiClient, allCategories, options);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const mcpClient = new Client({ name: "test-client", version: "1.0.0" });
    await Promise.all([server.connect(serverTransport), mcpClient.connect(clientTransport)]);
    return { mcpClient, fetchFn };
  }

  it("listToolsWhenWritesDisabledThenToolsAreMarkedReadOnly", async () => {
    const { mcpClient } = await connectClient({ allowWrites: false });

    const { tools } = await mcpClient.listTools();

    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(true);
    }
  });

  it("callToolGivenWriteMethodWhenWritesDisabledThenRejects", async () => {
    const { mcpClient, fetchFn } = await connectClient({ allowWrites: false });

    const result = await mcpClient.callTool({
      name: "baselinker_orders",
      arguments: { method: "setOrderStatus", parameters: { order_id: 1, status_id: 2 } },
    });

    expect(result.isError).toBe(true);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("callToolGivenWriteMethodWhenWritesEnabledThenDispatchesToApiMethod", async () => {
    const { mcpClient, fetchFn } = await connectClient({ allowWrites: true });
    fetchFn.mockResolvedValue(jsonResponse({ status: "SUCCESS" }));

    const result = await mcpClient.callTool({
      name: "baselinker_orders",
      arguments: { method: "setOrderStatus", parameters: { order_id: 1, status_id: 2 } },
    });

    expect(result.isError).toBeFalsy();
    const body = new URLSearchParams(fetchFn.mock.calls[0][1].body);
    expect(body.get("method")).toBe("setOrderStatus");
    expect(JSON.parse(body.get("parameters")!)).toEqual({ order_id: 1, status_id: 2 });
  });

  it("listToolsWhenWritesEnabledThenToolsAreNotReadOnly", async () => {
    const { mcpClient } = await connectClient({ allowWrites: true });

    const { tools } = await mcpClient.listTools();

    for (const tool of tools) {
      expect(tool.annotations?.readOnlyHint, tool.name).toBe(false);
    }
  });
});

describe("MCP tools with local file writes disabled", () => {
  let fetchFn: ReturnType<typeof vi.fn>;
  let mcpClient: Client;

  beforeEach(async () => {
    fetchFn = vi.fn();
    const apiClient = new BaseLinkerClient({
      token: "test-token",
      fetchFn: fetchFn as unknown as typeof fetch,
      limiter: { acquire: async () => {} },
    });
    const server = createServer(apiClient, allCategories, { allowLocalFileWrites: false });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    mcpClient = new Client({ name: "test-client", version: "1.0.0" });
    await Promise.all([server.connect(serverTransport), mcpClient.connect(clientTransport)]);
  });

  it("callToolGivenSavePathWhenLocalFileWritesDisabledThenReturnsErrorWithoutCallingApi", async () => {
    const result = await mcpClient.callTool({
      name: "baselinker_courier",
      arguments: {
        method: "getLabel",
        parameters: { courier_code: "dpd", package_id: 123, save_to_path: "/tmp/label.pdf" },
      },
    });

    expect(result.isError).toBe(true);
    const text = (result.content as Array<{ type: string; text: string }>)[0].text;
    expect(text).toContain("save_to_path");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("callToolGivenNoSavePathWhenLocalFileWritesDisabledThenReturnsEmbeddedResource", async () => {
    const base64Pdf = Buffer.from("%PDF-1.4 fake").toString("base64");
    fetchFn.mockResolvedValue(
      jsonResponse({ status: "SUCCESS", label: base64Pdf, extension: "pdf" }),
    );

    const result = await mcpClient.callTool({
      name: "baselinker_courier",
      arguments: { method: "getLabel", parameters: { courier_code: "dpd", package_id: 123 } },
    });

    expect(result.isError).toBeFalsy();
    const content = result.content as Array<Record<string, unknown>>;
    expect(content.some((block) => block.type === "resource")).toBe(true);
  });
});
