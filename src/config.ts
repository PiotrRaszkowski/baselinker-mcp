export type TransportKind = "stdio" | "http";

export interface HttpConfig {
  host: string;
  port: number;
  path: string;
  allowedHosts: string[];
  allowedOrigins: string[];
}

export interface AuthConfig {
  realmUrl: string;
  resourceUrl: string;
  audience: string[];
  requiredScopes: string[];
}

export interface AppConfig {
  transport: TransportKind;
  token: string;
  allowWrites: boolean;
  http: HttpConfig;
  auth?: AuthConfig;
}

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 8000;
const DEFAULT_PATH = "/mcp";
const DEFAULT_REQUIRED_SCOPES = ["openid"];

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function parseConfig(argv: string[], env: NodeJS.ProcessEnv): AppConfig {
  const flags = parseFlags(argv);
  const transport = resolveTransport(flags.transport ?? env.BASELINKER_MCP_TRANSPORT);
  const config: AppConfig = {
    transport,
    token: requireToken(env),
    allowWrites: env.BASELINKER_ALLOW_WRITES === "true",
    http: {
      host: flags.host ?? env.BASELINKER_MCP_HOST ?? DEFAULT_HOST,
      port: resolvePort(flags.port ?? env.BASELINKER_MCP_PORT),
      path: normalizePath(flags.path ?? env.BASELINKER_MCP_PATH ?? DEFAULT_PATH),
      allowedHosts: splitList(env.BASELINKER_MCP_ALLOWED_HOSTS),
      allowedOrigins: splitList(env.BASELINKER_MCP_ALLOWED_ORIGINS),
    },
  };
  if (transport === "http") {
    config.auth = resolveAuth(env);
  }
  return config;
}

function parseFlags(argv: string[]): Record<string, string> {
  const flags: Record<string, string> = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }
    const separatorIndex = arg.indexOf("=");
    if (separatorIndex !== -1) {
      flags[arg.slice(2, separatorIndex)] = arg.slice(separatorIndex + 1);
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new ConfigError(`Missing value for ${arg}`);
    }
    flags[arg.slice(2)] = value;
    index += 1;
  }
  return flags;
}

function resolveTransport(value: string | undefined): TransportKind {
  if (value === undefined || value === "stdio") {
    return "stdio";
  }
  if (value === "http") {
    return "http";
  }
  throw new ConfigError(`Unsupported transport: ${value}. Use "stdio" or "http".`);
}

function requireToken(env: NodeJS.ProcessEnv): string {
  const token = env.BASELINKER_API_TOKEN;
  if (token === undefined || token.length === 0) {
    throw new ConfigError(
      "Missing BASELINKER_API_TOKEN. Set it as an environment variable or in a .env file.",
    );
  }
  return token;
}

function resolvePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError(`Invalid port: ${value}`);
  }
  return port;
}

function normalizePath(value: string): string {
  const withLeadingSlash = value.startsWith("/") ? value : `/${value}`;
  return withLeadingSlash.length > 1 && withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;
}

function resolveAuth(env: NodeJS.ProcessEnv): AuthConfig | undefined {
  const realmUrl = env.BASELINKER_MCP_AUTH_REALM_URL;
  const baseUrl = env.BASELINKER_MCP_AUTH_BASE_URL;
  if (realmUrl === undefined || realmUrl.length === 0) {
    if (env.BASELINKER_MCP_AUTH_DISABLED === "true") {
      return undefined;
    }
    throw new ConfigError(
      "HTTP transport requires BASELINKER_MCP_AUTH_REALM_URL and BASELINKER_MCP_AUTH_BASE_URL. " +
        "Set BASELINKER_MCP_AUTH_DISABLED=true only when the endpoint is not reachable from the internet.",
    );
  }
  if (baseUrl === undefined || baseUrl.length === 0) {
    throw new ConfigError(
      "BASELINKER_MCP_AUTH_BASE_URL is required when BASELINKER_MCP_AUTH_REALM_URL is set.",
    );
  }
  return {
    realmUrl: stripTrailingSlash(realmUrl),
    resourceUrl: stripTrailingSlash(baseUrl),
    audience: splitList(env.BASELINKER_MCP_AUTH_AUDIENCE),
    requiredScopes: splitList(env.BASELINKER_MCP_AUTH_REQUIRED_SCOPES, DEFAULT_REQUIRED_SCOPES),
  };
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function splitList(value: string | undefined, fallback: string[] = []): string[] {
  if (value === undefined) {
    return fallback;
  }
  const items = value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : fallback;
}
