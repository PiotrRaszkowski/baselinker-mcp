import express, { type Express, type Request, type Response } from "express";
import { requireBearerAuth } from "@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { AppConfig } from "./config.js";
import { protectedResourceRouter, resourceMetadataUrl } from "./auth/protected-resource.js";

const MAX_BODY_SIZE = "4mb";
const METHOD_NOT_ALLOWED = -32000;
const INTERNAL_ERROR = -32603;

export interface HttpAppDependencies {
  config: AppConfig;
  createMcpServer: () => McpServer;
  verifier?: OAuthTokenVerifier;
}

export function createHttpApp({ config, createMcpServer, verifier }: HttpAppDependencies): Express {
  const app = express();
  app.disable("x-powered-by");
  app.get("/healthz", (_request, response) => {
    response.json({ status: "ok" });
  });
  if (config.auth !== undefined) {
    app.use(protectedResourceRouter(config.auth, config.http.path));
  }
  const guards = buildGuards(config, verifier);
  app.post(
    config.http.path,
    ...guards,
    express.json({ limit: MAX_BODY_SIZE }),
    (request, response) => handleMcpRequest(config, createMcpServer, request, response),
  );
  app.get(config.http.path, ...guards, rejectUnsupportedMethod);
  app.delete(config.http.path, ...guards, rejectUnsupportedMethod);
  return app;
}

function buildGuards(config: AppConfig, verifier?: OAuthTokenVerifier): express.RequestHandler[] {
  if (config.auth === undefined || verifier === undefined) {
    return [];
  }
  return [
    requireBearerAuth({
      verifier,
      requiredScopes: config.auth.requiredScopes,
      resourceMetadataUrl: resourceMetadataUrl(config.auth, config.http.path),
    }),
  ];
}

async function handleMcpRequest(
  config: AppConfig,
  createMcpServer: () => McpServer,
  request: Request,
  response: Response,
): Promise<void> {
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    ...dnsRebindingProtection(config.http),
  });
  response.on("close", () => {
    void transport.close();
    void server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(request, response, request.body);
  } catch (error) {
    console.error("Failed to handle MCP request:", error);
    if (!response.headersSent) {
      response.status(500).json(jsonRpcError(INTERNAL_ERROR, "Internal server error"));
    }
  }
}

function dnsRebindingProtection(http: AppConfig["http"]) {
  if (http.allowedHosts.length === 0 && http.allowedOrigins.length === 0) {
    return {};
  }
  return {
    enableDnsRebindingProtection: true,
    allowedHosts: http.allowedHosts,
    allowedOrigins: http.allowedOrigins,
  };
}

function rejectUnsupportedMethod(_request: Request, response: Response): void {
  response
    .status(405)
    .json(jsonRpcError(METHOD_NOT_ALLOWED, "Method not allowed: this endpoint is stateless"));
}

function jsonRpcError(code: number, message: string) {
  return { jsonrpc: "2.0", error: { code, message }, id: null };
}
