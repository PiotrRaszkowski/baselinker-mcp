#!/usr/bin/env node
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { BaseLinkerClient } from "./client.js";
import { allCategories } from "./categories/index.js";
import { createServer } from "./server.js";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(packageRoot, ".env"), quiet: true });
dotenv.config({ quiet: true });

const token = process.env.BASELINKER_API_TOKEN;
if (token === undefined || token.length === 0) {
  console.error(
    "Missing BASELINKER_API_TOKEN. Set it as an environment variable or in a .env file.",
  );
  process.exit(1);
}

const allowWrites = process.env.BASELINKER_ALLOW_WRITES === "true";
const client = new BaseLinkerClient({ token });
const server = createServer(client, allCategories, { allowWrites });

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("baselinker-mcp server running on stdio");
