// Shared logic: fetch latest Instagram media, keep copies in Netlify Blobs, refresh the access token.
// Everything that touches the network or storage is injected so it can be tested without Instagram.

import { createHash } from "node:crypto";
const fp = (t) => createHash("sha256").update(String(t || "")).digest("hex").slice(0, 16);
const GRAPH = "https://graph.instagram.com";
const FIELDS = "id,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp";
export const MAX_ITEMS = 12;
const REFRESH_AFTER_MS = 7 * 24 * 3600 * 1000; // refresh at most weekly (tokens live 60 days)

export async function getToken(store, env) {
  if (!env.IG_TOKEN) throw new Error("IG_TOKEN is not set");
  const saved = await store.get("token.json", { type: "json" }).catch(() => null);
  // Use our refreshed copy only while IG_TOKEN is unchanged; a newly pasted IG_TOKEN always wins.
  if (saved && saved.token && saved.base === fp(env.IG_TOKEN)) return saved;
  return { token: env.IG_TOKEN, refreshedAt: 0, base: fp(env.IG_TOKEN) };
}

export async function maybeRefreshToken(store, tok, fetchFn, now = Date.now()) {
  if (now - (tok.refreshedAt || 0) < REFRESH_AFTER_MS) return tok;
  const url = `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(tok.token)}`;
  const r = await fetchFn(url);
  if (!r.ok) {
    // Too-new tokens (<24h) or temporary errors: keep using the current token, try again next run.
    return tok;
  }
  const j = await r.json();
  const fresh = { token: j.access_token || tok.token, refreshedAt: now, expiresIn: j.expires_in, base: tok.base };
  await store.setJSON("token.json", fresh);
  return fresh;
}

export function toItem(m) {
  const isVideo = m.media_type === "VIDEO";
  const imageUrl = isVideo ? m.thumbnail_url : m.media_url;
  if (!imageUrl) return null;
  return {
    id: String(m.id),
    type: isVideo ? "video" : "photo",
    kind: m.media_product_type === "REELS" ? "Reel" : isVideo ? "Video" : "Photo",
    permalink: m.permalink,
    timestamp: m.timestamp,
    imageUrl,
  };
}

export async function sync({ imagesStore, metaStore, env, fetchFn = fetch, now = Date.now() }) {
  let tok = await getToken(metaStore, env);
  tok = await maybeRefreshToken(metaStore, tok, fetchFn, now);

  const res = await fetchFn(`${GRAPH}/me/media?fields=${FIELDS}&limit=${MAX_ITEMS}&access_token=${encodeURIComponent(tok.token)}`);
  if (!res.ok) throw new Error(`Instagram API error ${res.status}`);
  const data = (await res.json()).data || [];
  const items = data.map(toItem).filter(Boolean).slice(0, MAX_ITEMS);

  const out = [];
  for (const it of items) {
    const key = `img-${it.id}`;
    const exists = await imagesStore.getMetadata(key).catch(() => null);
    if (!exists) {
      const img = await fetchFn(it.imageUrl);
      if (!img.ok) continue;                      // skip this one, try next run
      const buf = await img.arrayBuffer();
      await imagesStore.set(key, buf, { metadata: { contentType: img.headers.get("content-type") || "image/jpeg" } });
    }
    out.push({ id: it.id, type: it.type, kind: it.kind, permalink: it.permalink, timestamp: it.timestamp, image: `/api/ig-media/${it.id}` });
  }

  await metaStore.setJSON("latest.json", { updatedAt: new Date(now).toISOString(), items: out });

  // delete copies of posts that are no longer in the latest list
  const keep = new Set(out.map((o) => `img-${o.id}`));
  const { blobs } = await imagesStore.list({ prefix: "img-" });
  for (const b of blobs) if (!keep.has(b.key)) await imagesStore.delete(b.key);

  return { saved: out.length };
}
