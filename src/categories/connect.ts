import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

export const connectCategory: CategoryDef = {
  toolName: "baselinker_connect",
  title: "BaseLinker Base Connect",
  description:
    "Read Base Connect integrations, their contractors and contractor trade credit history.",
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
  ],
};
