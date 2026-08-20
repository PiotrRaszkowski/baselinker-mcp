import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { AppConfig } from "../src/config.js";
import { createHttpApp } from "../src/http.js";

const REALM_URL = "https://keycloak.example.com/realms/mcpservers";
const BASE_URL = "https://baselinker-mcp.example.com";

const authenticatedConfig: AppConfig = {
  transport: "http",
  token: "bl-token",
  allowWrites: false,
  http: { host: "0.0.0.0", port: 8000, path: "/mcp", allowedHosts: [], allowedOrigins: [] },
  auth: {
    realmUrl: REALM_URL,
    resourceUrl: BASE_URL,
    audience: [],
    requiredScopes: ["openid"],
  },
};

const validAuthInfo: AuthInfo = {
  token: "valid",
  clientId: "claude-connector",
  scopes: ["openid"],
  expiresAt: Math.floor(Date.now() / 1000) + 300,
};

function createMcpServer(): McpServer {
  return new McpServer({ name: "baselinker-mcp", version: "0.1.0" });
}

function buildApp(config: AppConfig, verifyAccessToken = vi.fn().mockResolvedValue(validAuthInfo)) {
  return createHttpApp({ config, createMcpServer, verifier: { verifyAccessToken } });
}

const initializeRequest = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-06-18",
    capabilities: {},
    clientInfo: { name: "test", version: "0" },
  },
};

describe("createHttpApp", () => {
  it("healthzGivenAnyConfigurationWhenCalledThenRespondsWithoutAuthentication", async () => {
    const response = await request(buildApp(authenticatedConfig)).get("/healthz");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("protectedResourceMetadataGivenAuthConfiguredWhenFetchedThenAdvertisesKeycloakRealm", async () => {
    const response = await request(buildApp(authenticatedConfig)).get(
      "/.well-known/oauth-protected-resource/mcp",
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      resource: `${BASE_URL}/mcp`,
      authorization_servers: [REALM_URL],
      scopes_supported: ["openid"],
      bearer_methods_supported: ["header"],
      resource_name: "BaseLinker MCP",
    });
  });

  it("protectedResourceMetadataGivenAuthConfiguredWhenFetchedAtRootWellKnownThenReturnsSameDocument", async () => {
    const response = await request(buildApp(authenticatedConfig)).get(
      "/.well-known/oauth-protected-resource",
    );

    expect(response.status).toBe(200);
    expect(response.body.resource).toBe(`${BASE_URL}/mcp`);
  });

  it("protectedResourceMetadataGivenAuthDisabledWhenFetchedThenNotFound", async () => {
    const config: AppConfig = { ...authenticatedConfig, auth: undefined };

    const response = await request(createHttpApp({ config, createMcpServer })).get(
      "/.well-known/oauth-protected-resource",
    );

    expect(response.status).toBe(404);
  });

  it("mcpEndpointGivenNoAuthorizationHeaderWhenPostedThenReturns401WithResourceMetadataHint", async () => {
    const response = await request(buildApp(authenticatedConfig))
      .post("/mcp")
      .send(initializeRequest);

    expect(response.status).toBe(401);
    expect(response.headers["www-authenticate"]).toContain(
      `resource_metadata="${BASE_URL}/.well-known/oauth-protected-resource/mcp"`,
    );
  });

  it("mcpEndpointGivenTokenWithoutRequiredScopeWhenPostedThenReturns403", async () => {
    const verifyAccessToken = vi.fn().mockResolvedValue({ ...validAuthInfo, scopes: ["profile"] });

    const response = await request(buildApp(authenticatedConfig, verifyAccessToken))
      .post("/mcp")
      .set("Authorization", "Bearer token")
      .send(initializeRequest);

    expect(response.status).toBe(403);
  });

  it("mcpEndpointGivenValidTokenWhenInitializeIsPostedThenReturnsServerCapabilities", async () => {
    const response = await request(buildApp(authenticatedConfig))
      .post("/mcp")
      .set("Authorization", "Bearer token")
      .set("Accept", "application/json, text/event-stream")
      .send(initializeRequest);

    expect(response.status).toBe(200);
    expect(response.text).toContain('"serverInfo"');
    expect(response.text).toContain("baselinker-mcp");
  });

  it("mcpEndpointGivenValidTokenWhenGetIsRequestedThenReturns405", async () => {
    const response = await request(buildApp(authenticatedConfig))
      .get("/mcp")
      .set("Authorization", "Bearer token");

    expect(response.status).toBe(405);
    expect(response.body.error.message).toContain("stateless");
  });

  it("mcpEndpointGivenAllowedHostsConfiguredWhenHostHeaderMismatchesThenRejectsRequest", async () => {
    const config: AppConfig = {
      ...authenticatedConfig,
      http: { ...authenticatedConfig.http, allowedHosts: ["mcp.example.com"] },
    };

    const response = await request(buildApp(config))
      .post("/mcp")
      .set("Authorization", "Bearer token")
      .set("Accept", "application/json, text/event-stream")
      .send(initializeRequest);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toContain("Invalid Host header");
  });

  it("mcpEndpointGivenAuthDisabledWhenPostedWithoutTokenThenAcceptsRequest", async () => {
    const config: AppConfig = { ...authenticatedConfig, auth: undefined };

    const response = await request(createHttpApp({ config, createMcpServer }))
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .send(initializeRequest);

    expect(response.status).toBe(200);
  });

  it("mcpEndpointGivenCustomPathWhenConfiguredThenServesThatPathOnly", async () => {
    const config: AppConfig = {
      ...authenticatedConfig,
      http: { ...authenticatedConfig.http, path: "/secret/mcp" },
    };
    const app = buildApp(config);

    const onCustomPath = await request(app)
      .post("/secret/mcp")
      .set("Authorization", "Bearer token")
      .set("Accept", "application/json, text/event-stream")
      .send(initializeRequest);
    const onDefaultPath = await request(app).post("/mcp").send(initializeRequest);

    expect(onCustomPath.status).toBe(200);
    expect(onDefaultPath.status).toBe(404);
  });
});
