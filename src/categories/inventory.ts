import { z } from "zod";
import { CategoryDef, emptySchema } from "../registry.js";

export const inventoryCategory: CategoryDef = {
  toolName: "baselinker_inventory",
  title: "BaseLinker Inventory Structure",
  description:
    "Read the BaseLinker inventory structure: catalogs, price groups, warehouses, maps, locations, zones, racks, categories, manufacturers, extra fields, integrations, printout templates, tags, suppliers and payers.",
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
          warehouse_id: z
            .number()
            .describe("Warehouse identifier (see getInventoryWarehouses)"),
          warehouse_type: z
            .string()
            .describe("Warehouse type (see getInventoryWarehouses)"),
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
  ],
};
