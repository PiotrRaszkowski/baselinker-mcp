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
    "Read warehouse documents, purchase orders and fulfillment deliveries from BaseLinker storage.",
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
          filter_source_object_id: z
            .number()
            .optional()
            .describe("Source object identifier"),
          filter_document_id: z
            .number()
            .optional()
            .describe("Specific inventory document ID"),
          filter_document_type: z
            .number()
            .optional()
            .describe("Document type: 0 GR, 1 IGR, 2 GI, 3 IGI, 4 IT, 5 OB"),
          filter_document_status: z
            .number()
            .optional()
            .describe("Status: 0 draft, 1 confirmed"),
          filter_date_from: z
            .number()
            .optional()
            .describe("Minimum creation date (unix timestamp)"),
          filter_date_to: z
            .number()
            .optional()
            .describe("Maximum creation date (unix timestamp)"),
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
      schema: z
        .object({ document_id: z.number().describe("Inventory document ID") })
        .passthrough(),
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
      description:
        "Retrieve purchase orders. 100 per page; use the page parameter.",
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
  ],
};
