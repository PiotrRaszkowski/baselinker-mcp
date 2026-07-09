import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";
import { fileTransform, SAVE_TO_PATH_PARAM } from "../result.js";

export const invoicesCategory: CategoryDef = {
  toolName: "baselinker_invoices",
  title: "BaseLinker Invoices & Receipts",
  description:
    "Read invoices, invoice files (PDF), numbering series and receipts from the BaseLinker order manager, and issue invoices, invoice corrections and receipts, upload external invoice/receipt files and mark orders as receipted.",
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
    {
      name: "addInvoice",
      description: "Issue an invoice for an order.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier from the BaseLinker order manager"),
          series_id: z.number().describe("Series numbering identifier"),
          vat_rate: z
            .string()
            .optional()
            .describe(
              "VAT rate: DEFAULT (per series), ITEM (per order item), EXPT/ZW (VAT exempt), NP (annotation), OO (reverse charge), or a number 0-100",
            ),
        })
        .passthrough(),
    },
    {
      name: "addInvoiceCorrection",
      description: "Issue a correction to a previously issued order invoice.",
      mode: "write",
      schema: z
        .object({
          original_invoice_id: z.number().describe("Original invoice identifier"),
          return_order_id: z
            .number()
            .optional()
            .describe("Return order identifier (alternative source instead of original_invoice_id)"),
          series_id: z.number().optional().describe("Series numbering identifier"),
          date_sell: z.number().optional().describe("Sell date as a Unix timestamp"),
          correcting_reason: z
            .number()
            .optional()
            .describe(
              "Correction reason code 1-9 (e.g. prepayments return, discounts, price increase, refunds, returns, pricing errors, address correction, contract withdrawal, other)",
            ),
          correcting_items: z
            .boolean()
            .optional()
            .describe("Whether to correct invoice items"),
          correcting_data: z
            .boolean()
            .optional()
            .describe("Whether to correct invoice data"),
          invoice_fullname: z.string().optional().describe("Full name for the invoice"),
          invoice_company: z.string().optional().describe("Company name"),
          invoice_address: z.string().optional().describe("Address"),
          invoice_postcode: z.string().optional().describe("Postal code"),
          invoice_city: z.string().optional().describe("City"),
          invoice_state: z.string().optional().describe("State/province"),
          invoice_country_code: z.string().optional().describe("Country code (e.g. PL)"),
          invoice_nip: z.string().optional().describe("Tax ID number"),
          items: z
            .array(z.record(z.unknown()))
            .optional()
            .describe("Array of items to correct"),
          fv_payment: z.string().optional().describe("Payment method"),
          fv_person: z.string().optional().describe("Issuer name"),
        })
        .passthrough(),
    },
    {
      name: "addOrderInvoiceFile",
      description:
        "Attach an external invoice file (PDF or XML) to a previously issued BaseLinker invoice, replacing the standard invoice.",
      mode: "write",
      schema: z
        .object({
          invoice_id: z.number().describe("BaseLinker invoice identifier"),
          file: z
            .string()
            .describe(
              "PDF or XML file encoded in base64, prefixed with 'data:'",
            ),
          external_invoice_number: z
            .string()
            .optional()
            .describe("Invoice number from the external system that overwrites the BaseLinker invoice number"),
        })
        .passthrough(),
    },
    {
      name: "addReceipt",
      description: "Issue a receipt for an order.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier"),
          series_id: z
            .number()
            .optional()
            .describe("Receipt numbering series identifier; the default receipt series is used when omitted"),
        })
        .passthrough(),
    },
    {
      name: "addOrderReceiptFile",
      description:
        "Attach an external PDF receipt file to a previously issued BaseLinker receipt, replacing the standard receipt.",
      mode: "write",
      schema: z
        .object({
          receipt_id: z.number().describe("BaseLinker receipt identifier"),
          file: z
            .string()
            .describe(
              "Receipt PDF file encoded in base64, prefixed with 'data:'",
            ),
          external_receipt_number: z
            .string()
            .optional()
            .describe("External system receipt number that overwrites the BaseLinker receipt number"),
        })
        .passthrough(),
    },
    {
      name: "setOrderReceipt",
      description:
        "Mark an order as having its receipt issued (used with fiscal printer integration via getNewReceipts).",
      mode: "write",
      schema: z
        .object({
          receipt_id: z.number().describe("Receipt ID obtained from the getNewReceipts method"),
          receipt_nr: z
            .string()
            .describe("Number of the issued receipt (can be blank if the printer does not provide one)"),
          date: z.number().describe("Receipt printing date as a Unix timestamp"),
          printer_error: z
            .boolean()
            .describe("Whether receipt printing encountered an error"),
          printer_name: z.string().optional().describe("Name of the printer used"),
        })
        .passthrough(),
    },
  ],
};
