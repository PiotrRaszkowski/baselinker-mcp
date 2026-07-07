import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

export const ordersCategory: CategoryDef = {
  toolName: "baselinker_orders",
  title: "BaseLinker Orders",
  description:
    "Read orders from the BaseLinker order manager: order lists, order search by email/phone, transaction data, statuses, payments, journal events and PickPack carts.",
  methods: [
    {
      name: "getOrders",
      description:
        "Download orders. Max 100 per call; to page, pass date_confirmed_from = date_confirmed of the last returned order + 1 second, repeat until fewer than 100 returned.",
      mode: "read",
      schema: z
        .object({
          order_id: z.number().optional().describe("Retrieve a single specific order"),
          date_confirmed_from: z
            .number()
            .optional()
            .describe("Unix timestamp; collect orders confirmed from this date (pagination key)"),
          date_from: z
            .number()
            .optional()
            .describe("Unix timestamp; collect orders created from this date"),
          id_from: z.number().optional().describe("Order ID to start collecting from"),
          get_unconfirmed_orders: z
            .boolean()
            .optional()
            .describe("Include unconfirmed/incomplete orders (default false)"),
          status_id: z.number().optional().describe("Filter by order status ID"),
          filter_email: z.string().optional().describe("Filter by buyer email"),
          filter_order_source: z
            .string()
            .optional()
            .describe('Filter by source, e.g. "ebay", "amazon", "shop"'),
          filter_order_source_id: z
            .number()
            .optional()
            .describe("Filter by source identifier (requires filter_order_source)"),
          filter_shop_order_id: z.number().optional().describe("Filter by shop order ID"),
          filter_external_order_id: z
            .string()
            .optional()
            .describe("Filter by marketplace order ID"),
          include_custom_extra_fields: z
            .boolean()
            .optional()
            .describe("Include custom extra field values (default false)"),
          include_commissions: z
            .boolean()
            .optional()
            .describe("Include marketplace commission data (default false)"),
          include_connect_data: z
            .boolean()
            .optional()
            .describe("Include Base Connect contractor info (default false)"),
          include_discounts_data: z
            .boolean()
            .optional()
            .describe("Include discount log data (default false)"),
        })
        .passthrough(),
    },
    {
      name: "getOrdersByEmail",
      description: "Search for orders associated with a given email address.",
      mode: "read",
      schema: z
        .object({ email: z.string().describe("Email address searched for in orders") })
        .passthrough(),
    },
    {
      name: "getOrdersByPhone",
      description: "Search for orders linked to a given phone number.",
      mode: "read",
      schema: z
        .object({ phone: z.string().describe("Phone number searched for in orders") })
        .passthrough(),
    },
    {
      name: "getOrderTransactionData",
      description:
        "Retrieve transaction (marketplace/fulfillment) details for a selected order. Optional: include_complex_taxes, include_amazon_data.",
      mode: "read",
      schema: z.object({ order_id: z.number().describe("Order identifier") }).passthrough(),
    },
    {
      name: "getOrderSources",
      description: "Return order source types with IDs, grouped by personal/shop/marketplace.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getOrderExtraFields",
      description: "Return extra fields defined for orders with their configurations and types.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getJournalList",
      description:
        "Download order events (journal) from the last 3 days. Paginate incrementally by passing last_log_id from the previous response.",
      mode: "read",
      schema: z
        .object({
          last_log_id: z.number().optional().describe("Log ID to start retrieval from"),
          logs_types: z
            .array(z.number())
            .optional()
            .describe("List of event type IDs to filter"),
          order_id: z.number().optional().describe("Retrieve logs for a specific order only"),
        })
        .passthrough(),
    },
    {
      name: "getOrderPickPackHistory",
      description:
        "Retrieve pick & pack workflow history for a specified order. Optional: action_type.",
      mode: "read",
      schema: z.object({ order_id: z.number().describe("Order identifier") }).passthrough(),
    },
    {
      name: "getOrderPrintoutTemplates",
      description: "Return the list of configured printout templates available for orders.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getOrderPaymentsHistory",
      description:
        "Retrieve payment history for a selected order. Optional: show_full_history.",
      mode: "read",
      schema: z.object({ order_id: z.number().describe("Order identifier") }).passthrough(),
    },
    {
      name: "getOrderStatusGroups",
      description: "Return the list of order status groups.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getOrderStatusList",
      description: "Return order statuses created by the user in the order manager.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getPickPackCarts",
      description: "Retrieve the list of all PickPack carts (id, name, color).",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getPickPackCartOrders",
      description: "Retrieve all orders assigned to a specific PickPack cart.",
      mode: "read",
      schema: z.object({ cart_id: z.number().describe("Cart identifier") }).passthrough(),
    },
    {
      name: "getPickPackOrderCart",
      description: "Retrieve cart assignment information for a single order in PickPack.",
      mode: "read",
      schema: z.object({ order_id: z.number().describe("Order identifier") }).passthrough(),
    },
  ],
};
