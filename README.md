# baselinker-mcp

MCP (Model Context Protocol) server exposing the [BaseLinker API](https://api.baselinker.com/) to LLM clients such as Claude Code, Claude Desktop or Cursor.

**Read-only by default**: the 87 `get*` methods are always available, grouped into 10 tools by BaseLinker's own API categories. The 92 write methods (`add*`, `set*`, `delete*`, `update*`, `create*`, `run*`) are exposed only when `BASELINKER_ALLOW_WRITES=true` — see [Write methods](#write-methods). With writes disabled, every tool advertises `readOnlyHint: true`.

## Requirements

- Node.js >= 20
- A BaseLinker API token: BaseLinker panel → **Account & other → My account → API**

## Setup

```bash
npm install
npm run build
cp .env.example .env   # then paste your token
```

`.env`:

```
BASELINKER_API_TOKEN=your-token-here
```

The token can also be provided directly as an environment variable (takes precedence over `.env`).

## Client configuration

### Claude Code

```bash
claude mcp add baselinker -e BASELINKER_API_TOKEN=your-token -- node /path/to/baselinker-mcp/dist/index.js
```

### Claude Desktop / generic `mcpServers` config

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

## Tools

Each tool takes a `method` (enum) and a `parameters` object. Method-specific parameters are validated and documented in the tool description.

The method counts below are `read + write`; write methods are only listed/callable when `BASELINKER_ALLOW_WRITES=true`.

| Tool | Scope | Methods (read + write) |
|---|---|---|
| `baselinker_orders` | Orders, statuses, payments, journal, PickPack carts | 15 + 22 |
| `baselinker_invoices` | Invoices, invoice files, numbering series, receipts | 6 + 6 |
| `baselinker_returns` | Order returns, statuses, reasons, payments, journal | 8 + 13 |
| `baselinker_courier` | Couriers, packages, labels, protocols, documents | 11 + 4 |
| `baselinker_crm` | CRM clients and statuses | 5 + 6 |
| `baselinker_inventory` | Catalogs, warehouses, locations, categories, manufacturers, suppliers, payers, tags | 18 + 24 |
| `baselinker_products` | Product lists, data, stock, prices, logs | 5 + 5 |
| `baselinker_documents` | Warehouse documents, purchase orders, fulfillment deliveries | 10 + 9 |
| `baselinker_connect` | Base Connect integrations and contractor credit | 3 + 2 |
| `baselinker_external_storage` | External storages (shops, wholesalers) | 6 + 1 |

### Write methods

Write methods are **disabled by default**. To enable them, set:

```
BASELINKER_ALLOW_WRITES=true
```

When disabled, write methods are neither listed in any tool's `method` enum nor callable, and every tool reports `readOnlyHint: true`. When enabled, all 92 write methods become available — creating, updating and deleting orders, products, stock, prices, invoices, shipments, returns, warehouse documents and more. These operate on live BaseLinker data (and can trigger real courier shipments or delete records), so enable writes only for trusted clients.

### Pagination

BaseLinker limits list responses (typically 100 items for orders/invoices/returns, 1000 for catalog products). Pagination hints are included in each method's description, e.g.:

- `getOrders`: pass `date_confirmed_from` = `date_confirmed` of the last returned order + 1 second
- `getInventoryProductsList`: pass `page` (1-based)

### File downloads

File methods (`getLabel`, `getProtocol`, `getCourierDocument`, `getInvoiceFile`, `getInventoryDocumentFile`, `getInventoryFulfillmentDeliveryLabels`) accept an extra synthetic `save_to_path` parameter (handled locally, never sent to the API):

- with `save_to_path`: the base64 payload is decoded and written to disk; the tool returns `{ saved_to, extension, bytes }`
- without it: the file is returned as an MCP embedded resource with a proper MIME type

### Rate limiting

The BaseLinker API allows 100 requests per minute. The server enforces this client-side with a sliding-window limiter — excess calls wait instead of failing.

## Development

```bash
npm run dev        # run from sources (tsx)
npm test           # unit tests (vitest, no live API calls)
npm run smoke      # manual smoke test against the live API (uses .env)
npm run inspect    # MCP Inspector against the built server
```
