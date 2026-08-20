# Security policy

## Reporting a vulnerability

Report security issues through
[GitHub private vulnerability reporting](https://github.com/PiotrRaszkowski/baselinker-mcp/security/advisories/new).
Please do not open a public issue for anything exploitable.

Include what you can: affected version, transport (stdio or HTTP), and the smallest
reproduction you have. Expect a first response within a week. This is a spare-time
project — there is no paid bounty.

## Supported versions

Fixes land on `main` and in the next tagged release. Older tags are not patched.

## What this server is

A thin, authenticated bridge between an MCP client and the BaseLinker API. It holds one
long-lived credential — your BaseLinker API token — and it can act on live business data.
Treat access to a running instance as access to the BaseLinker account behind it.

## Boundaries you should know about

**The BaseLinker token is a single shared credential.** Over HTTP transport, every user
who authenticates successfully operates on the same BaseLinker account. The OAuth layer
answers _who is allowed in_, never _whose data this is_. There is no multi-tenancy.

**Writes are off by default and are all-or-nothing.** `BASELINKER_ALLOW_WRITES=true`
enables all 92 write methods at once — including ones that delete records and dispatch
real courier shipments. There is no per-method or per-role gating. To run a mixed setup,
deploy two instances with different settings.

**HTTP transport refuses to start without authentication.** Set
`BASELINKER_MCP_AUTH_REALM_URL` and `BASELINKER_MCP_AUTH_BASE_URL`, or opt out explicitly
with `BASELINKER_MCP_AUTH_DISABLED=true`. The opt-out exists for loopback and private
networks; it is not safe on a public address.

**Token verification is local and offline.** Access tokens are verified as RS256 JWTs
against the realm's JWKS: signature, `iss`, `exp`, required scopes, and `aud` when
configured. There is no introspection call, which means **a revoked token stays valid
until it expires**. Keep realm token lifetimes short if that matters to you.

**`save_to_path` is stdio-only.** Over stdio the server runs on the caller's machine, so
writing a downloaded label to a caller-supplied path is exactly what is wanted. Over HTTP
it would write to the _server's_ filesystem, so the parameter is rejected.

**Model input is not a trust boundary.** Tool arguments come from an LLM, which may be
influenced by data it read elsewhere. Parameters are schema-validated, but a valid
`deleteOrder` call is still a deletion. This is the reason writes default to off.

## Not vulnerabilities

- The `/healthz` and `/.well-known/oauth-protected-resource` endpoints are unauthenticated
  by design. The latter is required to be public by RFC 9728.
- Error responses name the reason a token was rejected (`expired`, `unexpected "iss"`).
  This is intentional and required for clients to recover.
- A write method changing live BaseLinker data when writes are explicitly enabled.
