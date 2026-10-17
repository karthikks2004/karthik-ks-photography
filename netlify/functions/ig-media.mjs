// Serves the saved copy of a photo/thumbnail: /api/ig-media/<id>
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const id = (context.params && context.params.id) || "";
  if (!/^\d+$/.test(id)) return new Response("Bad request", { status: 400 });
  const store = getStore("ig-images");
  const res = await store.getWithMetadata(`img-${id}`, { type: "arrayBuffer" }).catch(() => null);
  if (!res || !res.data) return new Response("Not found", { status: 404 });
  return new Response(res.data, {
    headers: { "Content-Type": (res.metadata && res.metadata.contentType) || "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable" },
  });
};

export const config = { path: "/api/ig-media/:id" };
