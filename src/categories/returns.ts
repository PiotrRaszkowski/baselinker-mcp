import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

export const returnsCategory: CategoryDef = {
  toolName: "baselinker_returns",
  title: "BaseLinker Order Returns",
  description:
    "Read order returns from the BaseLinker return manager: return lists, statuses, reasons, payments and journal events.",
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
      description:
        "Retrieve payment history for an order return. Optional: show_full_history.",
      mode: "read",
      schema: z
        .object({ return_id: z.number().describe("Order return identifier") })
        .passthrough(),
    },
    {
      name: "getOrderReturnJournalList",
      description:
        "Download order return events (journal) from the last 3 days. Paginate incrementally via last_log_id. Optional: last_log_id, logs_types, return_id.",
      mode: "read",
      schema: emptySchema,
    },
  ],
};
