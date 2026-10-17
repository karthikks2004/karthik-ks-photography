// Runs automatically every 3 hours (see config). Downloads your newest Instagram posts.
import { getStore } from "@netlify/blobs";
import { sync } from "./lib/instagram.mjs";

export default async () => {
  try {
    const r = await sync({
      imagesStore: getStore("ig-images"),
      metaStore: getStore("ig-meta"),
      env: process.env,
    });
    console.log("Instagram sync ok:", JSON.stringify(r));
  } catch (e) {
    console.error("Instagram sync failed:", e.message);
  }
};

export const config = { schedule: "0 */3 * * *" };
