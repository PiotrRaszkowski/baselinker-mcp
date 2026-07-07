import { z } from "zod";
import { CategoryDef } from "../registry.js";

export const productsCategory: CategoryDef = {
  toolName: "baselinker_products",
  title: "BaseLinker Catalog Products",
  description:
    "Read products from BaseLinker catalogs: product lists, detailed data, stock, prices and change logs.",
  methods: [
    {
      name: "getInventoryProductsList",
      description:
        "Retrieve a basic product list from a catalog. 1000 per page; use the page parameter (1-based); fewer than 1000 results means the last page.",
      mode: "read",
      schema: z
        .object({
          inventory_id: z.number().describe("Catalog ID (see getInventories)"),
          filter_id: z.number().optional().describe("Limit results to a specific product ID"),
          filter_category_id: z
            .number()
            .optional()
            .describe("Limit to products from a specific category"),
          filter_ean: z
            .string()
            .optional()
            .describe("Limit to a specific EAN (including additional product EANs)"),
          filter_sku: z.string().optional().describe("Limit to a specific SKU"),
          filter_name: z
            .string()
            .optional()
            .describe("Product name filter (partial match allowed)"),
          filter_price_from: z.number().optional().describe("Minimum price"),
          filter_price_to: z.number().optional().describe("Maximum price"),
          filter_stock_from: z.number().optional().describe("Minimum stock"),
          filter_stock_to: z.number().optional().describe("Maximum stock"),
          page: z.number().optional().describe("Results page (1-based, 1000 per page)"),
          filter_sort: z.string().optional().describe('Sorting, value "id [ASC|DESC]"'),
          filter_locations: z
            .string()
            .optional()
            .describe("Filter by warehouse location name"),
          include_variants: z
            .boolean()
            .optional()
            .describe("Include product variants alongside main products"),
        })
        .passthrough(),
    },
    {
      name: "getInventoryProductsData",
      description: "Retrieve detailed data for selected products from a catalog.",
      mode: "read",
      schema: z
        .object({
          inventory_id: z.number().describe("Catalog ID (see getInventories)"),
          products: z.array(z.number()).describe("Array of product IDs to download"),
          include_erp_units: z
            .boolean()
            .optional()
            .describe("Include ERP units (non-AVCO purchase-cost inventories only)"),
          include_wms_units: z
            .boolean()
            .optional()
            .describe("Include WMS units (advanced warehouse management only)"),
          include_additional_eans: z
            .boolean()
            .optional()
            .describe("Include additional EANs (product cases/regional codes)"),
          include_suppliers: z.boolean().optional().describe("Include suppliers data"),
          include_relations: z
            .boolean()
            .optional()
            .describe("Include product relations (related, substitution, upsell, crosssell)"),
          include_marketplace_categories: z
            .boolean()
            .optional()
            .describe("Include marketplace category assignments in text_fields"),
          include_channels_media: z
            .boolean()
            .optional()
            .describe("Include channel-specific media"),
        })
        .passthrough(),
    },
    {
      name: "getInventoryProductsStock",
      description:
        "Retrieve stock and reservation data of catalog products. 1000 per page; use the page parameter.",
      mode: "read",
      schema: z
        .object({
          inventory_id: z.number().describe("Catalog ID (see getInventories)"),
          filter_id: z.number().optional().describe("Limit to a specific product ID"),
          filter_category_id: z
            .number()
            .optional()
            .describe("Limit to products from a specific category"),
          filter_ean: z
            .string()
            .optional()
            .describe("Limit to a specific EAN (including additional EANs)"),
          filter_sku: z.string().optional().describe("Limit to a specific SKU"),
          filter_name: z.string().optional().describe("Product name filter (partial match)"),
          filter_asin: z.string().optional().describe("Limit to a specific ASIN"),
          filter_stock_from: z.number().optional().describe("Minimum stock"),
          filter_stock_to: z.number().optional().describe("Maximum stock"),
          page: z.number().optional().describe("Results page (1-based, 1000 per page)"),
          filter_sort: z.string().optional().describe('Sorting, value "id [ASC|DESC]"'),
          filter_locations: z.string().optional().describe("Filter by location name"),
        })
        .passthrough(),
    },
    {
      name: "getInventoryProductsPrices",
      description:
        "Retrieve gross prices of catalog products. 1000 per page; use the page parameter.",
      mode: "read",
      schema: z
        .object({
          inventory_id: z.number().describe("Catalog ID (see getInventories)"),
          page: z.number().optional().describe("Results page (1-based, 1000 per page)"),
        })
        .passthrough(),
    },
    {
      name: "getInventoryProductLogs",
      description:
        "Retrieve change events for a product or variant. 100 per page via the page parameter. Optional: date_from, date_to, log_type, sort, page.",
      mode: "read",
      schema: z
        .object({ product_id: z.number().describe("Product or variant identifier") })
        .passthrough(),
    },
  ],
};
