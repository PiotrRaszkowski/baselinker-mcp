import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

export const ordersCategory: CategoryDef = {
  toolName: "baselinker_orders",
  title: "BaseLinker Orders",
  description:
    "Manage orders in the BaseLinker order manager. Read order lists, order search by email/phone, transaction data, statuses, payments, journal events and PickPack carts; and create, update, split, merge or delete orders, order products, payments, statuses, status groups and PickPack carts.",
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
    {
      name: "addOrder",
      description: "Add a new order to the BaseLinker order manager.",
      mode: "write",
      schema: z
        .object({
          order_status_id: z
            .number()
            .describe("Order status identifier (see getOrderStatusList)"),
          custom_source_id: z
            .number()
            .optional()
            .describe("Custom order source ID; default source is used if omitted"),
          date_add: z.number().describe("Order creation date as a Unix timestamp"),
          currency: z.string().describe("Three-letter currency code, e.g. EUR, PLN"),
          payment_method: z.string().describe("Payment method name"),
          payment_method_cod: z
            .boolean()
            .describe("Whether the payment method is cash on delivery (COD)"),
          paid: z
            .boolean()
            .describe("Payment completion status; true adds a full payment to the order"),
          user_comments: z
            .string()
            .optional()
            .describe("Buyer comments (max 510 characters)"),
          admin_comments: z
            .string()
            .optional()
            .describe("Seller comments (max 200 characters)"),
          email: z.string().describe("Buyer email address"),
          phone: z.string().describe("Buyer phone number"),
          user_login: z.string().optional().describe("Allegro or eBay username"),
          delivery_method: z.string().describe("Delivery method name"),
          delivery_price: z.number().describe("Gross delivery cost"),
          delivery_fullname: z.string().describe("Recipient name and surname"),
          delivery_company: z.string().optional().describe("Recipient company name"),
          delivery_address: z.string().describe("Delivery street address and number"),
          delivery_postcode: z.string().describe("Delivery postal code"),
          delivery_city: z.string().describe("Delivery city"),
          delivery_state: z.string().optional().describe("Delivery state or province"),
          delivery_country_code: z
            .string()
            .describe("Two-letter delivery country code"),
          delivery_point_id: z
            .string()
            .optional()
            .describe("Pickup point identifier"),
          delivery_point_name: z.string().optional().describe("Pickup point name"),
          delivery_point_address: z
            .string()
            .optional()
            .describe("Pickup point street address"),
          delivery_point_postcode: z
            .string()
            .optional()
            .describe("Pickup point postal code"),
          delivery_point_city: z.string().optional().describe("Pickup point city"),
          invoice_fullname: z.string().optional().describe("Billing name and surname"),
          invoice_company: z.string().optional().describe("Billing company name"),
          invoice_nip: z.string().optional().describe("VAT registration or tax number"),
          invoice_address: z.string().optional().describe("Billing street address"),
          invoice_postcode: z.string().optional().describe("Billing postal code"),
          invoice_city: z.string().optional().describe("Billing city"),
          invoice_state: z.string().optional().describe("Billing state or province"),
          invoice_country_code: z
            .string()
            .optional()
            .describe("Two-letter billing country code"),
          want_invoice: z
            .boolean()
            .optional()
            .describe("Whether the buyer requested an invoice"),
          extra_field_1: z
            .string()
            .optional()
            .describe("Custom seller-defined field 1"),
          extra_field_2: z
            .string()
            .optional()
            .describe("Custom seller-defined field 2"),
          custom_extra_fields: z
            .record(z.unknown())
            .optional()
            .describe("Order custom extra fields keyed by field ID"),
          products: z
            .array(z.record(z.unknown()))
            .describe("Order items with storage, product details and pricing"),
        })
        .passthrough(),
    },
    {
      name: "addOrderBySplit",
      description:
        "Create a new order by splitting selected products (and optionally part of the delivery cost) out of an existing order.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Identifier of the order being split"),
          items_to_split: z
            .array(z.record(z.unknown()))
            .describe(
              "Products to move to the new order, each with order_product_id and quantity",
            ),
          delivery_cost_to_split: z
            .number()
            .optional()
            .describe(
              "Delivery cost to move to the new order; cannot exceed the current delivery price",
            ),
        })
        .passthrough(),
    },
    {
      name: "addOrderDuplicate",
      description:
        "Create a new order that duplicates all data of an existing order under a new order ID.",
      mode: "write",
      schema: z
        .object({ order_id: z.number().describe("ID of the order to duplicate") })
        .passthrough(),
    },
    {
      name: "deleteOrders",
      description:
        "Permanently delete multiple orders from the order manager (max 1000 order IDs per call).",
      mode: "write",
      schema: z
        .object({
          order_ids: z
            .array(z.number())
            .describe("Order IDs to delete (max 1000 per call)"),
        })
        .passthrough(),
    },
    {
      name: "setOrderFields",
      description:
        "Update selected fields (address, comments, delivery, invoice data, etc.) of an existing order; only provided fields are changed.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier"),
          admin_comments: z
            .string()
            .optional()
            .describe("Seller comments (max 200 characters)"),
          user_comments: z
            .string()
            .optional()
            .describe("Buyer comments (max 510 characters)"),
          payment_method: z
            .string()
            .optional()
            .describe("Payment method name (max 30 characters)"),
          payment_method_cod: z
            .boolean()
            .optional()
            .describe("Whether the payment method is cash on delivery (COD)"),
          email: z
            .string()
            .optional()
            .describe("Buyer email address (max 150 characters)"),
          phone: z
            .string()
            .optional()
            .describe("Buyer phone number (max 100 characters)"),
          user_login: z
            .string()
            .optional()
            .describe("Buyer login (max 30 characters)"),
          delivery_method: z
            .string()
            .optional()
            .describe("Delivery method name (max 30 characters)"),
          delivery_price: z.number().optional().describe("Gross delivery cost"),
          delivery_fullname: z
            .string()
            .optional()
            .describe("Recipient name and surname (max 156 characters)"),
          delivery_company: z
            .string()
            .optional()
            .describe("Delivery company name (max 156 characters)"),
          delivery_address: z
            .string()
            .optional()
            .describe("Delivery street address and number (max 156 characters)"),
          delivery_postcode: z
            .string()
            .optional()
            .describe("Delivery postal code (max 100 characters)"),
          delivery_city: z
            .string()
            .optional()
            .describe("Delivery city (max 100 characters)"),
          delivery_state: z
            .string()
            .optional()
            .describe("Delivery state or province (max 35 characters)"),
          delivery_country_code: z
            .string()
            .optional()
            .describe("Two-letter delivery country code"),
          delivery_point_id: z
            .string()
            .optional()
            .describe("Pickup point identifier (max 40 characters)"),
          delivery_point_name: z
            .string()
            .optional()
            .describe("Pickup point name (max 100 characters)"),
          delivery_point_address: z
            .string()
            .optional()
            .describe("Pickup point address (max 100 characters)"),
          delivery_point_postcode: z
            .string()
            .optional()
            .describe("Pickup point postal code (max 100 characters)"),
          delivery_point_city: z
            .string()
            .optional()
            .describe("Pickup point city (max 100 characters)"),
          invoice_fullname: z
            .string()
            .optional()
            .describe("Billing name and surname (max 500 characters)"),
          invoice_company: z
            .string()
            .optional()
            .describe("Billing company name (max 500 characters)"),
          invoice_nip: z
            .string()
            .optional()
            .describe("VAT registration or tax number (max 100 characters)"),
          invoice_address: z
            .string()
            .optional()
            .describe("Billing street address and number (max 500 characters)"),
          invoice_postcode: z
            .string()
            .optional()
            .describe("Billing postal code (max 20 characters)"),
          invoice_city: z
            .string()
            .optional()
            .describe("Billing city (max 100 characters)"),
          invoice_state: z
            .string()
            .optional()
            .describe("Billing state or province (max 35 characters)"),
          invoice_country_code: z
            .string()
            .optional()
            .describe("Two-letter billing country code"),
          want_invoice: z
            .boolean()
            .optional()
            .describe("Whether the buyer requested an invoice"),
          extra_field_1: z
            .string()
            .optional()
            .describe("Custom seller-defined field 1 (max 50 characters)"),
          extra_field_2: z
            .string()
            .optional()
            .describe("Custom seller-defined field 2 (max 50 characters)"),
          custom_extra_fields: z
            .record(z.unknown())
            .optional()
            .describe("Order custom extra fields keyed by field ID"),
          pick_state: z
            .number()
            .optional()
            .describe("Product collection (pick) status flag"),
          pack_state: z
            .number()
            .optional()
            .describe("Product packing status flag"),
          star: z
            .number()
            .optional()
            .describe("Order rating from 0 to 5 (0 means no star)"),
        })
        .passthrough(),
    },
    {
      name: "setOrdersMerge",
      description:
        "Merge multiple orders into one. Depending on merge_mode, into_main_order transfers items and permanently deletes the merged orders, while technical_merge creates a new order without altering the originals.",
      mode: "write",
      schema: z
        .object({
          main_order_id: z
            .number()
            .describe("ID of the main order whose shipping and invoice data is kept"),
          order_ids_to_merge: z
            .array(z.number())
            .describe("Other order IDs to merge; must not include main_order_id"),
          merge_mode: z
            .enum(["technical_merge", "into_main_order"])
            .describe(
              "technical_merge creates a new order without altering originals; into_main_order transfers items and deletes the merged orders",
            ),
          sum_delivery_costs: z
            .boolean()
            .describe(
              "Whether to sum delivery costs of all merged orders or keep only the main order's cost",
            ),
        })
        .passthrough(),
    },
    {
      name: "addOrderProduct",
      description: "Add a new product item to an existing order.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier"),
          storage: z
            .string()
            .describe('Product source storage type: "db", "shop" or "warehouse"'),
          storage_id: z
            .string()
            .describe("Identifier of the inventory, shop or warehouse source"),
          product_id: z
            .string()
            .optional()
            .describe("Product identifier in BaseLinker or shop storage"),
          variant_id: z.string().optional().describe("Product variant identifier"),
          auction_id: z
            .string()
            .optional()
            .describe("Listing ID for eBay/Allegro orders"),
          name: z.string().optional().describe("Product name"),
          sku: z.string().optional().describe("Product SKU number"),
          ean: z.string().optional().describe("Product EAN number"),
          location: z
            .string()
            .optional()
            .describe("Product location (semicolon-separated for multiple)"),
          warehouse_id: z
            .number()
            .optional()
            .describe("Source warehouse ID for a BaseLinker inventory product"),
          attributes: z
            .string()
            .optional()
            .describe("Product attribute details, e.g. color or size"),
          price_brutto: z.number().optional().describe("Single item gross price"),
          tax_rate: z
            .number()
            .optional()
            .describe("VAT tax rate (0-100, with special values for exemptions)"),
          quantity: z.number().optional().describe("Number of pieces"),
          weight: z.number().optional().describe("Single piece weight"),
        })
        .passthrough(),
    },
    {
      name: "deleteOrderProduct",
      description: "Permanently remove a single product item from an order.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier"),
          order_product_id: z
            .number()
            .describe("Identifier of the order item to remove"),
        })
        .passthrough(),
    },
    {
      name: "setOrderProductFields",
      description:
        "Update fields (price, quantity, attributes, etc.) of a product item in an order; only provided fields are changed.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier"),
          order_product_id: z
            .number()
            .describe("Identifier of the order item to update"),
          storage: z
            .string()
            .optional()
            .describe('Product source storage type: "db", "shop" or "warehouse"'),
          storage_id: z
            .string()
            .optional()
            .describe("Identifier of the inventory, shop or warehouse source"),
          product_id: z
            .string()
            .optional()
            .describe("Product identifier in BaseLinker or shop storage"),
          variant_id: z.string().optional().describe("Product variant identifier"),
          auction_id: z
            .string()
            .optional()
            .describe("Listing ID for eBay/Allegro orders"),
          name: z.string().optional().describe("Product name"),
          sku: z.string().optional().describe("Product SKU number"),
          ean: z.string().optional().describe("Product EAN number"),
          location: z.string().optional().describe("Product storage location"),
          warehouse_id: z
            .number()
            .optional()
            .describe("Source warehouse ID for a BaseLinker inventory product"),
          attributes: z
            .string()
            .optional()
            .describe('Product attribute details, e.g. "Colour: blue"'),
          price_brutto: z.number().optional().describe("Gross price per unit"),
          tax_rate: z
            .number()
            .optional()
            .describe("VAT tax rate (0-100, or special values -1, -0.02, -0.03)"),
          quantity: z.number().optional().describe("Number of pieces"),
          weight: z.number().optional().describe("Weight per unit"),
        })
        .passthrough(),
    },
    {
      name: "setOrderPayment",
      description:
        "Record a payment for an order; payment_done replaces the current payment total and marks the order as paid if it matches the order value.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier"),
          payment_done: z
            .number()
            .describe("Payment amount that replaces the current payment total"),
          payment_date: z
            .number()
            .describe("Payment date as a Unix timestamp"),
          payment_comment: z
            .string()
            .describe("Payment note (max 30 characters)"),
          external_payment_id: z
            .string()
            .optional()
            .describe("Third-party payment reference number (max 30 characters)"),
        })
        .passthrough(),
    },
    {
      name: "addOrderStatus",
      description:
        "Create a new order status or, when status_id is provided, update an existing one, optionally assigning it to a status group.",
      mode: "write",
      schema: z
        .object({
          status_id: z
            .number()
            .optional()
            .describe("ID of the status to update; omit to create a new status"),
          name: z
            .string()
            .describe("Status name shown in the seller panel (max 30 characters)"),
          short_name: z
            .string()
            .describe("Abbreviated status name (max 17 characters)"),
          name_for_customer: z
            .string()
            .optional()
            .describe(
              "Status name shown to customers (max 250 characters); omit to hide it from order history",
            ),
          color: z.string().describe('Hex color code, e.g. "#FF0000"'),
          type: z
            .number()
            .optional()
            .describe(
              "Analytics category: 0=Other, 1=Unpaid, 2=In progress, 3=Sent, 4=Delivered, 5=Cancelled, 6=Return",
            ),
          group_id: z
            .number()
            .optional()
            .describe("Status group ID; defaults to the main group on creation"),
          comments: z
            .string()
            .optional()
            .describe("Internal note visible only on the settings page (max 255 characters)"),
        })
        .passthrough(),
    },
    {
      name: "addOrderStatusGroup",
      description:
        "Create a new order status group or, when group_id is provided, update an existing one.",
      mode: "write",
      schema: z
        .object({
          group_id: z
            .number()
            .optional()
            .describe("ID of the status group to update; omit to create a new group"),
          name: z.string().describe("Group name (max 15 characters)"),
        })
        .passthrough(),
    },
    {
      name: "deleteOrderStatus",
      description:
        "Permanently delete an order status and reassign all orders using it to a target status. The two status IDs must differ and the default status cannot be deleted.",
      mode: "write",
      schema: z
        .object({
          status_id: z.number().describe("Identifier of the status to delete"),
          target_status_id: z
            .number()
            .describe("Identifier of the replacement status for reassigned orders"),
        })
        .passthrough(),
    },
    {
      name: "deleteOrderStatusGroup",
      description:
        "Permanently delete an order status group; all statuses within it are reassigned to the default group.",
      mode: "write",
      schema: z
        .object({
          group_id: z.number().describe("ID of the status group to delete"),
        })
        .passthrough(),
    },
    {
      name: "setOrderStatus",
      description: "Change the status of a single order.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier"),
          status_id: z
            .number()
            .describe("New status ID (see getOrderStatusList)"),
        })
        .passthrough(),
    },
    {
      name: "setOrderStatuses",
      description: "Change the status of multiple orders at once to a single status.",
      mode: "write",
      schema: z
        .object({
          order_ids: z.array(z.number()).describe("Order IDs to update"),
          status_id: z
            .number()
            .describe("New status ID applied to all orders (see getOrderStatusList)"),
        })
        .passthrough(),
    },
    {
      name: "addPickPackCart",
      description:
        "Create a new PickPack cart or, when cart_id is provided, update an existing one; color is generated automatically if omitted.",
      mode: "write",
      schema: z
        .object({
          cart_id: z
            .number()
            .optional()
            .describe("Cart identifier to update; omit to create a new cart"),
          name: z
            .string()
            .optional()
            .describe("Cart name (max 5 characters); required when creating a cart"),
          color: z
            .string()
            .optional()
            .describe('Hex color code, e.g. "#FF0000"; randomly generated if omitted'),
        })
        .passthrough(),
    },
    {
      name: "addPickPackOrdersToCart",
      description:
        "Assign up to 20 orders to a PickPack cart in one call; orders previously assigned elsewhere are reassigned.",
      mode: "write",
      schema: z
        .object({
          order_ids: z
            .array(z.number())
            .describe("Order IDs to assign to the cart (max 20 per call)"),
          cart_id: z.number().describe("Destination cart identifier"),
        })
        .passthrough(),
    },
    {
      name: "deletePickPackCart",
      description:
        "Permanently delete a PickPack cart; all order assignments to that cart are cleared.",
      mode: "write",
      schema: z
        .object({ cart_id: z.number().describe("Cart identifier to delete") })
        .passthrough(),
    },
    {
      name: "deletePickPackCartOrders",
      description:
        "Remove all orders from a PickPack cart while keeping the cart; every removed order is unassigned.",
      mode: "write",
      schema: z
        .object({
          cart_id: z.number().describe("Cart identifier to clear of all orders"),
        })
        .passthrough(),
    },
    {
      name: "deletePickPackOrderFromCart",
      description:
        "Remove a single order from its assigned PickPack cart, unassigning it from any cart.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier to remove from its cart"),
        })
        .passthrough(),
    },
    {
      name: "runOrderMacroTrigger",
      description:
        "Run a personal macro trigger (from orders automatic actions) for a selected order.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier"),
          trigger_id: z
            .number()
            .describe("Identifier of the personal trigger to run"),
        })
        .passthrough(),
    },
  ],
};
