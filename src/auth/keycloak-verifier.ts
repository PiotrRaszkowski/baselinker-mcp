import { InvalidTokenError } from "@modelcontextprotocol/sdk/server/auth/errors.js";
import type { OAuthTokenVerifier } from "@modelcontextprotocol/sdk/server/auth/provider.js";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey, type JWTPayload } from "jose";

const SIGNING_ALGORITHM = "RS256";

export interface KeycloakTokenVerifierOptions {
  realmUrl: string;
  audience?: string[];
  keyStore?: JWTVerifyGetKey;
}

export class KeycloakTokenVerifier implements OAuthTokenVerifier {
  private readonly realmUrl: string;
  private readonly audience: string[];
  private readonly keyStore: JWTVerifyGetKey;

  constructor(options: KeycloakTokenVerifierOptions) {
    this.realmUrl = options.realmUrl;
    this.audience = options.audience ?? [];
    this.keyStore = options.keyStore ?? createRemoteJWKSet(new URL(certsUrl(options.realmUrl)));
  }

  async verifyAccessToken(token: string): Promise<AuthInfo> {
    const payload = await this.verifySignature(token);
    return {
      token,
      clientId: resolveClientId(payload),
      scopes: resolveScopes(payload),
      expiresAt: payload.exp,
      extra: {
        subject: payload.sub,
        username: payload.preferred_username,
        issuer: payload.iss,
      },
    };
  }

  private async verifySignature(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.keyStore, {
        issuer: this.realmUrl,
        algorithms: [SIGNING_ALGORITHM],
        ...(this.audience.length > 0 ? { audience: this.audience } : {}),
      });
      return payload;
    } catch (error) {
      throw new InvalidTokenError(
        error instanceof Error ? error.message : "Access token verification failed",
      );
    }
  }
}

export function certsUrl(realmUrl: string): string {
  return `${realmUrl}/protocol/openid-connect/certs`;
}

function resolveClientId(payload: JWTPayload): string {
  const claim = payload.azp ?? payload.client_id;
  return typeof claim === "string" ? claim : "";
}

function resolveScopes(payload: JWTPayload): string[] {
  return typeof payload.scope === "string"
    ? payload.scope.split(" ").filter((scope) => scope.length > 0)
    : [];
}
