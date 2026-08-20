import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

export const connectCategory: CategoryDef = {
  toolName: "baselinker_connect",
  title: "BaseLinker Base Connect",
  description:
    "Read Base Connect integrations, their contractors and contractor trade credit history, and adjust contractor trade credit by settling repayments and setting credit limits.",
  methods: [
    {
      name: "getConnectIntegrations",
      description:
        "Retrieve all Base Connect integrations on the account (own and connected integrations).",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getConnectIntegrationContractors",
      description: "Retrieve contractors connected to a selected Base Connect integration.",
      mode: "read",
      schema: z
        .object({
          connect_integration_id: z.number().describe("Connect integration ID"),
        })
        .passthrough(),
    },
    {
      name: "getConnectContractorCreditHistory",
      description: "Retrieve trade credit history for a specified contractor.",
      mode: "read",
      schema: z
        .object({ connect_contractor_id: z.number().describe("Contractor ID") })
        .passthrough(),
    },
    {
      name: "addConnectContractorCreditSettlement",
      description:
        "Record a manual trade credit repayment for a Base Connect contractor, reducing their currently blocked credit balance.",
      mode: "write",
      schema: z
        .object({
          connect_contractor_id: z
            .number()
            .describe(
              "Contractor ID. The list of contractor identifiers can be retrieved using the getConnectIntegrationContractors method",
            ),
          amount: z
            .number()
            .describe(
              "Settlement amount. Must be a positive value and cannot exceed the contractor's currently blocked credit amount (credit_to_pay)",
            ),
          message: z
            .string()
            .optional()
            .describe(
              "Settlement note/comment describing the repayment, e.g., payment reference, bank transfer ID, etc. Maximum 255 characters",
            ),
          order_id: z
            .number()
            .optional()
            .describe(
              "Related order reference; use 0 or omit if the settlement isn't tied to a specific transaction",
            ),
        })
        .passthrough(),
    },
    {
      name: "setConnectContractorCreditLimit",
      description:
        "Establish a new trade credit limit for a selected Base Connect contractor, adjusting how much credit they may use.",
      mode: "write",
      schema: z
        .object({
          connect_contractor_id: z.number().describe("Contractor ID"),
          new_limit: z.number().describe("New limit value"),
          message: z.string().describe("Message shown in trade credit history"),
        })
        .passthrough(),
    },
  ],
};
