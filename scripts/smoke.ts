import dotenv from "dotenv";
import { BaseLinkerClient } from "../src/client.js";

dotenv.config({ quiet: true });

const token = process.env.BASELINKER_API_TOKEN;
if (token === undefined || token.length === 0) {
  console.error("Missing BASELINKER_API_TOKEN in environment or .env file.");
  process.exit(1);
}

const client = new BaseLinkerClient({ token });

async function check(name: string, run: () => Promise<string>): Promise<boolean> {
  try {
    const summary = await run();
    console.log(`OK   ${name}: ${summary}`);
    return true;
  } catch (error) {
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}

const results = [
  await check("getInventories", async () => {
    const data = await client.call<{ inventories: unknown[] }>("getInventories");
    return `${data.inventories?.length ?? 0} inventories`;
  }),
  await check("getOrderStatusList", async () => {
    const data = await client.call<{ statuses: unknown[] }>("getOrderStatusList");
    return `${data.statuses?.length ?? 0} statuses`;
  }),
  await check("getOrders", async () => {
    const weekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
    const data = await client.call<{ orders: unknown[] }>("getOrders", {
      date_confirmed_from: weekAgo,
    });
    return `${data.orders?.length ?? 0} orders confirmed in the last 7 days`;
  }),
];

process.exit(results.every(Boolean) ? 0 : 1);
