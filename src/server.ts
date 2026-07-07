import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BaseLinkerClient } from "./client.js";
import { BaseLinkerApiError, BaseLinkerHttpError } from "./errors.js";
import type { CategoryDef, MethodDef } from "./registry.js";
import { errorResult, jsonResult, SAVE_TO_PATH_PARAM } from "./result.js";

export interface ServerOptions {
  allowWrites?: boolean;
}

export function createServer(
  client: BaseLinkerClient,
  categories: CategoryDef[],
  options: ServerOptions = {},
): McpServer {
  const server = new McpServer({
    name: "baselinker-mcp",
    version: "0.1.0",
  });
  for (const category of categories) {
    registerCategoryTool(server, client, category, options);
  }
  return server;
}

function registerCategoryTool(
  server: McpServer,
  client: BaseLinkerClient,
  category: CategoryDef,
  options: ServerOptions,
): void {
  const enabledMethods = category.methods.filter(
    (method) => method.mode === "read" || options.allowWrites,
  );
  if (enabledMethods.length === 0) {
    return;
  }
  const methodNames = enabledMethods.map((method) => method.name) as [string, ...string[]];
  server.registerTool(
    category.toolName,
    {
      title: category.title,
      description: buildDescription(category, enabledMethods),
      inputSchema: {
        method: z.enum(methodNames).describe("BaseLinker API method to call"),
        parameters: z
          .record(z.unknown())
          .optional()
          .describe("Method-specific parameters (see tool description for each method)"),
      },
      annotations: { readOnlyHint: !options.allowWrites },
    },
    async ({ method, parameters }) => {
      const methodDef = enabledMethods.find((def) => def.name === method);
      if (methodDef === undefined) {
        return errorResult(`Unknown method: ${method}`);
      }
      return executeMethod(client, methodDef, parameters ?? {});
    },
  );
}

async function executeMethod(
  client: BaseLinkerClient,
  methodDef: MethodDef,
  parameters: Record<string, unknown>,
) {
  const parsed = methodDef.schema.safeParse(parameters);
  if (!parsed.success) {
    return errorResult(
      `Invalid parameters for ${methodDef.name}: ${formatZodIssues(parsed.error)}`,
    );
  }
  const apiParams = stripSyntheticParams(parsed.data);
  try {
    const raw = await client.call(methodDef.name, apiParams);
    if (methodDef.transformResult !== undefined) {
      return await methodDef.transformResult(raw, parsed.data);
    }
    return jsonResult(raw);
  } catch (error) {
    return errorResult(formatError(error));
  }
}

function stripSyntheticParams(params: Record<string, unknown>): Record<string, unknown> {
  const { [SAVE_TO_PATH_PARAM]: _saveToPath, ...apiParams } = params;
  return apiParams;
}

function buildDescription(category: CategoryDef, methods: MethodDef[]): string {
  const methodLines = methods
    .map((method) => `- ${method.name}: ${method.description}`)
    .join("\n");
  return `${category.description}\n\nResponses can be large — use filters and pagination parameters where available.\n\nAvailable methods:\n${methodLines}`;
}

function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

function formatError(error: unknown): string {
  if (error instanceof BaseLinkerApiError) {
    return `BaseLinker API error [${error.errorCode}]: ${error.errorMessage}`;
  }
  if (error instanceof BaseLinkerHttpError) {
    return `BaseLinker HTTP error: status ${error.status}`;
  }
  if (error instanceof Error) {
    return `Request failed: ${error.message}`;
  }
  return `Request failed: ${String(error)}`;
}
