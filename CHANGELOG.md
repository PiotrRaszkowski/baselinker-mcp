# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-08-20

### Added

- Streamable HTTP transport (`--transport http`), turning the server into a remote MCP
  endpoint alongside the existing stdio mode.
- OAuth 2.0 Resource Server support (RFC 9728): protected resource metadata, `401` with a
  `WWW-Authenticate` challenge, and RS256 access-token verification against a Keycloak
  realm's JWKS. Clients register themselves through Dynamic Client Registration.
- `Dockerfile` and a reference Compose deployment under `deploy/`.
- `/healthz` liveness endpoint.
- Optional DNS-rebinding protection via `BASELINKER_MCP_ALLOWED_HOSTS` and
  `BASELINKER_MCP_ALLOWED_ORIGINS`.

### Changed

- HTTP transport refuses to start without an auth realm unless
  `BASELINKER_MCP_AUTH_DISABLED=true` is set explicitly.
- `save_to_path` is rejected over HTTP transport, where it would write to the server's
  filesystem rather than the caller's.

## [0.1.0] — 2026-08-19

### Added

- Read-only MCP server over stdio, exposing 87 BaseLinker `get*` methods through ten
  category tools.
- 92 write methods behind `BASELINKER_ALLOW_WRITES=true`.
- Client-side sliding-window rate limiter matching BaseLinker's 100 requests/minute cap.
- File methods returning MCP embedded resources, or writing to disk via `save_to_path`.

[0.2.0]: https://github.com/PiotrRaszkowski/baselinker-mcp/releases/tag/v0.2.0
[0.1.0]: https://github.com/PiotrRaszkowski/baselinker-mcp/releases/tag/v0.1.0
