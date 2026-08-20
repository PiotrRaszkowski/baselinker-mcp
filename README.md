# baselinker-mcp

[![CI](https://github.com/PiotrRaszkowski/baselinker-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/PiotrRaszkowski/baselinker-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org)

An [MCP](https://modelcontextprotocol.io) server that puts the whole
[BaseLinker API](https://api.baselinker.com/) — orders, invoices, returns, couriers, CRM,
warehouses, products — in front of an LLM client such as Claude Code, Claude Desktop or Cursor.

- **Complete.** All 179 documented API methods, none of them stubbed.
- **Read-only until you say otherwise.** The 92 write methods stay invisible unless you
  opt in; with writes off, every tool reports `readOnlyHint: true`.
- **Local or remote.** stdio for a client on your machine, or Streamable HTTP with OAuth
  2.1 (Keycloak) for a shared endpoint on the internet.

```
"How many orders came in yesterday that aren't paid yet?"
"Which catalog products dropped below 5 in stock this week?"
"Pull the courier label for order 1234567 and tell me the tracking number."
```

## Contents

- [Quickstart](#quickstart)
- [Connecting a client](#connecting-a-client)
- [Tools](#tools)
- [Write methods](#write-methods)
- [Behaviour worth knowing](#behaviour-worth-knowing)
- [Remote deployment (HTTP + OAuth)](#remote-deployment-http--oauth)
- [Configuration reference](#configuration-reference)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

## Quickstart

Requirements: Node.js 20 or newer, and a BaseLinker API token from the BaseLinker panel
under **Account & other → My account → API**.

```bash
git clone https://github.com/PiotrRaszkowski/baselinker-mcp.git
cd baselinker-mcp
npm install
npm run build
cp .env.example .env     # paste your token into BASELINKER_API_TOKEN
```

The token can also come straight from the environment, which takes precedence over `.env`.
`.env` is read from the package root, so the server starts correctly no matter which
directory your MCP client launches it from.

## Connecting a client

### Claude Code

```bash
claude mcp add baselinker -e BASELINKER_API_TOKEN=your-token -- node /path/to/baselinker-mcp/dist/index.js
```

### Claude Desktop, Cursor, or any `mcpServers` config

```json
{
  "mcpServers": {
    "baselinker": {
      "command": "node",
      "args": ["/path/to/baselinker-mcp/dist/index.js"],
      "env": { "BASELINKER_API_TOKEN": "your-token" }
    }
  }
}
```

For a shared endpoint reachable from claude.ai, see
[Remote deployment](#remote-deployment-http--oauth).

## Tools

179 separate tools would swamp a model's context and its ability to choose between them, so
methods are grouped the way BaseLinker itself groups them: **ten tools, one per API
category**. Each takes a `method` name and a `parameters` object, and each tool's
description lists the methods it accepts along with their parameters and pagination hints.

Counts below are `read + write`; write methods only appear when
`BASELINKER_ALLOW_WRITES=true`.

| Tool                          | Scope                                                                               | Methods |
| ----------------------------- | ----------------------------------------------------------------------------------- | ------- |
| `baselinker_orders`           | Orders, statuses, payments, journal, PickPack carts                                 | 15 + 22 |
| `baselinker_invoices`         | Invoices, invoice files, numbering series, receipts                                 | 6 + 6   |
| `baselinker_returns`          | Order returns, statuses, reasons, payments, journal                                 | 8 + 13  |
| `baselinker_courier`          | Couriers, packages, labels, protocols, documents                                    | 11 + 4  |
| `baselinker_crm`              | CRM clients and statuses                                                            | 5 + 6   |
| `baselinker_inventory`        | Catalogs, warehouses, locations, categories, manufacturers, suppliers, payers, tags | 18 + 24 |
| `baselinker_products`         | Product lists, data, stock, prices, logs                                            | 5 + 5   |
| `baselinker_documents`        | Warehouse documents, purchase orders, fulfillment deliveries                        | 10 + 9  |
| `baselinker_connect`          | Base Connect integrations and contractor credit                                     | 3 + 2   |
| `baselinker_external_storage` | External storages (shops, wholesalers)                                              | 6 + 1   |
|                               |                                                                                     | 87 + 92 |

Parameters are validated against a Zod schema per method before anything is sent, so a
malformed call comes back as a readable error instead of a BaseLinker error code. Unknown
keys are forwarded untouched — BaseLinker adds parameters without warning, and the server
does not break when it does.

## Write methods

Disabled by default. To enable:

```
BASELINKER_ALLOW_WRITES=true
```

While disabled, write methods are neither listed in any tool's `method` enum nor callable.
Enabling turns on **all 92 at once** — creating, updating and deleting orders, products,
stock, prices, invoices, shipments, returns and warehouse documents. Some of them delete
records; some dispatch real courier shipments that cost real money. There is no per-method
gating, so enable writes only for a client you trust, and consider running a second
read-only instance for everything else.

## Behaviour worth knowing

**Rate limiting.** BaseLinker allows 100 requests per minute. A client-side sliding-window
limiter enforces it — excess calls wait their turn rather than failing.

**Pagination.** List responses are capped (typically 100 items for orders, invoices and
returns; 1000 for catalog products). Each method's description carries the specific hint,
for example `getOrders` wants `date_confirmed_from` set to the last returned order's
`date_confirmed` plus one second, while `getInventoryProductsList` takes a 1-based `page`.

**File downloads.** `getLabel`, `getProtocol`, `getCourierDocument`, `getInvoiceFile`,
`getInventoryDocumentFile` and `getInventoryFulfillmentDeliveryLabels` return the file as an
MCP embedded resource with a real MIME type. Pass the extra `save_to_path` parameter —
handled locally, never sent to BaseLinker — to decode it to disk instead and get back
`{ saved_to, extension, bytes }`. This only makes sense over stdio, where the server runs on
your own machine; over HTTP it is rejected with an explanatory error.

## Remote deployment (HTTP + OAuth)

With `--transport http` the server speaks Streamable HTTP and acts as an **OAuth 2.0
Resource Server** ([RFC 9728](https://www.rfc-editor.org/rfc/rfc9728)): it publishes
protected resource metadata, answers unauthenticated calls with `401` plus a
`WWW-Authenticate` challenge, and verifies every access token as an RS256 JWT against a
Keycloak realm's JWKS. Clients discover the realm from that metadata and register
themselves through Dynamic Client Registration, so **no client ID or secret is configured
on either side**.

```bash
node dist/index.js --transport http --host 0.0.0.0 --port 8000 --path /mcp
```

| Path                                          | Auth   | Purpose                                                     |
| --------------------------------------------- | ------ | ----------------------------------------------------------- |
| `POST /mcp`                                   | Bearer | MCP Streamable HTTP, stateless — a fresh server per request |
| `GET` / `DELETE /mcp`                         | Bearer | `405`; stateless mode has no server-initiated streams       |
| `/.well-known/oauth-protected-resource[/mcp]` | public | RFC 9728 resource metadata                                  |
| `/healthz`                                    | public | Liveness probe                                              |

HTTP transport **refuses to start without an auth realm** unless you opt out explicitly
with `BASELINKER_MCP_AUTH_DISABLED=true`. That is deliberate: with writes enabled, an
unauthenticated endpoint hands the internet your BaseLinker account.

[`deploy/`](deploy/) has the full guide — Keycloak realm setup, a hardened Compose service
with Traefik labels, reverse-proxy snippets for Caddy and nginx, verification commands and
a threat model. The short version:

```bash
docker build -t baselinker-mcp:0.2.0 .
docker run -d --name baselinker-mcp -p 8000:8000 \
  -e BASELINKER_API_TOKEN=your-token \
  -e BASELINKER_MCP_AUTH_REALM_URL=https://keycloak.example.com/realms/myrealm \
  -e BASELINKER_MCP_AUTH_BASE_URL=https://mcp.example.com \
  baselinker-mcp:0.2.0
```

Then point a client at it:

```bash
claude mcp add --transport http baselinker https://mcp.example.com/mcp
```

In claude.ai it is Settings → Connectors → Add custom connector, URL
`https://mcp.example.com/mcp`, with **Client ID and Client Secret left empty**.

One thing to be clear about before you expose it: the BaseLinker token is shared. Everyone
who can log into the realm operates on the same BaseLinker account. See
[SECURITY.md](SECURITY.md) for the rest of the boundaries.

## Configuration reference

Everything is an environment variable; `.env` in the package root is loaded automatically.

### Always

| Variable                  | Default | Purpose                             |
| ------------------------- | ------- | ----------------------------------- |
| `BASELINKER_API_TOKEN`    | —       | **Required.** BaseLinker API token  |
| `BASELINKER_ALLOW_WRITES` | `false` | `true` exposes all 92 write methods |

### Transport

CLI flags win over these.

| Variable                   | Flag          | Default   | Purpose                  |
| -------------------------- | ------------- | --------- | ------------------------ |
| `BASELINKER_MCP_TRANSPORT` | `--transport` | `stdio`   | `stdio` or `http`        |
| `BASELINKER_MCP_HOST`      | `--host`      | `0.0.0.0` | Bind address, HTTP only  |
| `BASELINKER_MCP_PORT`      | `--port`      | `8000`    | Bind port, HTTP only     |
| `BASELINKER_MCP_PATH`      | `--path`      | `/mcp`    | Endpoint path, HTTP only |

### OAuth — required when transport is `http`

| Variable                              | Default  | Purpose                                                                                     |
| ------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `BASELINKER_MCP_AUTH_REALM_URL`       | —        | Keycloak realm issuing tokens, e.g. `https://keycloak.example.com/realms/myrealm`           |
| `BASELINKER_MCP_AUTH_BASE_URL`        | —        | Public URL of this server; with the path it forms the OAuth resource identifier             |
| `BASELINKER_MCP_AUTH_AUDIENCE`        | unset    | Audience(s) a token must carry. Needs an audience mapper in Keycloak; unset skips the check |
| `BASELINKER_MCP_AUTH_REQUIRED_SCOPES` | `openid` | Scopes every token must carry. `openid` guarantees a `sub` claim                            |
| `BASELINKER_MCP_AUTH_DISABLED`        | `false`  | `true` starts HTTP with no authentication. Never on a public address                        |
| `BASELINKER_MCP_ALLOWED_HOSTS`        | unset    | DNS-rebinding protection: accepted `Host` headers. Redundant behind a host-routing proxy    |
| `BASELINKER_MCP_ALLOWED_ORIGINS`      | unset    | DNS-rebinding protection: accepted `Origin` headers                                         |

Lists accept commas or spaces.

## Troubleshooting

| Symptom                                                 | Cause                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------- |
| `Missing BASELINKER_API_TOKEN`                          | No token in the environment or in `.env` at the package root               |
| `BaseLinker API error [ERROR_AUTH_TOKEN]`               | Token rejected by BaseLinker — regenerate it in the panel                  |
| A write method is "unknown"                             | `BASELINKER_ALLOW_WRITES` is not `true`                                    |
| Calls get slower under load                             | The rate limiter is pacing you to 100 requests/minute. Working as intended |
| `HTTP transport requires BASELINKER_MCP_AUTH_REALM_URL` | Set the realm and base URL, or opt out with `BASELINKER_MCP_AUTH_DISABLED` |
| `401` `no applicable key found in the JSON Web Key Set` | Token was not signed by the configured realm                               |
| `403` `insufficient_scope`                              | Token lacks `openid`                                                       |

More OAuth-specific cases are in [`deploy/README.md`](deploy/README.md#troubleshooting).

## Development

```bash
npm run dev         # run from sources (tsx), stdio transport
npm run start:http  # built server, HTTP transport
npm test            # unit tests — fully offline, no live API calls
npm run check       # format check + typecheck + tests, what CI runs
npm run smoke       # manual smoke test against the live API (uses .env)
npm run inspect     # MCP Inspector against the built server
```

[CONTRIBUTING.md](CONTRIBUTING.md) covers how the tool registry is put together and what to
watch out for when adding a method.

## License

[MIT](LICENSE). Not affiliated with or endorsed by BaseLinker.
