#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import dotenv from "dotenv";
import { BaseLinkerClient } from "./client.js";
import { allCategories } from "./categories/index.js";
import { KeycloakTokenVerifier } from "./auth/keycloak-verifier.js";
import { type AppConfig, ConfigError, parseConfig } from "./config.js";
import { createHttpApp } from "./http.js";
import { createServer } from "./server.js";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(packageRoot, ".env"), quiet: true });
dotenv.config({ quiet: true });

const config = readConfig();
const client = new BaseLinkerClient({ token: config.token });
const createMcpServer = (): McpServer =>
  createServer(client, allCategories, {
    allowWrites: config.allowWrites,
    allowLocalFileWrites: config.transport === "stdio",
  });

if (config.transport === "http") {
  startHttpServer(config, createMcpServer);
} else {
  await startStdioServer(createMcpServer);
}

function readConfig(): AppConfig {
  try {
    return parseConfig(process.argv.slice(2), process.env);
  } catch (error) {
    console.error(error instanceof ConfigError ? error.message : error);
    process.exit(1);
  }
}

async function startStdioServer(create: () => McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await create().connect(transport);
  console.error("baselinker-mcp server running on stdio");
}

function startHttpServer(appConfig: AppConfig, create: () => McpServer): void {
  const verifier =
    appConfig.auth === undefined
      ? undefined
      : new KeycloakTokenVerifier({
          realmUrl: appConfig.auth.realmUrl,
          audience: appConfig.auth.audience,
        });
  const app = createHttpApp({ config: appConfig, createMcpServer: create, verifier });
  const { host, port, path } = appConfig.http;
  app.listen(port, host, () => {
    console.error(`baselinker-mcp server running on http://${host}:${port}${path}`);
    console.error(
      appConfig.auth === undefined
        ? "WARNING: authentication is disabled — do not expose this endpoint to the internet"
        : `Authenticating against ${appConfig.auth.realmUrl}`,
    );
    console.error(`Write methods ${appConfig.allowWrites ? "ENABLED" : "disabled"}`);
  });
}
