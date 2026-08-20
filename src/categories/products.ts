import { z } from "zod";
import { CategoryDef } from "../registry.js";

export const productsCategory: CategoryDef = {
  toolName: "baselinker_products",
  title: "BaseLinker Catalog Products",
  description:
    "Read and manage products in BaseLinker catalogs: read product lists, detailed data, stock, prices and change logs; create, update and delete catalog products; bulk-update stock and prices; and run product macro triggers.",
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
          filter_locations: z.string().optional().describe("Filter by warehouse location name"),
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
          include_channels_media: z.boolean().optional().describe("Include channel-specific media"),
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
    {
      name: "addInventoryProduct",
      description:
        "Add a new product to a catalog, or update an existing one when product_id is provided (creates a new product otherwise).",
      mode: "write",
      schema: z
        .object({
          inventory_id: z.number().describe("Catalog ID (see getInventories)"),
          product_id: z
            .number()
            .optional()
            .describe(
              "Main product ID; omit to create a new product, provide to update an existing one",
            ),
          parent_id: z.number().optional().describe("Parent product ID for product variants"),
          is_bundle: z.boolean().optional().describe("Whether the product is a bundle"),
          sku: z.string().optional().describe("Product SKU number"),
          ean: z.string().optional().describe("Product EAN number"),
          ean_additional: z
            .array(z.record(z.unknown()))
            .optional()
            .describe("List of additional EAN numbers with quantities"),
          asin: z.string().optional().describe("Product ASIN number"),
          tags: z
            .array(z.string())
            .optional()
            .describe("List of tag names; an empty array removes all existing tags"),
          tax_rate: z
            .number()
            .optional()
            .describe(
              "VAT rate 0-100; special values: -1 (exempt), -0.02 (NP), -0.03 (reverse charge)",
            ),
          weight: z.number().optional().describe("Weight in kilograms"),
          height: z.number().optional().describe("Product height"),
          width: z.number().optional().describe("Product width"),
          length: z.number().optional().describe("Product length"),
          average_cost: z.number().optional().describe("Product average cost"),
          star: z.number().optional().describe("Star rating (0-5)"),
          manufacturer_id: z
            .number()
            .optional()
            .describe("Manufacturer ID (see getInventoryManufacturers)"),
          category_id: z.number().optional().describe("Category ID (must be created beforehand)"),
          prices: z
            .record(z.unknown())
            .optional()
            .describe("Map keyed by price group ID with the gross price as value"),
          stock: z
            .record(z.unknown())
            .optional()
            .describe("Map keyed by warehouse ID with the stock quantity as value"),
          locations: z
            .record(z.unknown())
            .optional()
            .describe("Map keyed by warehouse ID with the location string as value"),
          text_fields: z
            .record(z.unknown())
            .optional()
            .describe("Field values such as name, description and features"),
          images: z
            .record(z.unknown())
            .optional()
            .describe("Up to 16 photos; supports URLs, base64 data or deletion markers"),
          videos: z
            .array(z.record(z.unknown()))
            .optional()
            .describe("Up to 6 videos in MP4/WEBM format, up to 15MB each"),
          media_options: z
            .record(z.unknown())
            .optional()
            .describe("Channel-specific media resolution options (0/1/2 values)"),
          links: z.record(z.unknown()).optional().describe("External warehouse product links"),
          bundle_products: z
            .record(z.unknown())
            .optional()
            .describe("Products included in the bundle (only when is_bundle is true)"),
          suppliers: z
            .array(z.record(z.unknown()))
            .optional()
            .describe("List of suppliers with ID, product code and cost"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryProduct",
      description: "Permanently delete a product from a BaseLinker catalog.",
      mode: "write",
      schema: z
        .object({
          product_id: z.number().describe("BaseLinker inventory product identifier"),
        })
        .passthrough(),
    },
    {
      name: "updateInventoryProductsStock",
      description:
        "Bulk-update stock levels of catalog products and variants across warehouses. Maximum 1000 products per call.",
      mode: "write",
      schema: z
        .object({
          inventory_id: z.number().describe("Catalog ID (see getInventories)"),
          products: z
            .record(z.unknown())
            .describe(
              "Map keyed by product/variant ID; each value maps warehouse IDs (format '[bl|shop|warehouse]_[id]') to stock quantities. Max 1000 products per call.",
            ),
        })
        .passthrough(),
    },
    {
      name: "updateInventoryProductsPrices",
      description:
        "Bulk-update gross prices of catalog products and variants. Maximum 1000 products per call.",
      mode: "write",
      schema: z
        .object({
          inventory_id: z.number().describe("Catalog ID (see getInventories)"),
          products: z
            .record(z.unknown())
            .describe(
              "Map keyed by product/variant ID; each value maps price group IDs to gross prices. Max 1000 products per call.",
            ),
        })
        .passthrough(),
    },
    {
      name: "runProductMacroTrigger",
      description:
        "Run a personal macro trigger from product automatic actions for a given product.",
      mode: "write",
      schema: z
        .object({
          product_id: z.number().describe("Product identifier from the BaseLinker product manager"),
          trigger_id: z
            .number()
            .describe("Identifier of the personal trigger from product automatic actions"),
        })
        .passthrough(),
    },
  ],
};
