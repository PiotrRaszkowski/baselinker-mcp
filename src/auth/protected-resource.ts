import { Router } from "express";
import type { AuthConfig } from "../config.js";

const WELL_KNOWN_PREFIX = "/.well-known/oauth-protected-resource";

export function resourceUrl(auth: AuthConfig, mcpPath: string): string {
  return `${auth.resourceUrl}${mcpPath}`;
}

export function resourceMetadataUrl(auth: AuthConfig, mcpPath: string): string {
  return `${auth.resourceUrl}${WELL_KNOWN_PREFIX}${mcpPath}`;
}

export function protectedResourceRouter(auth: AuthConfig, mcpPath: string): Router {
  const metadata = {
    resource: resourceUrl(auth, mcpPath),
    authorization_servers: [auth.realmUrl],
    scopes_supported: auth.requiredScopes,
    bearer_methods_supported: ["header"],
    resource_name: "BaseLinker MCP",
  };
  const router = Router();
  for (const path of [WELL_KNOWN_PREFIX, `${WELL_KNOWN_PREFIX}${mcpPath}`]) {
    router.get(path, (_request, response) => {
      response.json(metadata);
    });
  }
  return router;
}
