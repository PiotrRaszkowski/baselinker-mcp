import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

export const crmCategory: CategoryDef = {
  toolName: "baselinker_crm",
  title: "BaseLinker CRM Clients",
  description:
    "Read CRM clients, their details, extra fields and statuses, and create, update or delete CRM clients, client statuses and status groups.",
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
    {
      name: "addCrmClient",
      description:
        "Create a new CRM client, or update an existing one when crm_client_id is provided and greater than 0 (a new client is created when it is 0 or absent).",
      mode: "write",
      schema: z
        .object({
          crm_client_id: z
            .number()
            .optional()
            .describe(
              "CRM client identifier; updates the existing client when greater than 0, creates a new one when 0 or absent",
            ),
          status_id: z.number().optional().describe("CRM client status identifier"),
          star: z.number().optional().describe("Rating from 0-5 (0 means no star)"),
          contractor_id: z
            .number()
            .optional()
            .describe("BaseLinker Connect contractor association ID"),
          login: z.string().optional().describe("Client login name"),
          phone: z.string().optional().describe("Client phone number"),
          email: z.string().optional().describe("Client email address"),
          notes: z.string().optional().describe("Client notes"),
          invoice_company: z.string().optional().describe("Billing company name"),
          invoice_fullname: z.string().optional().describe("Billing full name"),
          invoice_address: z.string().optional().describe("Billing address"),
          invoice_postcode: z.string().optional().describe("Billing postcode"),
          invoice_city: z.string().optional().describe("Billing city"),
          invoice_state: z.string().optional().describe("Billing state/province"),
          invoice_country_code: z
            .string()
            .optional()
            .describe("Billing ISO 3166-1 alpha-2 country code"),
          invoice_tax_id: z
            .string()
            .optional()
            .describe("Billing tax ID (whitespace and dashes are auto-removed)"),
          delivery_company: z.string().optional().describe("Shipping company name"),
          delivery_fullname: z.string().optional().describe("Shipping full name"),
          delivery_address: z.string().optional().describe("Shipping address"),
          delivery_postcode: z.string().optional().describe("Shipping postcode"),
          delivery_city: z.string().optional().describe("Shipping city"),
          delivery_state: z.string().optional().describe("Shipping state/province"),
          delivery_country_code: z
            .string()
            .optional()
            .describe("Shipping ISO 3166-1 alpha-2 country code"),
          custom_extra_fields: z
            .record(z.unknown())
            .optional()
            .describe(
              "Custom field key-value pairs (supports files in base64 format)",
            ),
        })
        .passthrough(),
    },
    {
      name: "deleteCrmClient",
      description:
        "Permanently delete a CRM client while preserving any previously associated orders.",
      mode: "write",
      schema: z
        .object({
          crm_client_id: z.number().describe("ID of the CRM client to delete"),
        })
        .passthrough(),
    },
    {
      name: "addCrmClientStatus",
      description:
        "Create a new CRM client status, or update an existing one when status_id is provided (a new status is created when it is absent or 0).",
      mode: "write",
      schema: z
        .object({
          status_id: z
            .number()
            .optional()
            .describe(
              "Status ID; provide to update an existing status, leave empty or omit to create a new one",
            ),
          name: z.string().describe("Status name displayed in the panel"),
          color: z.string().describe('Status color in hex format (e.g. "#FF0000")'),
          group_id: z
            .number()
            .optional()
            .describe(
              "Status group; uses the default group if omitted on creation, or retains the existing assignment on updates",
            ),
        })
        .passthrough(),
    },
    {
      name: "addCrmClientStatusGroup",
      description:
        "Create a new CRM client status group, or update an existing one when group_id is provided (a new group is created when it is absent or 0).",
      mode: "write",
      schema: z
        .object({
          group_id: z
            .number()
            .optional()
            .describe(
              "Group ID; provide to update an existing group, leave empty or omit to create a new one",
            ),
          name: z.string().describe("Group name (maximum 15 characters)"),
        })
        .passthrough(),
    },
    {
      name: "deleteCrmClientStatus",
      description:
        "Permanently delete a CRM client status and reassign any clients with that status to a replacement status.",
      mode: "write",
      schema: z
        .object({
          status_id: z.number().describe("Identifier of the status to be removed"),
          target_status_id: z
            .number()
            .describe(
              "Identifier of the replacement status for migrated clients; cannot match status_id",
            ),
        })
        .passthrough(),
    },
    {
      name: "deleteCrmClientStatusGroup",
      description:
        "Permanently delete a CRM client status group, reassigning all its statuses to the default group; the main group itself cannot be deleted.",
      mode: "write",
      schema: z
        .object({
          group_id: z.number().describe("ID of the status group to delete"),
        })
        .passthrough(),
    },
  ],
};
