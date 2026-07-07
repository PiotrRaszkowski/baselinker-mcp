import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";
import { fileTransform, SAVE_TO_PATH_PARAM } from "../result.js";

export const invoicesCategory: CategoryDef = {
  toolName: "baselinker_invoices",
  title: "BaseLinker Invoices & Receipts",
  description:
    "Read invoices, invoice files (PDF), numbering series and receipts from the BaseLinker order manager.",
  methods: [
    {
      name: "getInvoices",
      description:
        "Download issued invoices. Max 100 per call; to page, pass id_from = last received invoice_id + 1.",
      mode: "read",
      schema: z
        .object({
          invoice_id: z.number().optional().describe("Retrieve a single specific invoice"),
          order_id: z.number().optional().describe("Invoice associated with a particular order"),
          date_from: z
            .number()
            .optional()
            .describe("Unix timestamp to collect invoices from"),
          id_from: z
            .number()
            .optional()
            .describe("Invoice ID to start retrieving subsequent invoices from (pagination key)"),
          series_id: z.number().optional().describe("Filter by invoice numbering series"),
          get_external_invoices: z
            .boolean()
            .optional()
            .describe("When false, excludes invoices with external files"),
          get_government_data: z
            .boolean()
            .optional()
            .describe("Include government fields (gov_id, gov_date, gov_status)"),
        })
        .passthrough(),
    },
    {
      name: "getInvoiceFile",
      description:
        "Get the invoice file (PDF). Provide save_to_path to write it to disk; otherwise it is returned as an embedded resource. Optional: get_external.",
      mode: "read",
      schema: z
        .object({
          invoice_id: z.number().describe("BaseLinker invoice identifier"),
          [SAVE_TO_PATH_PARAM]: z
            .string()
            .optional()
            .describe("Local file path to save the decoded file to (not sent to the API)"),
        })
        .passthrough(),
      transformResult: fileTransform("invoice", "pdf"),
    },
    {
      name: "getSeries",
      description: "Download invoice/receipt numbering series.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getReceipt",
      description:
        "Retrieve a single receipt. Provide receipt_id or order_id (at least one).",
      mode: "read",
      schema: z
        .object({
          receipt_id: z.number().optional().describe("Receipt identifier"),
          order_id: z.number().optional().describe("Order identifier"),
        })
        .passthrough()
        .refine(
          (params) => params.receipt_id !== undefined || params.order_id !== undefined,
          { message: "Provide receipt_id or order_id" },
        ),
    },
    {
      name: "getReceipts",
      description:
        "Retrieve issued receipts. Max 100 per call; to page, pass id_from = highest receipt_id from the previous response + 1. Optional: series_id, id_from, date_from, date_to.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getNewReceipts",
      description:
        "Retrieve receipts awaiting issuance (fiscal printer integration). Paginate via id_from. Optional: series_id, id_from.",
      mode: "read",
      schema: emptySchema,
    },
  ],
};
