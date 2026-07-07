import type { CategoryDef } from "../registry.js";
import { connectCategory } from "./connect.js";
import { courierCategory } from "./courier.js";
import { crmCategory } from "./crm.js";
import { documentsCategory } from "./documents.js";
import { externalStorageCategory } from "./external-storage.js";
import { inventoryCategory } from "./inventory.js";
import { invoicesCategory } from "./invoices.js";
import { ordersCategory } from "./orders.js";
import { productsCategory } from "./products.js";
import { returnsCategory } from "./returns.js";

export const allCategories: CategoryDef[] = [
  ordersCategory,
  invoicesCategory,
  returnsCategory,
  courierCategory,
  crmCategory,
  inventoryCategory,
  productsCategory,
  documentsCategory,
  connectCategory,
  externalStorageCategory,
];
