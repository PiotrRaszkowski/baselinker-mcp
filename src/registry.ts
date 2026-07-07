import { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export type MethodMode = "read" | "write";

export interface MethodDef {
  name: string;
  description: string;
  schema: z.ZodType<Record<string, unknown>>;
  mode: MethodMode;
  transformResult?: (
    raw: Record<string, unknown>,
    params: Record<string, unknown>,
  ) => Promise<CallToolResult> | CallToolResult;
}

export interface CategoryDef {
  toolName: string;
  title: string;
  description: string;
  methods: MethodDef[];
}

export const emptySchema = z.object({}).passthrough();
