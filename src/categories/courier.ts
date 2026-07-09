import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";
import { fileTransform, SAVE_TO_PATH_PARAM } from "../result.js";

const saveToPathSchema = z
  .string()
  .optional()
  .describe("Local file path to save the decoded file to (not sent to the API)");

export const courierCategory: CategoryDef = {
  toolName: "baselinker_courier",
  title: "BaseLinker Courier Shipments",
  description:
    "Read courier and shipment data: couriers, accounts, shipment fields/services, packages, status history, labels, protocols and documents. Also creates and deletes courier shipments and requests parcel pickups.",
  methods: [
    {
      name: "getCouriersList",
      description: "Retrieve the list of available couriers.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getCourierAccounts",
      description: "Retrieve accounts connected with a given courier.",
      mode: "read",
      schema: z.object({ courier_code: z.string().describe("Courier code") }).passthrough(),
    },
    {
      name: "getCourierFields",
      description: "Retrieve form fields required to create shipments for a given courier.",
      mode: "read",
      schema: z.object({ courier_code: z.string().describe("Courier code") }).passthrough(),
    },
    {
      name: "getCourierServices",
      description:
        "Retrieve additional courier services based on shipment settings. Optional: account_id.",
      mode: "read",
      schema: z
        .object({
          courier_code: z.string().describe("Courier code"),
          order_id: z.number().describe("Order identifier"),
          fields: z
            .array(z.record(z.unknown()))
            .describe("Shipment form fields (createPackage format, keyed by field id)"),
          packages: z
            .array(z.record(z.unknown()))
            .describe("Package details (createPackage structure)"),
        })
        .passthrough(),
    },
    {
      name: "getOrderPackages",
      description: "Download shipments previously created for the selected order.",
      mode: "read",
      schema: z.object({ order_id: z.number().describe("Order identifier") }).passthrough(),
    },
    {
      name: "getPackageDetails",
      description: "Retrieve detailed information about a shipment, including subpackages.",
      mode: "read",
      schema: z.object({ package_id: z.number().describe("Shipment ID") }).passthrough(),
    },
    {
      name: "getCourierPackagesStatusHistory",
      description: "Retrieve status history of the given shipments (max 100 IDs per request).",
      mode: "read",
      schema: z
        .object({
          package_ids: z
            .array(z.number())
            .describe("List of parcel IDs (max 100 per request)"),
        })
        .passthrough(),
    },
    {
      name: "getLabel",
      description:
        "Download a shipping label for a shipment. Provide package_id or package_number. Provide save_to_path to write the file to disk; otherwise it is returned as an embedded resource.",
      mode: "read",
      schema: z
        .object({
          courier_code: z.string().describe("Courier code"),
          package_id: z
            .number()
            .optional()
            .describe("Shipment ID (this or package_number is required)"),
          package_number: z
            .string()
            .optional()
            .describe("Shipping/consignment number (alternative to package_id)"),
          [SAVE_TO_PATH_PARAM]: saveToPathSchema,
        })
        .passthrough()
        .refine(
          (params) => params.package_id !== undefined || params.package_number !== undefined,
          { message: "Provide package_id or package_number" },
        ),
      transformResult: fileTransform("label"),
    },
    {
      name: "getProtocol",
      description:
        "Download a parcel protocol for selected shipments (if the courier supports it). Provide package_ids or package_numbers. Provide save_to_path to write the file to disk.",
      mode: "read",
      schema: z
        .object({
          courier_code: z.string().describe("Courier code"),
          account_id: z.number().describe("Courier API account ID (see getCourierAccounts)"),
          package_ids: z
            .array(z.number())
            .optional()
            .describe("Shipment IDs (this or package_numbers is required)"),
          package_numbers: z
            .array(z.string())
            .optional()
            .describe("Shipment numbers (alternative to package_ids)"),
          [SAVE_TO_PATH_PARAM]: saveToPathSchema,
        })
        .passthrough()
        .refine(
          (params) => params.package_ids !== undefined || params.package_numbers !== undefined,
          { message: "Provide package_ids or package_numbers" },
        ),
      transformResult: fileTransform("protocol"),
    },
    {
      name: "getCourierDocument",
      description:
        "Download a parcel document (manifest/protocol/label) for a courier. Provide save_to_path to write the file to disk. Optional: package_ids, package_numbers.",
      mode: "read",
      schema: z
        .object({
          courier_code: z.string().describe("Courier code"),
          document_type: z.string().describe("Document category: manifest, protocol or label"),
          account_id: z.number().describe("Courier API account ID (see getCourierAccounts)"),
          [SAVE_TO_PATH_PARAM]: saveToPathSchema,
        })
        .passthrough(),
      transformResult: fileTransform("document"),
    },
    {
      name: "getRequestParcelPickupFields",
      description: "Retrieve additional fields required for parcel pickup requests.",
      mode: "read",
      schema: z.object({ courier_code: z.string().describe("Courier code") }).passthrough(),
    },
    {
      name: "createPackage",
      description:
        "Create a shipment in the selected courier's system. This creates a real shipment with the courier. Optional: account_id.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier"),
          courier_code: z.string().describe("Courier code identifier"),
          account_id: z
            .number()
            .optional()
            .describe("Courier API account ID; defaults to the first account if omitted"),
          fields: z
            .array(z.record(z.unknown()))
            .describe(
              "Form fields from getCourierFields; checkboxes with multiple selections use separate array entries",
            ),
          packages: z
            .array(z.record(z.unknown()))
            .describe(
              "Shipment list with dimensions (cm) and weight (kg); weight required for at least one shipment",
            ),
        })
        .passthrough(),
    },
    {
      name: "createPackageManual",
      description:
        "Attach shipping details (tracking number and courier) to an order for a shipment fulfilled outside BaseLinker. This creates a real shipment record with the courier. Optional: return_shipment.",
      mode: "write",
      schema: z
        .object({
          order_id: z.number().describe("Order identifier"),
          courier_code: z
            .string()
            .describe("Courier code (from getCouriersList or a custom name)"),
          package_number: z.string().describe("Tracking/consignment number"),
          pickup_date: z.number().describe("Dispatch timestamp (Unix format)"),
          return_shipment: z
            .boolean()
            .optional()
            .describe("Whether the shipment is a return (defaults to false)"),
        })
        .passthrough(),
    },
    {
      name: "deleteCourierPackage",
      description:
        "Permanently delete a shipment from both BaseLinker and the courier system. Provide package_id or package_number. Optional: force_delete.",
      mode: "write",
      schema: z
        .object({
          courier_code: z.string().describe("Courier identifier"),
          package_id: z
            .number()
            .optional()
            .describe("Internal shipment identifier (this or package_number is required)"),
          package_number: z
            .string()
            .optional()
            .describe("Tracking/consignment number (alternative to package_id)"),
          force_delete: z
            .boolean()
            .optional()
            .describe(
              "Remove the shipment from the BaseLinker database if courier API deletion fails (defaults to false)",
            ),
        })
        .passthrough()
        .refine(
          (params) => params.package_id !== undefined || params.package_number !== undefined,
          { message: "Provide package_id or package_number" },
        ),
    },
    {
      name: "runRequestParcelPickup",
      description:
        "Request a parcel pickup from the courier for previously created shipments. Provide package_ids or package_numbers.",
      mode: "write",
      schema: z
        .object({
          courier_code: z.string().describe("Courier provider identifier"),
          account_id: z
            .number()
            .describe("Courier API account ID (see getCourierAccounts)"),
          package_ids: z
            .array(z.number())
            .optional()
            .describe("Shipment IDs (this or package_numbers is required)"),
          package_numbers: z
            .array(z.string())
            .optional()
            .describe("Consignment numbers (alternative to package_ids)"),
          fields: z
            .array(z.record(z.unknown()))
            .describe(
              "Form fields from getRequestParcelPickupFields as key-value pairs",
            ),
        })
        .passthrough()
        .refine(
          (params) => params.package_ids !== undefined || params.package_numbers !== undefined,
          { message: "Provide package_ids or package_numbers" },
        ),
    },
  ],
};
