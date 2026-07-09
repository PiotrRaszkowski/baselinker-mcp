import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

const storageIdSchema = z
  .string()
  .describe('Storage identifier in format "[shop|warehouse]_[id]", e.g. "shop_2445"');

export const externalStorageCategory: CategoryDef = {
  toolName: "baselinker_external_storage",
  title: "BaseLinker External Storages",
  description:
    "Read products, prices, stock and categories from external storages (shops, wholesalers) connected to BaseLinker, and update external storage stock quantities.",
  methods: [
    {
      name: "getExternalStoragesList",
      description: "Retrieve the list of available external storages (shops, wholesalers).",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getExternalStorageCategories",
      description: "Retrieve the category list from an external storage.",
      mode: "read",
      schema: z.object({ storage_id: storageIdSchema }).passthrough(),
    },
    {
      name: "getExternalStorageProductsList",
      description:
        "Retrieve a product list from an external storage. Paginate with the page parameter.",
      mode: "read",
      schema: z
        .object({
          storage_id: storageIdSchema,
          filter_category_id: z
            .string()
            .optional()
            .describe("Retrieve products from a specific category"),
          filter_sort: z
            .string()
            .optional()
            .describe('Sort by "id|name|quantity|price [ASC|DESC]"'),
          filter_id: z.string().optional().describe("Limit to a specific product ID"),
          filter_sku: z.string().optional().describe("Limit to a specific SKU"),
          filter_ean: z.string().optional().describe("Limit to a specific EAN"),
          filter_asin: z.string().optional().describe("Limit to a specific ASIN"),
          filter_name: z.string().optional().describe("Filter by product name (partial match)"),
          filter_price_from: z.number().optional().describe("Minimum price"),
          filter_price_to: z.number().optional().describe("Maximum price"),
          filter_quantity_from: z.number().optional().describe("Minimum stock quantity"),
          filter_quantity_to: z.number().optional().describe("Maximum stock quantity"),
          filter_available: z
            .number()
            .optional()
            .describe("Available (1), unavailable (0) or all"),
          page: z.number().optional().describe("Results page number"),
        })
        .passthrough(),
    },
    {
      name: "getExternalStorageProductsData",
      description: "Retrieve detailed data of selected products from an external storage.",
      mode: "read",
      schema: z
        .object({
          storage_id: storageIdSchema,
          products: z
            .array(z.union([z.string(), z.number()]))
            .describe("Array of product IDs to download"),
        })
        .passthrough(),
    },
    {
      name: "getExternalStorageProductsPrices",
      description:
        "Retrieve product prices from an external storage. Paginate with the page parameter.",
      mode: "read",
      schema: z
        .object({
          storage_id: storageIdSchema,
          page: z.number().optional().describe("Results page number"),
        })
        .passthrough(),
    },
    {
      name: "getExternalStorageProductsQuantity",
      description:
        "Retrieve product stock from an external storage. Paginate with the page parameter.",
      mode: "read",
      schema: z
        .object({
          storage_id: storageIdSchema,
          page: z.number().optional().describe("Results page number"),
        })
        .passthrough(),
    },
    {
      name: "updateExternalStorageProductsQuantity",
      description:
        "Update product stock quantities in an external shop or wholesaler storage. The products payload is an array of [product_id, variant_id, stock] tuples, with a maximum of 1000 products per request.",
      mode: "write",
      schema: z
        .object({
          storage_id: storageIdSchema,
          products: z
            .array(z.array(z.union([z.string(), z.number()])))
            .describe(
              "Array of stock updates, each a [product_id, variant_id, stock] tuple (variant_id 0 for the main product); max 1000 products per request",
            ),
        })
        .passthrough(),
    },
  ],
};
