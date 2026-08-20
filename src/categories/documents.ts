import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";
import { fileArrayTransform, fileTransform, SAVE_TO_PATH_PARAM } from "../result.js";

const saveToPathSchema = z
  .string()
  .optional()
  .describe("Local file path to save the decoded file to (not sent to the API)");

export const documentsCategory: CategoryDef = {
  toolName: "baselinker_documents",
  title: "BaseLinker Warehouse Documents",
  description:
    "Read warehouse documents, purchase orders and fulfillment deliveries from BaseLinker storage, and create them (documents, purchase orders, fulfillment deliveries) with their items, confirm/update their status and upload document files.",
  methods: [
    {
      name: "getInventoryDocuments",
      description:
        "Retrieve inventory (warehouse) documents. 100 per page; use the page parameter (from 1).",
      mode: "read",
      schema: z
        .object({
          filter_source_object_type: z
            .number()
            .optional()
            .describe(
              "Source object type: 1 order, 2 purchase order, 3 stock take, 4 order return, 7 fulfillment delivery, 8 transfer",
            ),
          filter_source_object_id: z.number().optional().describe("Source object identifier"),
          filter_document_id: z.number().optional().describe("Specific inventory document ID"),
          filter_document_type: z
            .number()
            .optional()
            .describe("Document type: 0 GR, 1 IGR, 2 GI, 3 IGI, 4 IT, 5 OB"),
          filter_document_status: z.number().optional().describe("Status: 0 draft, 1 confirmed"),
          filter_date_from: z
            .number()
            .optional()
            .describe("Minimum creation date (unix timestamp)"),
          filter_date_to: z.number().optional().describe("Maximum creation date (unix timestamp)"),
          filter_warehouse_id: z.number().optional().describe("Warehouse identifier"),
          page: z.number().optional().describe("Results page (1-based, 100 per page)"),
        })
        .passthrough(),
    },
    {
      name: "getInventoryDocumentItems",
      description:
        "Retrieve items of a specific inventory document. 100 per page via the page parameter.",
      mode: "read",
      schema: z.object({ document_id: z.number().describe("Inventory document ID") }).passthrough(),
    },
    {
      name: "getInventoryDocumentFile",
      description:
        "Download a warehouse document PDF. Provide save_to_path to write it to disk; otherwise it is returned as an embedded resource. Optional: get_external.",
      mode: "read",
      schema: z
        .object({
          document_id: z.number().describe("Warehouse document identifier"),
          [SAVE_TO_PATH_PARAM]: saveToPathSchema,
        })
        .passthrough(),
      transformResult: fileTransform("file", "pdf"),
    },
    {
      name: "getInventoryDocumentSeries",
      description:
        "Retrieve available inventory document series with warehouse and numbering settings.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryPurchaseOrders",
      description: "Retrieve purchase orders. 100 per page; use the page parameter.",
      mode: "read",
      schema: z
        .object({
          warehouse_id: z.number().optional().describe("Filter by warehouse identifier"),
          supplier_id: z.number().optional().describe("Filter by supplier identifier"),
          series_id: z.number().optional().describe("Filter by document series identifier"),
          date_from: z.number().optional().describe("Start date (unix timestamp)"),
          date_to: z.number().optional().describe("End date (unix timestamp)"),
          filter_document_number: z
            .string()
            .optional()
            .describe("Partial or full document number match"),
          filter_product_id: z
            .number()
            .optional()
            .describe("Filter by product ID contained in orders"),
          page: z.number().optional().describe("Results page (100 per page)"),
        })
        .passthrough(),
    },
    {
      name: "getInventoryPurchaseOrderItems",
      description:
        "Retrieve items from a specific purchase order. 100 per page via the page parameter.",
      mode: "read",
      schema: z
        .object({ order_id: z.number().describe("Purchase order identifier") })
        .passthrough(),
    },
    {
      name: "getInventoryPurchaseOrderSeries",
      description: "Retrieve available purchase order document series. Optional: warehouse_id.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryFulfillmentDeliveries",
      description:
        "Retrieve fulfillment deliveries. Max 100 per page; the page parameter is 0-based. Optional: fulfillment_warehouse_id, fulfillment_warehouse_ids, warehouse_id, status, statuses, date_from, date_to, filter_document_number, page.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryFulfillmentDeliveryItems",
      description:
        "Retrieve items from a specific fulfillment delivery. 100 per page; the page parameter is 0-based.",
      mode: "read",
      schema: z
        .object({ delivery_id: z.number().describe("Fulfillment delivery identifier") })
        .passthrough(),
    },
    {
      name: "getInventoryFulfillmentDeliveryLabels",
      description:
        "Download labels of a selected type for a fulfillment delivery. Provide save_to_path to write files to disk (multiple labels get -1, -2... suffixes); otherwise they are returned as embedded resources.",
      mode: "read",
      schema: z
        .object({
          delivery_id: z.number().describe("Fulfillment delivery identifier"),
          type: z.string().describe("Label type to download: delivery, box or item"),
          [SAVE_TO_PATH_PARAM]: saveToPathSchema,
        })
        .passthrough(),
      transformResult: fileArrayTransform("labels", "label"),
    },
    {
      name: "addInventoryDocument",
      description: "Create a new inventory (warehouse) document as a draft awaiting confirmation.",
      mode: "write",
      schema: z
        .object({
          warehouse_id: z.number().describe("Source warehouse identifier"),
          document_type: z.number().describe("Document type: 0 GR, 1 IGR, 2 GI, 3 IGI, 4 IT, 5 OB"),
          target_warehouse_id: z
            .number()
            .optional()
            .describe("Destination warehouse ID; needed only for transfer documents"),
          date_add: z
            .number()
            .optional()
            .describe("Document creation date (unix timestamp); defaults to current date"),
          date_execute: z
            .number()
            .optional()
            .describe("Document execution date (unix timestamp); defaults to current date"),
          contractor: z
            .string()
            .optional()
            .describe("Contractor information or supplementary notes"),
          invoice_no: z.string().optional().describe("Associated invoice reference number"),
          notes: z.string().optional().describe("Additional document remarks or commentary"),
        })
        .passthrough(),
    },
    {
      name: "addInventoryDocumentItems",
      description: "Add items to an existing inventory document.",
      mode: "write",
      schema: z
        .object({
          document_id: z.number().describe("Inventory document identifier"),
          items: z
            .array(z.record(z.unknown()))
            .describe(
              "List of document items. Each: product_id (int, required), quantity (int, required), price (float, optional), location_name (string, optional), target_location_name (string, optional, internal transfer only), expiry_date (string YYYY-MM-DD, optional), batch (string, optional), serial_no (string, optional), comments (string, optional)",
            ),
        })
        .passthrough(),
    },
    {
      name: "addInventoryDocumentFile",
      description:
        "Attach an external PDF file to a warehouse document; the file is a base64-encoded string prefixed with 'data:'.",
      mode: "write",
      schema: z
        .object({
          document_id: z.number().describe("Warehouse document identifier from BaseLinker"),
          file: z
            .string()
            .describe(
              "Base64-encoded PDF file prefixed with 'data:' (e.g. 'data:4AAQSkZJRgABA[...]')",
            ),
          external_document_number: z
            .string()
            .describe("Reference number from the originating external system (max 100 chars)"),
        })
        .passthrough(),
    },
    {
      name: "setInventoryDocumentStatusConfirmed",
      description: "Confirm a draft inventory document; this affects warehouse stock levels.",
      mode: "write",
      schema: z
        .object({
          document_id: z.number().describe("Identifier of the inventory document to be confirmed"),
        })
        .passthrough(),
    },
    {
      name: "addInventoryPurchaseOrder",
      description:
        "Create a new purchase order in the inventory system; it defaults to draft status.",
      mode: "write",
      schema: z
        .object({
          warehouse_id: z.number().describe("Warehouse identifier"),
          supplier_id: z.number().describe("Supplier identifier"),
          payer_id: z.number().describe("Payer identifier"),
          currency: z.string().describe("Order currency (e.g. EUR, USD)"),
          name: z.string().optional().describe("Order designation (max 80 characters)"),
          notes: z.string().optional().describe("Order description or additional details"),
          invoice_no: z
            .string()
            .optional()
            .describe("Related invoice reference (max 50 characters)"),
          date_delivery_expected: z
            .number()
            .optional()
            .describe("Anticipated delivery date (unix timestamp)"),
        })
        .passthrough(),
    },
    {
      name: "addInventoryPurchaseOrderItems",
      description:
        "Add items to an existing purchase order; matching positions are updated, differing ones are created.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Purchase order identifier"),
          items: z
            .array(z.record(z.unknown()))
            .describe(
              "List of items. Each: product_id (int, required), quantity (int, required), item_cost (float, required), supplier_code (string, optional), location (string, optional), batch (string, optional), expiry_date (string, optional), serial_no (string, optional), comments (string, optional)",
            ),
        })
        .passthrough(),
    },
    {
      name: "setInventoryPurchaseOrderStatus",
      description: "Change the status assigned to a purchase order.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Purchase order identifier"),
          status: z
            .number()
            .describe(
              "New status: 0 draft, 1 sent, 2 received, 3 completed, 4 partially completed, 5 canceled, 6 received/not started",
            ),
          completed_items: z
            .array(z.record(z.unknown()))
            .optional()
            .describe("List of received items. Each: item_id (int), completed_quantity (int)"),
        })
        .passthrough(),
    },
    {
      name: "addInventoryFulfillmentDelivery",
      description:
        "Create a new draft fulfillment delivery shipping products from a source warehouse to a fulfillment center.",
      mode: "write",
      schema: z
        .object({
          warehouse_id: z.number().describe("Source warehouse identifier"),
          fulfillment_warehouse_id: z
            .number()
            .describe("Fulfillment warehouse identifier receiving the goods"),
          name: z.string().describe("Label for the delivery (max 80 characters)"),
        })
        .passthrough(),
    },
    {
      name: "addInventoryFulfillmentDeliveryItems",
      description: "Add products to a draft fulfillment delivery.",
      mode: "write",
      schema: z
        .object({
          delivery_id: z.number().describe("Fulfillment delivery identifier receiving items"),
          items: z
            .array(z.record(z.unknown()))
            .describe(
              "List of products. Each: product_id (int, required), quantity (int, required)",
            ),
        })
        .passthrough(),
    },
  ],
};
