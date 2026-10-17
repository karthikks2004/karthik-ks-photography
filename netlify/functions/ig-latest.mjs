// Public JSON used by the "Latest from Instagram" strip. Contains no secrets.
import { getStore } from "@netlify/blobs";

export default async () => {
  const data = await getStore("ig-meta").get("latest.json", { type: "json" }).catch(() => null);
  return Response.json(data || { updatedAt: null, items: [] }, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
};

export const config = { path: "/api/ig-latest" };
