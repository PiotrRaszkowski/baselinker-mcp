import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import { SignJWT, exportJWK, generateKeyPair, createLocalJWKSet, type JWK } from "jose";
import { beforeAll, describe, expect, it } from "vitest";
import { KeycloakTokenVerifier, certsUrl } from "../src/auth/keycloak-verifier.js";

const REALM_URL = "https://keycloak.example.com/realms/mcpservers";

let privateKey: CryptoKey;
let keyStore: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  const pair = await generateKeyPair("RS256", { extractable: true });
  privateKey = pair.privateKey;
  const publicJwk = (await exportJWK(pair.publicKey)) as JWK;
  keyStore = createLocalJWKSet({ keys: [{ ...publicJwk, alg: "RS256", kid: "test-key" }] });
});

function signToken(claims: Record<string, unknown>, issuer = REALM_URL): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "RS256", kid: "test-key" })
    .setIssuer(issuer)
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(privateKey);
}

function createVerifier(audience?: string[]): KeycloakTokenVerifier {
  return new KeycloakTokenVerifier({ realmUrl: REALM_URL, audience, keyStore });
}

describe("KeycloakTokenVerifier", () => {
  it("verifyAccessTokenGivenValidTokenWhenVerifiedThenReturnsAuthInfoWithScopesAndClientId", async () => {
    const token = await signToken({
      sub: "user-1",
      azp: "claude-connector",
      scope: "openid profile",
      preferred_username: "piotr",
    });

    const authInfo = await createVerifier().verifyAccessToken(token);

    expect(authInfo.token).toBe(token);
    expect(authInfo.clientId).toBe("claude-connector");
    expect(authInfo.scopes).toEqual(["openid", "profile"]);
    expect(authInfo.expiresAt).toBeGreaterThan(Date.now() / 1000);
    expect(authInfo.extra).toMatchObject({ subject: "user-1", username: "piotr" });
  });

  it("verifyAccessTokenGivenTokenWithoutScopeClaimWhenVerifiedThenReturnsEmptyScopes", async () => {
    const token = await signToken({ sub: "user-1" });

    const authInfo = await createVerifier().verifyAccessToken(token);

    expect(authInfo.scopes).toEqual([]);
    expect(authInfo.clientId).toBe("");
  });

  it("verifyAccessTokenGivenClientIdClaimWhenAzpMissingThenFallsBackToClientId", async () => {
    const token = await signToken({ sub: "user-1", client_id: "legacy-client" });

    const authInfo = await createVerifier().verifyAccessToken(token);

    expect(authInfo.clientId).toBe("legacy-client");
  });

  it("verifyAccessTokenGivenForeignIssuerWhenVerifiedThenThrowsInvalidTokenError", async () => {
    const token = await signToken({ sub: "user-1" }, "https://evil.example.com/realms/other");

    await expect(createVerifier().verifyAccessToken(token)).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });

  it("verifyAccessTokenGivenExpiredTokenWhenVerifiedThenThrowsInvalidTokenError", async () => {
    const token = await new SignJWT({ sub: "user-1" })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer(REALM_URL)
      .setIssuedAt(0)
      .setExpirationTime(1)
      .sign(privateKey);

    await expect(createVerifier().verifyAccessToken(token)).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });

  it("verifyAccessTokenGivenAudienceConfiguredWhenTokenAudienceMismatchesThenThrowsInvalidTokenError", async () => {
    const token = await signToken({ sub: "user-1", aud: "account" });

    await expect(
      createVerifier(["baselinker-mcp"]).verifyAccessToken(token),
    ).rejects.toBeInstanceOf(InvalidTokenError);
  });

  it("verifyAccessTokenGivenAudienceConfiguredWhenTokenAudienceMatchesThenReturnsAuthInfo", async () => {
    const token = await signToken({ sub: "user-1", aud: ["account", "baselinker-mcp"] });

    const authInfo = await createVerifier(["baselinker-mcp"]).verifyAccessToken(token);

    expect(authInfo.extra?.subject).toBe("user-1");
  });

  it("verifyAccessTokenGivenMalformedTokenWhenVerifiedThenThrowsInvalidTokenError", async () => {
    await expect(createVerifier().verifyAccessToken("not-a-jwt")).rejects.toBeInstanceOf(
      InvalidTokenError,
    );
  });
});

describe("certsUrl", () => {
  it("certsUrlGivenRealmUrlWhenBuiltThenPointsAtKeycloakJwks", () => {
    expect(certsUrl(REALM_URL)).toBe(`${REALM_URL}/protocol/openid-connect/certs`);
  });
});
