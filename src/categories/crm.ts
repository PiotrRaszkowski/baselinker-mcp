import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

export const crmCategory: CategoryDef = {
  toolName: "baselinker_crm",
  title: "BaseLinker CRM Clients",
  description: "Read CRM clients, their details, extra fields and statuses.",
  methods: [
    {
      name: "getCrmClients",
      description: "Retrieve CRM clients. 100 results per page; use the page parameter (from 1).",
      mode: "read",
      schema: z
        .object({
          page: z.number().optional().describe("Results page number (100 per page, from 1)"),
          filter_crm_client_id: z
            .number()
            .optional()
            .describe("Filter by exact CRM client ID"),
          filter_email: z.string().optional().describe("Filter by email (partial match)"),
          filter_phone: z.string().optional().describe("Filter by phone (partial match)"),
          filter_login: z.string().optional().describe("Filter by login (partial match)"),
          filter_invoice_company: z
            .string()
            .optional()
            .describe("Filter by invoice company name (partial match)"),
          filter_invoice_tax_id: z
            .string()
            .optional()
            .describe("Filter by invoice tax ID (partial match)"),
          filter_invoice_fullname: z
            .string()
            .optional()
            .describe("Filter by invoice full name (partial match)"),
          filter_status_id: z.number().optional().describe("Filter by exact status ID"),
        })
        .passthrough(),
    },
    {
      name: "getCrmClientData",
      description:
        "Retrieve detailed data of a specific CRM client, including notes. Optional: include_custom_extra_fields.",
      mode: "read",
      schema: z
        .object({ crm_client_id: z.number().describe("CRM client identifier") })
        .passthrough(),
    },
    {
      name: "getCrmClientExtraFields",
      description: "Retrieve extra fields defined for CRM clients.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getCrmClientStatuses",
      description: "Retrieve CRM client statuses configured by the user.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getCrmClientStatusGroups",
      description: "Return the list of CRM client status groups.",
      mode: "read",
      schema: emptySchema,
    },
  ],
};
