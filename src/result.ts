import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname } from "node:path";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { MethodDef } from "./registry.js";

const MIME_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  gif: "image/gif",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  html: "text/html",
  epl: "text/plain",
  zpl: "text/plain",
  dpl: "text/plain",
  txt: "text/plain",
};

export function jsonResult(raw: Record<string, unknown>): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(raw, null, 2) }],
  };
}

export function errorResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

export const SAVE_TO_PATH_PARAM = "save_to_path";

export function fileTransform(
  fieldName: string,
  defaultExtension = "",
): MethodDef["transformResult"] {
  return async (raw, params) => {
    const base64 = extractBase64(raw, fieldName);
    if (base64 === undefined) {
      return jsonResult(raw);
    }
    const extension = String(raw.extension ?? defaultExtension).replace(/^\./, "");
    const savePath = params[SAVE_TO_PATH_PARAM];
    if (typeof savePath === "string" && savePath.length > 0) {
      return saveToFile(base64, savePath, extension);
    }
    return embeddedResource(base64, extension, fieldName);
  };
}

export function fileArrayTransform(
  arrayField: string,
  itemField: string,
): MethodDef["transformResult"] {
  return async (raw, params) => {
    const items = raw[arrayField];
    if (!Array.isArray(items) || items.length === 0) {
      return jsonResult(raw);
    }
    const savePath = params[SAVE_TO_PATH_PARAM];
    const results: CallToolResult["content"] = [];
    for (const [index, item] of items.entries()) {
      const entry = item as Record<string, unknown>;
      const base64 = extractBase64(entry, itemField);
      if (base64 === undefined) {
        continue;
      }
      const extension = String(entry.extension ?? "").replace(/^\./, "");
      if (typeof savePath === "string" && savePath.length > 0) {
        const itemPath = items.length === 1 ? savePath : indexedPath(savePath, index);
        const saved = await saveToFile(base64, itemPath, extension);
        results.push(...saved.content);
      } else {
        results.push(...embeddedResource(base64, extension, `${arrayField}-${index}`).content);
      }
    }
    if (results.length === 0) {
      return jsonResult(raw);
    }
    return { content: results };
  };
}

function indexedPath(savePath: string, index: number): string {
  const extension = extname(savePath);
  const base = extension === "" ? savePath : savePath.slice(0, -extension.length);
  return `${base}-${index + 1}${extension}`;
}

function extractBase64(raw: Record<string, unknown>, fieldName: string): string | undefined {
  const value = raw[fieldName];
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }
  const dataUriMatch = value.match(/^data:[^;]+;base64,(.*)$/s);
  return dataUriMatch ? dataUriMatch[1] : value;
}

async function saveToFile(
  base64: string,
  savePath: string,
  extension: string,
): Promise<CallToolResult> {
  const targetPath =
    extname(savePath) === "" && extension !== "" ? `${savePath}.${extension}` : savePath;
  const bytes = Buffer.from(base64, "base64");
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, bytes);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({ saved_to: targetPath, extension, bytes: bytes.length }),
      },
    ],
  };
}

function embeddedResource(base64: string, extension: string, fieldName: string): CallToolResult {
  const mimeType = MIME_TYPES[extension.toLowerCase()] ?? "application/octet-stream";
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          extension,
          mime_type: mimeType,
          bytes: Buffer.from(base64, "base64").length,
          note: `File content attached as embedded resource. Pass "${SAVE_TO_PATH_PARAM}" to save it to disk instead.`,
        }),
      },
      {
        type: "resource",
        resource: {
          uri: `baselinker://${fieldName}.${extension || "bin"}`,
          mimeType,
          blob: base64,
        },
      },
    ],
  };
}
