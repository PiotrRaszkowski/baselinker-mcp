import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

export const returnsCategory: CategoryDef = {
  toolName: "baselinker_returns",
  title: "BaseLinker Order Returns",
  description:
    "Manage order returns in the BaseLinker return manager: read return lists, statuses, reasons, payments and journal events, and create, update or delete returns, return products, statuses, status groups and refunds.",
  methods: [
    {
      name: "getOrderReturns",
      description:
        "Download order returns. Max 100 per call; to page, pass id_from = last return_id from the previous response + 1.",
      mode: "read",
      schema: z
        .object({
          order_id: z
            .number()
            .optional()
            .describe("Identifier of the order the return was created from"),
          return_id: z.number().optional().describe("Specific order return identifier"),
          date_from: z
            .number()
            .optional()
            .describe("Unix timestamp; collect returns created from this date"),
          id_from: z
            .number()
            .optional()
            .describe("Order return ID to begin subsequent collection (pagination key)"),
          status_id: z.number().optional().describe("Filter returns by status"),
          filter_order_return_source: z
            .string()
            .optional()
            .describe('Filter by return source, e.g. "ebay", "amazon"'),
          filter_order_return_source_id: z
            .number()
            .optional()
            .describe("Filter by source identifier (requires filter_order_return_source)"),
          include_custom_extra_fields: z
            .boolean()
            .optional()
            .describe("Include custom extra field values (default false)"),
          include_connect_data: z
            .boolean()
            .optional()
            .describe("Include Base Connect and contractor data (default false)"),
        })
        .passthrough(),
    },
    {
      name: "getOrderReturnExtraFields",
      description: "Return extra fields defined for order returns.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getOrderReturnStatusList",
      description: "Retrieve order return statuses created by the user.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getOrderReturnStatusGroups",
      description: "Return the list of order return status groups.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getOrderReturnProductStatuses",
      description: "Retrieve available return item statuses assignable to returned products.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getOrderReturnReasonsList",
      description: "Retrieve the list of order return reasons.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getOrderReturnPaymentsHistory",
      description: "Retrieve payment history for an order return. Optional: show_full_history.",
      mode: "read",
      schema: z.object({ return_id: z.number().describe("Order return identifier") }).passthrough(),
    },
    {
      name: "getOrderReturnJournalList",
      description:
        "Download order return events (journal) from the last 3 days. Paginate incrementally via last_log_id. Optional: last_log_id, logs_types, return_id.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "addOrderReturn",
      description: "Add a new order return to BaseLinker.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().optional().describe("Order identifier in the BaseLinker panel"),
          status_id: z.number().describe("Return status (retrieve via getOrderReturnStatusList)"),
          custom_source_id: z.number().optional().describe("Custom order source identifier"),
          reference_number: z.string().optional().describe("External source reference number"),
          date_add: z.number().describe("Creation timestamp (Unix format)"),
          currency: z.string().describe("Three-letter currency code (e.g. EUR)"),
          refunded: z.boolean().describe("Whether the refund has been issued"),
          admin_comments: z.string().optional().describe("Seller notes (up to 200 chars)"),
          email: z.string().optional().describe("Customer email address"),
          phone: z.string().optional().describe("Customer phone number"),
          user_login: z.string().optional().describe("Marketplace username"),
          delivery_price: z.number().optional().describe("Gross shipping cost"),
          delivery_fullname: z.string().optional().describe("Recipient name and surname"),
          delivery_company: z.string().optional().describe("Recipient company"),
          delivery_address: z.string().optional().describe("Street and building number"),
          delivery_postcode: z.string().optional().describe("Postal code"),
          delivery_city: z.string().optional().describe("City name"),
          delivery_state: z.string().optional().describe("State or province"),
          delivery_country_code: z.string().optional().describe("Two-letter country code"),
          extra_field_1: z.string().optional().describe("Custom field 1 value"),
          extra_field_2: z.string().optional().describe("Custom field 2 value"),
          custom_extra_fields: z
            .record(z.unknown())
            .optional()
            .describe("Custom fields keyed by field ID"),
          products: z
            .array(z.record(z.unknown()))
            .describe("Returned items with detailed specifications"),
          refund_account_number: z.string().optional().describe("Bank account for refund"),
          refund_iban: z.string().optional().describe("IBAN for refund processing"),
          refund_swift: z.string().optional().describe("SWIFT code for refund"),
        })
        .passthrough(),
    },
    {
      name: "setOrderReturnFields",
      description:
        "Edit selected fields of an existing order return; only the provided fields are updated.",
      mode: "write",
      schema: z
        .object({
          return_id: z.number().describe("Order return identifier"),
          admin_comments: z.string().optional().describe("Seller comments"),
          email: z.string().optional().describe("Buyer email address"),
          phone: z.string().optional().describe("Buyer phone number"),
          user_login: z.string().optional().describe("Buyer login"),
          delivery_price: z.number().optional().describe("Gross delivery price"),
          delivery_fullname: z.string().optional().describe("Delivery address - name and surname"),
          delivery_company: z.string().optional().describe("Delivery address - company"),
          delivery_address: z.string().optional().describe("Delivery address - street and number"),
          delivery_postcode: z.string().optional().describe("Delivery address - postcode"),
          delivery_city: z.string().optional().describe("Delivery address - city"),
          delivery_state: z.string().optional().describe("Delivery address - state/province"),
          delivery_country_code: z.string().optional().describe("Two-letter country code"),
          extra_field_1: z.string().optional().describe("Custom extra field value"),
          extra_field_2: z.string().optional().describe("Custom extra field value"),
          custom_extra_fields: z
            .record(z.unknown())
            .optional()
            .describe("Custom extra fields keyed by field ID with field content as value"),
        })
        .passthrough(),
    },
    {
      name: "addOrderReturnProduct",
      description: "Add a new product to an existing order return.",
      mode: "write",
      schema: z
        .object({
          return_id: z.number().describe("Order return identifier"),
          order_product_id: z
            .number()
            .optional()
            .describe("ID of the connected order item from BaseLinker"),
          storage: z
            .string()
            .optional()
            .describe("Product source storage type (db/shop/warehouse)"),
          storage_id: z.string().optional().describe("Identifier of the storage source"),
          product_id: z.string().optional().describe("Product identifier in storage"),
          variant_id: z.string().optional().describe("Product variant ID"),
          auction_id: z.string().optional().describe("Listing ID for eBay/Allegro orders"),
          name: z.string().optional().describe("Product name"),
          sku: z.string().optional().describe("Product SKU number"),
          ean: z.string().optional().describe("Product EAN number"),
          location: z.string().optional().describe("Product location"),
          warehouse_id: z.number().optional().describe("Source warehouse identifier"),
          attributes: z.string().optional().describe('Product attributes (e.g. "Colour: blue")'),
          price_brutto: z.number().optional().describe("Single item gross price"),
          tax_rate: z.number().optional().describe("VAT rate (0-100, or special values)"),
          quantity: z.number().optional().describe("Number of pieces"),
          weight: z.number().optional().describe("Single piece weight"),
          status_id: z.number().optional().describe("Return item status identifier"),
          return_reason_id: z.number().optional().describe("Return reason identifier"),
        })
        .passthrough(),
    },
    {
      name: "deleteOrderReturnProduct",
      description: "Permanently delete a specific product item from an order return.",
      mode: "write",
      schema: z
        .object({
          return_id: z.number().describe("Order return identifier"),
          order_return_product_id: z
            .number()
            .describe("Identifier of the specific product item within the return"),
        })
        .passthrough(),
    },
    {
      name: "setOrderReturnProductFields",
      description:
        "Edit selected fields (such as pricing and quantities) of an item within an order return.",
      mode: "write",
      schema: z
        .object({
          return_id: z.number().describe("Order return identifier from BaseLinker"),
          order_return_product_id: z.number().describe("Order return item ID from BaseLinker"),
          storage: z
            .string()
            .optional()
            .describe('Product source storage type ("db", "shop", or "warehouse")'),
          storage_id: z
            .string()
            .optional()
            .describe("Storage identifier (inventory/shop/warehouse)"),
          product_id: z
            .string()
            .optional()
            .describe("Product identifier in BaseLinker or shop storage"),
          variant_id: z.string().optional().describe("Product variant ID"),
          auction_id: z.string().optional().describe("Listing ID for eBay/Allegro orders"),
          name: z.string().optional().describe("Product name"),
          sku: z.string().optional().describe("Product SKU number"),
          ean: z.string().optional().describe("Product EAN number"),
          location: z.string().optional().describe("Product location"),
          warehouse_id: z.number().optional().describe("Product source warehouse identifier"),
          attributes: z
            .string()
            .optional()
            .describe('Detailed product attributes (e.g. "Colour: blue")'),
          price_brutto: z.number().optional().describe("Single item gross price"),
          tax_rate: z
            .number()
            .optional()
            .describe("VAT tax rate (0-100, or special values -1, -0.02, -0.03)"),
          quantity: z.number().optional().describe("Number of pieces"),
          weight: z.number().optional().describe("Single piece weight"),
          status_id: z.number().optional().describe("Product return status identifier"),
          return_reason_id: z.number().optional().describe("Return reason identifier"),
        })
        .passthrough(),
    },
    {
      name: "addOrderReturnStatus",
      description:
        "Create a new order return status, or update an existing one when status_id is provided.",
      mode: "write",
      schema: z
        .object({
          status_id: z
            .number()
            .optional()
            .describe("Identifier for updating an existing status; omit when creating new"),
          name: z.string().describe("Status name (basic) displayed in the panel"),
          name_for_customer: z
            .string()
            .optional()
            .describe(
              "Full status name shown to customers; plain text or JSON with language codes",
            ),
          color: z.string().optional().describe('Status color in hex format (e.g. "#FF0000")'),
          group_id: z
            .number()
            .optional()
            .describe("Assigns status to a group; defaults to main group if omitted on creation"),
        })
        .passthrough(),
    },
    {
      name: "addOrderReturnStatusGroup",
      description:
        "Create a new return status group, or update an existing one when group_id is provided.",
      mode: "write",
      schema: z
        .object({
          group_id: z
            .number()
            .optional()
            .describe("Identifier for updating an existing group; omit when creating new"),
          name: z.string().describe("Group name (max 15 characters)"),
        })
        .passthrough(),
    },
    {
      name: "deleteOrderReturnStatus",
      description:
        "Permanently delete an order return status and migrate its returns to a replacement status. The primary (default) status cannot be deleted.",
      mode: "write",
      schema: z
        .object({
          status_id: z.number().describe("ID of the status being removed"),
          target_status_id: z
            .number()
            .describe(
              "ID of the replacement status for migrating returns; must differ from status_id",
            ),
        })
        .passthrough(),
    },
    {
      name: "deleteOrderReturnStatusGroup",
      description:
        "Permanently delete an order return status group; statuses within it are reassigned to the default group.",
      mode: "write",
      schema: z
        .object({
          group_id: z.number().describe("Identifier of the status group to be removed"),
        })
        .passthrough(),
    },
    {
      name: "setOrderReturnStatus",
      description: "Change the status assigned to a single order return.",
      mode: "write",
      schema: z
        .object({
          return_id: z.number().describe("Order return ID number"),
          status_id: z
            .number()
            .describe("Status ID number (retrieve via getOrderReturnStatusList)"),
        })
        .passthrough(),
    },
    {
      name: "setOrderReturnStatuses",
      description:
        "Batch update the status of multiple order returns by applying a single status to all of them.",
      mode: "write",
      schema: z
        .object({
          return_ids: z
            .array(z.number())
            .describe("Collection of order return ID numbers to update"),
          status_id: z
            .number()
            .describe("Status identifier to assign (retrieve via getOrderReturnStatusList)"),
        })
        .passthrough(),
    },
    {
      name: "setOrderReturnRefund",
      description:
        "Record a refund against an order return; this does not process an actual money transfer.",
      mode: "write",
      schema: z
        .object({
          return_id: z.number().describe("Identifier of the order return being refunded"),
          order_refund_done: z
            .number()
            .describe(
              "Refund amount (replaces previous value; if equal to total order value, marks order as fully refunded)",
            ),
          refund_date: z.number().describe("When the refund occurred (Unix timestamp)"),
          refund_comment: z
            .string()
            .describe("Additional notes about the refund (max 50 characters)"),
          external_refund_id: z
            .string()
            .optional()
            .describe("Third-party refund identifier (max 50 characters)"),
        })
        .passthrough(),
    },
    {
      name: "runOrderReturnMacroTrigger",
      description: "Run a personal automatic-action macro trigger on an order return.",
      mode: "write",
      schema: z
        .object({
          return_id: z
            .number()
            .describe("Order return identifier from the BaseLinker order manager"),
          trigger_id: z
            .number()
            .describe("Identifier of the personal trigger from orders automatic actions"),
        })
        .passthrough(),
    },
  ],
};
