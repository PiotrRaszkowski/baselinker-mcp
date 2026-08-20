import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

export const inventoryCategory: CategoryDef = {
  toolName: "baselinker_inventory",
  title: "BaseLinker Inventory Structure",
  description:
    "Read and manage the BaseLinker inventory structure: read catalogs, price groups, warehouses, maps, locations, zones, racks, categories, manufacturers, extra fields, integrations, printout templates, tags, suppliers and payers, and create, update or delete catalogs, price groups, warehouses, warehouse locations and location types, zones, racks, categories, manufacturers, suppliers, payers and tags.",
  methods: [
    {
      name: "getInventories",
      description: "Retrieve the list of catalogs (inventories) available in BaseLinker storage.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryPriceGroups",
      description: "Retrieve price groups existing in BaseLinker storage.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryWarehouses",
      description:
        "Retrieve the list of warehouses (including external stock locations) available in BaseLinker inventories.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryMaps",
      description: "Retrieve the list of warehouse maps.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryMapDetails",
      description:
        "Return detailed information about a warehouse map, including the visual layout JSON.",
      mode: "read",
      schema: z
        .object({ map_id: z.number().describe("Warehouse map identifier (see getInventoryMaps)") })
        .passthrough(),
    },
    {
      name: "getInventoryWarehouseLocations",
      description:
        "Retrieve warehouse locations (slots/bins). 100 per page; use the page parameter (from 1). Optional: filter_location_id, filter_name, filter_rack_id, filter_zone_id.",
      mode: "read",
      schema: z
        .object({
          warehouse_id: z.number().describe("Warehouse identifier (see getInventoryWarehouses)"),
          warehouse_type: z.string().describe("Warehouse type (see getInventoryWarehouses)"),
        })
        .passthrough(),
    },
    {
      name: "getInventoryWarehouseLocationTypes",
      description: "Retrieve the list of warehouse location types.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryWarehouseZones",
      description: "Retrieve the list of warehouse zones.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryWarehouseRacks",
      description: "Retrieve the list of warehouse racks.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryCategories",
      description:
        "Retrieve categories for a BaseLinker catalog (or all catalogs). Optional: inventory_id.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryManufacturers",
      description:
        "Retrieve manufacturers. 1000 per page via the page parameter; all returned if page is omitted.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryExtraFields",
      description: "Retrieve extra fields configured for a BaseLinker catalog.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryIntegrations",
      description:
        "Retrieve integrations where catalog text values can be overwritten, with supported languages and accounts.",
      mode: "read",
      schema: z
        .object({ inventory_id: z.number().describe("Catalog ID (see getInventories)") })
        .passthrough(),
    },
    {
      name: "getInventoryAvailableTextFieldKeys",
      description: "Return product text fields that can be overwritten for a specific integration.",
      mode: "read",
      schema: z
        .object({ inventory_id: z.number().describe("Catalog ID (see getInventories)") })
        .passthrough(),
    },
    {
      name: "getInventoryPrintoutTemplates",
      description: "Return configured printout templates available for inventory products.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryTags",
      description: "Retrieve tags available in a BaseLinker catalog.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventorySuppliers",
      description:
        "Retrieve suppliers available in BaseLinker inventory storage. Optional: filter_id, filter_name.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "getInventoryPayers",
      description:
        "Retrieve payers available in BaseLinker storage. Optional: filter_id, filter_name.",
      mode: "read",
      schema: emptySchema,
    },
    {
      name: "addInventory",
      description:
        "Create a new catalog (inventory) or update an existing one when inventory_id is passed.",
      mode: "write",
      schema: z
        .object({
          inventory_id: z
            .number()
            .optional()
            .describe("Catalog identifier; reuse an existing ID to update, omit to create"),
          name: z.string().describe("Catalog display name (max 100 characters)"),
          description: z.string().optional().describe("Detailed catalog description"),
          languages: z.array(z.string()).describe("Supported language codes for the catalog"),
          default_language: z
            .string()
            .describe("Primary language (2-char code); must be included in languages"),
          price_groups: z
            .array(z.number())
            .describe("Available price group identifiers for the catalog"),
          default_price_group: z
            .number()
            .describe("Primary price group; must exist in price_groups"),
          warehouses: z
            .array(z.string())
            .describe('Available warehouse identifiers in format "type_id"'),
          default_warehouse: z
            .string()
            .describe("Primary warehouse; must be in warehouses (max 30 characters)"),
          reservations: z.boolean().describe("Whether the catalog supports inventory reservations"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventory",
      description:
        "Permanently delete a catalog (inventory) from BaseLinker storage. This cannot be undone.",
      mode: "write",
      schema: z
        .object({ inventory_id: z.number().describe("Catalog ID (see getInventories)") })
        .passthrough(),
    },
    {
      name: "addInventoryPriceGroup",
      description:
        "Create a new price group or update an existing one when price_group_id is passed.",
      mode: "write",
      schema: z
        .object({
          price_group_id: z
            .number()
            .optional()
            .describe("Price group identifier; pass to update, omit or 0 to create"),
          name: z.string().describe("Price group name (max 100 characters)"),
          description: z.string().optional().describe("Price group description"),
          currency: z.string().describe("3-letter currency code (e.g. USD, EUR)"),
          price_group_type: z
            .string()
            .optional()
            .describe(
              'Type: "standard", "dependent_on_price_group" or "dependent_on_average_cost"',
            ),
          source_price_group_id: z
            .number()
            .optional()
            .describe(
              'Source price group ID; required when price_group_type is "dependent_on_price_group"',
            ),
          price_multiplier: z
            .number()
            .optional()
            .describe("Multiplier for the source price (e.g. 1.2 = +20%); defaults to 1"),
          price_addition: z
            .number()
            .optional()
            .describe("Fixed amount added after the multiplier; defaults to 0"),
          is_bundle_price_calculated: z
            .boolean()
            .optional()
            .describe("Auto-calculate bundle prices from components"),
          bundle_price_multiplier: z
            .number()
            .optional()
            .describe("Multiplier for bundle prices; defaults to 1"),
          bundle_price_addition: z
            .number()
            .optional()
            .describe("Fixed amount added to the bundle price; defaults to 0"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryPriceGroup",
      description:
        "Permanently delete a price group from BaseLinker storage. This cannot be undone.",
      mode: "write",
      schema: z
        .object({ price_group_id: z.number().describe("Price group identifier") })
        .passthrough(),
    },
    {
      name: "addInventoryWarehouse",
      description: "Create a new warehouse or update an existing one when warehouse_id is passed.",
      mode: "write",
      schema: z
        .object({
          warehouse_id: z
            .number()
            .optional()
            .describe("Warehouse identifier; pass to update, omit or 0 to create"),
          name: z.string().optional().describe("Warehouse name (max 100 characters)"),
          description: z.string().optional().describe("Warehouse description"),
          stock_edition: z
            .boolean()
            .optional()
            .describe("Whether manual stock adjustments are allowed; false restricts edits to API"),
          country: z.string().optional().describe("ISO 3166-1 2-letter country code (e.g. DE, PL)"),
          address: z.string().optional().describe("Warehouse street address (max 200 characters)"),
          postcode: z.string().optional().describe("Warehouse postal code (max 20 characters)"),
          city: z.string().optional().describe("Warehouse city (max 80 characters)"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryWarehouse",
      description:
        "Permanently delete a warehouse from BaseLinker inventories. This cannot be undone.",
      mode: "write",
      schema: z.object({ warehouse_id: z.number().describe("ID of the warehouse") }).passthrough(),
    },
    {
      name: "addInventoryWarehouseLocation",
      description:
        "Create a new warehouse location or update an existing one when location_id is passed.",
      mode: "write",
      schema: z
        .object({
          location_id: z
            .number()
            .optional()
            .describe("Location ID to update; omit to create a new location"),
          warehouse_id: z.number().describe("Warehouse identifier (see getInventoryWarehouses)"),
          warehouse_type: z.string().describe("Warehouse type (see getInventoryWarehouses)"),
          name: z
            .string()
            .optional()
            .describe('Location name (e.g. "A-01-A-1"); required for new locations'),
          color: z
            .string()
            .optional()
            .describe('6-character hex label color; defaults to "4285f4"'),
          is_pickable: z
            .boolean()
            .optional()
            .describe("Whether the location is usable during pick and pack; defaults to true"),
          priority: z
            .number()
            .optional()
            .describe("Picking priority 1..99999; lower values are picked first"),
          location_type_id: z.number().optional().describe("Existing location type identifier"),
          zone_id: z.number().optional().describe("Zone identifier; pass 0 for unassigned"),
          rack_id: z.number().optional().describe("Rack identifier; pass 0 for unassigned"),
        })
        .passthrough(),
    },
    {
      name: "addInventoryWarehouseLocationType",
      description:
        "Create a new warehouse location type or update an existing one when location_type_id is passed.",
      mode: "write",
      schema: z
        .object({
          location_type_id: z
            .number()
            .optional()
            .describe("Location type identifier to update; omit to create a new type"),
          name: z
            .string()
            .optional()
            .describe('Location type name (e.g. "Pallet"); required for new types, must be unique'),
          max_quantity: z
            .number()
            .optional()
            .describe("Maximum products per location; 0 = unlimited (default 0)"),
          max_weight: z
            .number()
            .optional()
            .describe("Maximum weight in kg per location; 0 = unlimited (default 0)"),
          width: z.number().optional().describe("Width in centimeters; 0 = not set (default 0)"),
          height: z.number().optional().describe("Height in centimeters; 0 = not set (default 0)"),
          depth: z.number().optional().describe("Depth in centimeters; 0 = not set (default 0)"),
          is_transfer_bin: z
            .boolean()
            .optional()
            .describe(
              "Whether the location serves as an intermediate transfer point (default false)",
            ),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryWarehouseLocation",
      description: "Permanently delete a single warehouse location. This cannot be undone.",
      mode: "write",
      schema: z
        .object({
          warehouse_id: z.number().describe("Warehouse identifier (see getInventoryWarehouses)"),
          warehouse_type: z.string().describe("Warehouse type (see getInventoryWarehouses)"),
          location_id: z.number().describe("ID of the location to delete"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryWarehouseLocationType",
      description:
        "Permanently delete a warehouse location type. The default type cannot be deleted. This cannot be undone.",
      mode: "write",
      schema: z
        .object({
          location_type_id: z
            .number()
            .describe("ID of the location type to delete (see getInventoryWarehouseLocationTypes)"),
        })
        .passthrough(),
    },
    {
      name: "addInventoryWarehouseZone",
      description: "Create a new warehouse zone or update an existing one when zone_id is passed.",
      mode: "write",
      schema: z
        .object({
          zone_id: z
            .number()
            .optional()
            .describe("Zone identifier to update; omit or 0 to create a new zone"),
          name: z.string().describe("Zone name; max 50 characters, cannot be empty"),
          color: z.string().describe('Zone color as a 6-character hex string (e.g. "5cb85c")'),
          location_prefix: z
            .string()
            .optional()
            .describe("Prefix applied to location names within this zone (max 10 characters)"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryWarehouseZone",
      description:
        "Permanently delete a warehouse zone; its racks are also deleted and its locations unassigned. This cannot be undone.",
      mode: "write",
      schema: z
        .object({
          zone_id: z.number().describe("ID of the zone to delete (see getInventoryWarehouseZones)"),
        })
        .passthrough(),
    },
    {
      name: "addInventoryWarehouseRack",
      description: "Create a new warehouse rack or update an existing one when rack_id is passed.",
      mode: "write",
      schema: z
        .object({
          rack_id: z
            .number()
            .optional()
            .describe("Rack identifier to update; omit or 0 to create a new rack"),
          name: z.string().describe("Rack name; max 100 characters, cannot be empty"),
          zone_id: z
            .number()
            .optional()
            .describe("Identifier of the zone this rack belongs to; defaults to 0 (unassigned)"),
          layout: z
            .number()
            .describe("Picking side layout: 0 (top), 1 (right), 2 (bottom), 3 (left)"),
          location_prefix: z
            .string()
            .optional()
            .describe("Prefix applied to location names within this rack (max 10 characters)"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryWarehouseRack",
      description:
        "Permanently delete a warehouse rack; its locations are automatically unassigned. This cannot be undone.",
      mode: "write",
      schema: z
        .object({
          rack_id: z.number().describe("ID of the rack to delete (see getInventoryWarehouseRacks)"),
        })
        .passthrough(),
    },
    {
      name: "addInventoryCategory",
      description:
        "Create a new catalog category or update an existing one when category_id is passed.",
      mode: "write",
      schema: z
        .object({
          inventory_id: z
            .number()
            .optional()
            .describe("Catalog identifier; omit to apply the category across all catalogs"),
          category_id: z
            .number()
            .optional()
            .describe("Category identifier to update; omit to create a new category"),
          name: z.string().describe("Category name (max 200 characters)"),
          parent_id: z.number().describe("Parent category ID (use 0 for a top-level category)"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryCategory",
      description:
        "Permanently delete a catalog category; contained products are deleted and subcategories promoted to top level. This cannot be undone.",
      mode: "write",
      schema: z
        .object({
          category_id: z.number().describe("Category ID to remove from BaseLinker storage"),
        })
        .passthrough(),
    },
    {
      name: "addInventoryManufacturer",
      description:
        "Create a new manufacturer or update an existing one when manufacturer_id is passed.",
      mode: "write",
      schema: z
        .object({
          manufacturer_id: z
            .number()
            .optional()
            .describe("Manufacturer ID to update; omit to create a new manufacturer"),
          manufacturer_name: z
            .string()
            .optional()
            .describe("Manufacturer name (max 200 characters)"),
          manufacturer_photo: z
            .string()
            .optional()
            .describe(
              'Logo/photo as base64 (prefix "data:") or external URL (prefix "url:"); empty string deletes',
            ),
          manufacturer_url: z
            .string()
            .optional()
            .describe("Manufacturer website address (max 200 characters)"),
          manufacturer_street: z
            .string()
            .optional()
            .describe("Manufacturer street address (max 200 characters)"),
          manufacturer_postcode: z
            .string()
            .optional()
            .describe("Manufacturer postal code (max 20 characters)"),
          manufacturer_city: z
            .string()
            .optional()
            .describe("Manufacturer city (max 80 characters)"),
          manufacturer_state: z
            .string()
            .optional()
            .describe("Manufacturer state/province (max 35 characters)"),
          manufacturer_country_code: z
            .string()
            .optional()
            .describe("Manufacturer 2-letter ISO country code"),
          manufacturer_email: z
            .string()
            .optional()
            .describe("Manufacturer email address (max 100 characters)"),
          manufacturer_phone: z
            .string()
            .optional()
            .describe("Manufacturer phone number (max 40 characters)"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryManufacturer",
      description:
        "Permanently delete a manufacturer from BaseLinker inventory. This cannot be undone.",
      mode: "write",
      schema: z
        .object({
          manufacturer_id: z
            .number()
            .describe("ID of the manufacturer to remove from BaseLinker warehouse"),
        })
        .passthrough(),
    },
    {
      name: "addInventorySupplier",
      description: "Create a new supplier or update an existing one when supplier_id is passed.",
      mode: "write",
      schema: z
        .object({
          supplier_id: z
            .number()
            .optional()
            .describe("Supplier identifier; pass to update, omit to create"),
          name: z.string().describe("Supplier name (max 40 characters)"),
          take_product_cost_from: z.string().describe('Cost source: "cost" or a price group ID'),
          take_product_code_from: z
            .string()
            .describe('Code source: "sku", "ean", "code" or an extra field ID'),
          address: z.string().optional().describe("Supplier street address (max 200 characters)"),
          postcode: z.string().optional().describe("Supplier postal code (max 20 characters)"),
          city: z.string().optional().describe("Supplier city (max 80 characters)"),
          phone: z.string().optional().describe("Supplier phone number (max 40 characters)"),
          email: z.string().optional().describe("Supplier email address (max 200 characters)"),
          email_copy_to: z
            .string()
            .optional()
            .describe("Additional correspondence emails (max 200 characters)"),
          currency: z
            .string()
            .optional()
            .describe("Default supplier currency code (e.g. EUR, USD)"),
          tax_no: z
            .string()
            .optional()
            .describe("Supplier tax identification number (max 16 characters)"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventorySupplier",
      description: "Permanently delete a supplier from BaseLinker storage. This cannot be undone.",
      mode: "write",
      schema: z.object({ supplier_id: z.number().describe("Supplier identifier") }).passthrough(),
    },
    {
      name: "addInventoryPayer",
      description: "Create a new payer or update an existing one when payer_id is passed.",
      mode: "write",
      schema: z
        .object({
          payer_id: z
            .number()
            .optional()
            .describe("Payer identifier; pass to update, omit to create"),
          name: z.string().describe("Payer name (max 100 characters)"),
          address: z.string().optional().describe("Payer street address (max 100 characters)"),
          postcode: z.string().optional().describe("Payer postal code (max 20 characters)"),
          city: z.string().optional().describe("Payer city (max 50 characters)"),
          tax_no: z
            .string()
            .optional()
            .describe("Payer tax identification number (max 20 characters)"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryPayer",
      description: "Permanently delete a payer from BaseLinker storage. This cannot be undone.",
      mode: "write",
      schema: z.object({ payer_id: z.number().describe("Payer identifier") }).passthrough(),
    },
    {
      name: "addInventoryTag",
      description: "Create a new catalog tag or update an existing one when tag_id is passed.",
      mode: "write",
      schema: z
        .object({
          tag_id: z
            .number()
            .optional()
            .describe("Tag identifier to update; omit or 0 to create a new tag"),
          name: z.string().describe("Tag name; unique within the account, max 25 characters"),
        })
        .passthrough(),
    },
    {
      name: "deleteInventoryTag",
      description:
        "Permanently delete a tag from the catalog; it is also removed from all associated products. This cannot be undone.",
      mode: "write",
      schema: z
        .object({
          tag_id: z.number().describe("ID of the tag to remove (see getInventoryTags)"),
        })
        .passthrough(),
    },
  ],
};
