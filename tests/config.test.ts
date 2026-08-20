import { describe, expect, it } from "vitest";
import { ConfigError, parseConfig } from "../src/config.js";

const tokenEnv = { BASELINKER_API_TOKEN: "bl-token" } as NodeJS.ProcessEnv;

const authEnv = {
  ...tokenEnv,
  BASELINKER_MCP_AUTH_REALM_URL: "https://keycloak.example.com/realms/mcpservers/",
  BASELINKER_MCP_AUTH_BASE_URL: "https://baselinker-mcp.example.com/",
} as NodeJS.ProcessEnv;

describe("parseConfig", () => {
  it("parseConfigGivenNoArgumentsWhenTokenPresentThenDefaultsToStdio", () => {
    const config = parseConfig([], tokenEnv);

    expect(config.transport).toBe("stdio");
    expect(config.token).toBe("bl-token");
    expect(config.allowWrites).toBe(false);
    expect(config.auth).toBeUndefined();
  });

  it("parseConfigGivenMissingTokenWhenParsedThenThrowsConfigError", () => {
    expect(() => parseConfig([], {} as NodeJS.ProcessEnv)).toThrow(ConfigError);
  });

  it("parseConfigGivenHttpFlagsWhenParsedThenUsesProvidedHostPortAndPath", () => {
    const config = parseConfig(
      ["--transport", "http", "--host", "127.0.0.1", "--port", "9000", "--path", "mcp/"],
      authEnv,
    );

    expect(config.transport).toBe("http");
    expect(config.http).toMatchObject({ host: "127.0.0.1", port: 9000, path: "/mcp" });
  });

  it("parseConfigGivenEqualsSyntaxWhenParsedThenReadsFlagValue", () => {
    const config = parseConfig(["--transport=http", "--port=8080"], authEnv);

    expect(config.transport).toBe("http");
    expect(config.http.port).toBe(8080);
  });

  it("parseConfigGivenFlagWithoutValueWhenParsedThenThrowsConfigError", () => {
    expect(() => parseConfig(["--port"], tokenEnv)).toThrow(ConfigError);
  });

  it("parseConfigGivenUnsupportedTransportWhenParsedThenThrowsConfigError", () => {
    expect(() => parseConfig(["--transport", "sse"], tokenEnv)).toThrow(ConfigError);
  });

  it("parseConfigGivenOutOfRangePortWhenParsedThenThrowsConfigError", () => {
    expect(() => parseConfig(["--transport", "http", "--port", "70000"], authEnv)).toThrow(
      ConfigError,
    );
  });

  it("parseConfigGivenHttpTransportWhenRealmUrlSetThenStripsTrailingSlashes", () => {
    const config = parseConfig(["--transport", "http"], authEnv);

    expect(config.auth).toEqual({
      realmUrl: "https://keycloak.example.com/realms/mcpservers",
      resourceUrl: "https://baselinker-mcp.example.com",
      audience: [],
      requiredScopes: ["openid"],
    });
  });

  it("parseConfigGivenHttpTransportWhenRealmUrlMissingThenThrowsConfigError", () => {
    expect(() => parseConfig(["--transport", "http"], tokenEnv)).toThrow(ConfigError);
  });

  it("parseConfigGivenHttpTransportWhenBaseUrlMissingThenThrowsConfigError", () => {
    const env = { ...tokenEnv, BASELINKER_MCP_AUTH_REALM_URL: "https://kc/realms/x" };

    expect(() => parseConfig(["--transport", "http"], env as NodeJS.ProcessEnv)).toThrow(
      ConfigError,
    );
  });

  it("parseConfigGivenAuthExplicitlyDisabledWhenRealmUrlMissingThenReturnsNoAuth", () => {
    const env = { ...tokenEnv, BASELINKER_MCP_AUTH_DISABLED: "true" };

    const config = parseConfig(["--transport", "http"], env as NodeJS.ProcessEnv);

    expect(config.auth).toBeUndefined();
  });

  it("parseConfigGivenAudienceAndScopeListsWhenParsedThenSplitsOnCommasAndSpaces", () => {
    const env = {
      ...authEnv,
      BASELINKER_MCP_AUTH_AUDIENCE: "account, baselinker-mcp",
      BASELINKER_MCP_AUTH_REQUIRED_SCOPES: "openid profile",
    };

    const config = parseConfig(["--transport", "http"], env as NodeJS.ProcessEnv);

    expect(config.auth?.audience).toEqual(["account", "baselinker-mcp"]);
    expect(config.auth?.requiredScopes).toEqual(["openid", "profile"]);
  });

  it("parseConfigGivenNoAllowlistEnvWhenParsedThenLeavesDnsRebindingProtectionOff", () => {
    const config = parseConfig(["--transport", "http"], authEnv);

    expect(config.http.allowedHosts).toEqual([]);
    expect(config.http.allowedOrigins).toEqual([]);
  });

  it("parseConfigGivenAllowlistEnvWhenParsedThenSplitsHostsAndOrigins", () => {
    const env = {
      ...authEnv,
      BASELINKER_MCP_ALLOWED_HOSTS: "mcp.example.com, mcp.example.com:8000",
      BASELINKER_MCP_ALLOWED_ORIGINS: "https://mcp.example.com",
    };

    const config = parseConfig(["--transport", "http"], env as NodeJS.ProcessEnv);

    expect(config.http.allowedHosts).toEqual(["mcp.example.com", "mcp.example.com:8000"]);
    expect(config.http.allowedOrigins).toEqual(["https://mcp.example.com"]);
  });

  it("parseConfigGivenAllowWritesEnvWhenTrueThenEnablesWrites", () => {
    const env = { ...tokenEnv, BASELINKER_ALLOW_WRITES: "true" };

    expect(parseConfig([], env as NodeJS.ProcessEnv).allowWrites).toBe(true);
  });

  it("parseConfigGivenEnvironmentTransportWhenNoFlagThenUsesEnvironment", () => {
    const env = { ...authEnv, BASELINKER_MCP_TRANSPORT: "http" };

    expect(parseConfig([], env as NodeJS.ProcessEnv).transport).toBe("http");
  });
});
