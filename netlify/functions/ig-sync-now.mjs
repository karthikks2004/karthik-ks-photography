// Manual trigger for the first run / testing:  https://YOUR-SITE/api/ig-sync-now?key=YOUR_SYNC_KEY
import { getStore } from "@netlify/blobs";
import { sync } from "./lib/instagram.mjs";

export default async (req) => {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.SYNC_KEY || key !== process.env.SYNC_KEY) return new Response("Not allowed", { status: 403 });
  try {
    const r = await sync({ imagesStore: getStore("ig-images"), metaStore: getStore("ig-meta"), env: process.env });
    return Response.json({ ok: true, ...r });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
};

export const config = { path: "/api/ig-sync-now" };
