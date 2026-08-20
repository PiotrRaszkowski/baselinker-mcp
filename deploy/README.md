# Deploying baselinker-mcp as a remote connector

This directory holds a reference deployment: the server behind a TLS-terminating reverse
proxy, authenticated by a Keycloak realm, reachable from claude.ai as a custom connector.

Everything here uses `mcp.example.com` and `keycloak.example.com/realms/myrealm` as
placeholders. Replace them with your own hostnames.

## What you end up with

```
Claude  ──HTTPS──>  Traefik  ──>  baselinker-mcp  ──HTTPS──>  api.baselinker.com
   │                                    │
   │   1. GET /.well-known/oauth-protected-resource/mcp  (public)
   │   2. discovers the realm, registers itself via DCR
   │   3. user logs in, Claude gets an access token
   └───4. POST /mcp with Bearer token ──┘   token verified against the realm's JWKS
```

The server never holds an OAuth client secret and never talks to Keycloak's token
endpoint. It only verifies signatures, so Keycloak being briefly unavailable does not
take the endpoint down (JWKS is cached).

## Prerequisites

- Docker with the Compose plugin
- A reverse proxy terminating TLS on a public hostname
- **Keycloak 26.6.0 or later.** Earlier versions register DCR clients in a shape MCP
  clients cannot use ([keycloak#45309](https://github.com/keycloak/keycloak/pull/45309)).
- A BaseLinker API token: BaseLinker panel → **Account & other → My account → API**

## 1. Keycloak

Create (or reuse) a realm — `myrealm` below — and create the users who should be allowed
to reach the connector. Then enable **anonymous Dynamic Client Registration**, which is
what lets Claude register itself without you provisioning a client by hand.

In the admin console: **Realm settings → Client registration → Anonymous access policies**.

The default `Trusted Hosts` policy ships with an empty host list, which rejects every
anonymous registration. Add the hosts your MCP client registers redirect URIs from:

| Client                         | Hosts to trust                                       |
| ------------------------------ | ---------------------------------------------------- |
| claude.ai web / Claude Desktop | `claude.ai`, `claude.com`                            |
| Claude Code                    | the machine's own hostname, or disable host checking |

Keep `Client URIs Must Match` enabled — it is the control that stops an unrelated party
from registering a client in your realm and walking through your login page.

Verify the realm advertises registration:

```bash
curl -s https://keycloak.example.com/realms/myrealm/.well-known/oauth-authorization-server \
  | jq '{issuer, registration_endpoint, code_challenge_methods_supported}'
```

`registration_endpoint` must be present and `S256` must be among the challenge methods.

### Optional: bind tokens to this resource

By default Keycloak issues tokens with `aud: ["account"]`, so the server does not check
the audience. To tie tokens to this specific server, add an **Audience** protocol mapper
to the realm's default client scope with the value you then set as
`BASELINKER_MCP_AUTH_AUDIENCE`.

## 2. The server

```bash
cp .env.example .env      # paste your BaseLinker token
chmod 600 .env
docker compose up -d
```

`docker-compose.yml` builds straight from a pinned git tag, so nothing has to be copied to
the server. To upgrade, bump the ref in `build.context` and the tag in `image:`, then
`docker compose build --no-cache && docker compose up -d`.

Container hardening already in the file: `read_only` root filesystem, `no-new-privileges`,
unprivileged UID, `/tmp` on tmpfs, no published ports (proxy network only), capped logs.

### Behind a proxy other than Traefik

Any proxy works — the server needs plain HTTP forwarding with the `Host` header
preserved, and must not buffer responses (the transport streams Server-Sent Events).

<details>
<summary>Caddy</summary>

```caddy
mcp.example.com {
    reverse_proxy baselinker-mcp:8000 {
        flush_interval -1
    }
}
```

</details>

<details>
<summary>nginx</summary>

```nginx
location / {
    proxy_pass http://baselinker-mcp:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_buffering off;
    proxy_read_timeout 300s;
}
```

</details>

If the server is exposed without a proxy that pins the hostname, turn on DNS-rebinding
protection: `BASELINKER_MCP_ALLOWED_HOSTS=mcp.example.com`.

## 3. Connect a client

**claude.ai / Claude Desktop** — Settings → Connectors → Add custom connector, URL
`https://mcp.example.com/mcp`. **Leave Client ID and Client Secret empty.** Claude
registers itself through DCR and prompts for a Keycloak login on first use.

**Claude Code**

```bash
claude mcp add --transport http baselinker https://mcp.example.com/mcp
```

## 4. Verify

```bash
# Public: liveness and OAuth discovery
curl -s https://mcp.example.com/healthz
curl -s https://mcp.example.com/.well-known/oauth-protected-resource/mcp | jq

# Must return 401 with a WWW-Authenticate header pointing at the metadata above
curl -si -X POST https://mcp.example.com/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"probe","version":"0"}}}'
```

A `200` on that last command means the endpoint is unauthenticated. Stop and fix it before
going further.

## Threat model

Be honest with yourself about the blast radius before exposing this.

- **The BaseLinker token is shared.** Every user who can authenticate against the realm
  operates on the same BaseLinker account. Realm membership is equivalent to full access
  to that account — scope realm membership accordingly.
- **With `BASELINKER_ALLOW_WRITES=true`** the endpoint can change orders, stock, prices and
  invoices, and dispatch real courier shipments. Leave writes off unless you need them; a
  read-only second instance under a different hostname is a reasonable split.
- **Your hostname is public.** Let's Encrypt publishes every certificate to Certificate
  Transparency logs, so the hostname is discoverable from the moment it is issued. Do not
  treat an obscure name as a security control.
- **An IP allowlist is not sufficient on its own.** Cloud AI providers publish shared
  egress ranges used by every one of their customers, so an allowlist narrows the field
  but does not identify you. Use it as a second layer, never as the only one.
- **`save_to_path` is rejected over HTTP.** It would write to the server's filesystem
  rather than the caller's; file methods return embedded resources instead.

## Troubleshooting

| Symptom                                                 | Cause                                                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `401` `no applicable key found in the JSON Web Key Set` | Token signed outside the realm, or the realm rotated keys and the client is replaying an old token |
| `401` `unexpected "iss" claim value`                    | Token from a different realm — check `BASELINKER_MCP_AUTH_REALM_URL`                               |
| `401` `unexpected "aud" claim value`                    | `BASELINKER_MCP_AUTH_AUDIENCE` is set but no audience mapper produces it                           |
| `403` `insufficient_scope`                              | Token lacks `openid`; the client omitted the scope during registration                             |
| `403` at registration time, before any login            | Keycloak's `Trusted Hosts` policy rejected the client's redirect host                              |
| Client hangs after login                                | Proxy is buffering the SSE response — see the proxy snippets above                                 |
| `Missing BASELINKER_API_TOKEN` on startup               | `.env` not next to `docker-compose.yml`, or not readable by UID 1000                               |

```bash
docker compose logs -f
docker compose ps        # includes healthcheck state
```
