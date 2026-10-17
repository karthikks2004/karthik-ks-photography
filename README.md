# Karthik KS Photography — website

A fast, static, black-and-white cinematic portfolio. No build step, no frameworks, no external fonts or scripts — just HTML, CSS and a little JavaScript, so it can be hosted for free (Netlify, Cloudflare Pages, GitHub Pages).

**What is inside:** 97 photographs (40 from @karthik.ks_photography, 57 from @karthik.ks_._) and 22 reels/videos (17 + 5), all from your own Instagram exports. Nothing is stock or generated. Your logo is `assets/logo.jpeg`, byte-for-byte identical to the file you supplied.

---

## 1. Folder structure

```
karthik-ks-photography/
├── index.html            the whole site (gallery is written into the page, so Google can read it)
├── 404.html              "page not found" page
├── robots.txt            tells Google it may crawl everything
├── sitemap.xml           needs your real web address after deploying (step 5)
├── _headers              Netlify caching + basic security headers
├── data/media.json       list of every photo/video: file, category, alt text, source account
└── assets/
    ├── logo.jpeg         YOUR original logo, unmodified
    ├── og-image.jpg      social-sharing preview (your logo + hero photo)
    ├── css/style.css
    ├── js/main.js        menu, category filters, lightbox, reels
    ├── images/
    │   ├── originals/    full-size photos exactly as exported (opened in the viewer)
    │   ├── thumbnails/   small WebP versions for the grid + reel posters
    │   └── medium/       hero image
    └── videos/           reels (H.264 MP4, re-encoded smaller, same resolution)
```

## 2. Run it on your computer

Double-click `index.html` — it works straight from the folder because all paths are relative.
For a closer-to-real test, open a terminal in the folder and run `python -m http.server 8000`, then visit http://localhost:8000.

## 3. Deploy on Netlify (free)

1. Unzip the download. You should see a folder containing `index.html`.
2. Go to **https://app.netlify.com/drop** and sign up / log in (a free account is fine).
3. Drag the **unzipped folder** (the one containing `index.html`) onto the page. Wait for the upload — the videos make it large (~100 MB), so give it a few minutes.
4. Netlify gives you an address like `https://random-name-123.netlify.app`. Open it and check the gallery, a reel and the mobile view.
5. Rename it: **Site configuration → Change site name** (e.g. `karthikks-photography` → `https://karthikks-photography.netlify.app`). Choose the name you want to keep, because Google will index that address.

## 4. After deploying: add your real web address (important for Google)

Do this once you have your final address (call it `https://YOUR-SITE`). Open these files in Notepad/VS Code:

**index.html** — replace the two HTML comments inside `<head>` (they start with `AFTER DEPLOYING`) with:

```html
<link rel="canonical" href="https://YOUR-SITE/">
<meta property="og:url" content="https://YOUR-SITE/">
<meta property="og:image" content="https://YOUR-SITE/assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
```

**sitemap.xml** — change `https://YOUR-SITE-URL/` to `https://YOUR-SITE/` (keep the trailing slash).

**robots.txt** — delete the `#` and write `Sitemap: https://YOUR-SITE/sitemap.xml`

Then redeploy: on Netlify open **Deploys** and drag the updated folder onto the page again.
*(Or just send me your address and I'll update the files for you.)*

## 5. Get found on Google (Search Console)

Google decides if and when to index a site; these steps just make sure it knows yours exists.

1. Go to **https://search.google.com/search-console** and sign in with your Google account.
2. **Add property → URL prefix**, and paste your full address, e.g. `https://karthikks-photography.netlify.app/`.
3. Verify ownership: choose **HTML tag**, copy the `<meta name="google-site-verification" ...>` line, paste it inside `<head>` of `index.html`, redeploy, then click **Verify**.
4. **Sitemaps** (left menu) → enter `sitemap.xml` → **Submit**.
5. **URL Inspection** (search bar at the top) → paste your homepage address → **Request indexing**.
6. Check back in a few days to a few weeks. Search for your name plus "photography" — new sites can take time to appear.

Helpful extras: put the website address in your Instagram bio (both accounts), and share it in your posts — links from other places help Google discover and trust the site.

## 6. Automatic Instagram updates ("Latest posts" strip)

New posts from `@karthik.ks_photography` can appear on the site automatically, without redeploying. How it works:

- A small scheduled function (`netlify/functions/ig-sync.mjs`) runs every 3 hours, asks Instagram for your 12 newest posts and saves copies of the photos/reel covers in Netlify storage (Instagram's own image links expire).
- It renews your Instagram access token weekly (tokens last 60 days), so it should keep working on its own.
- The "Latest posts" strip appears on the page only when it has data. Photos open in the viewer; reels and videos open on Instagram.
- These new posts are **not** sorted into Nature/Street/etc. and have no custom descriptions. Your curated gallery above is unchanged.

**Important:** this needs a deploy that can build functions, so **drag-and-drop does not work for it**. Use *Import from Git* (GitHub) or the Netlify CLI (`netlify deploy --prod`). Drag-and-drop still works for the normal site; the strip just stays hidden.

**One-time setup**
1. Instagram account `@karthik.ks_photography` must be a Professional (Creator/Business) account.
2. At https://developers.facebook.com create a **Business** app, add the **Instagram** product, and under *API setup with Instagram login* add your account and click **Generate token** (permission `instagram_business_basic`).
3. In Netlify: **Site configuration → Environment variables**, add `IG_TOKEN` (the token) and `SYNC_KEY` (any long random text you make up). Mark `IG_TOKEN` as secret. Never put the token in any file or chat.
4. Redeploy, then open `https://YOUR-SITE/api/ig-sync-now?key=YOUR_SYNC_KEY` once. You should see `{"ok":true,"saved":N}`. After that it runs by itself.
5. If the strip ever stops updating, the token probably expired (it can't be revived). Generate a new one (step 2) and replace `IG_TOKEN`.  The function notices a new `IG_TOKEN` automatically; redeploy (or just wait for the next run) and open the `ig-sync-now` link once.

## 7. Updating the site later

The site is static: to add or remove photos, ask me (I'll rebuild the gallery, thumbnails and categories) or edit `index.html` by hand. `data/media.json` is a readable catalogue of what is on the site; the page itself does not read it.

---

## 8. Things that need your attention

- **Instagram export ZIPs were not received.** Only the existing website ZIP and logo arrived, so I could not re-check `your_instagram_activity/media/reels.html` myself. The media came from the earlier build, which was filtered from the Posts/Post and Reels folders (stories, archived and unrelated content excluded). If you want the published/unpublished status re-verified, re-send the two export ZIPs.
- **Videos were not play-tested in a browser.** My test browser has no H.264 decoder. I confirmed all 22 videos decode cleanly (ffmpeg, no errors, correct durations) and that H.264 MP4 plays in Chrome, Edge, Safari and Firefox. After deploying, please tap one reel to confirm.
- **People and children.** The gallery includes photos with identifiable people, including children (toddler in a shopping cart, children at train windows) and several of the photographer himself in flower fields. All were published on your Instagram, but please confirm you are happy for them to be on the website. Easy to remove.
- **Personal account (@karthik.ks_._) photos.** 57 of the 97 photographs come from it. They are marked internally (`source` in `data/media.json`) and the viewer caption shows which account each came from. If you want the portfolio to show only the photography account, I can drop them.
- **Category judgement calls.** Animals that are wild/free (monkeys, langurs, birds, peacocks, butterflies) plus cow, calf and elephant are **Wildlife**; stray dogs and cats on streets are **Street**. Misty landscapes, skies, flowers and gardens are **Nature**. Architecture only has 8 photos, all from the personal account.
- **Almost every photo is portrait-oriented**, so the site is built around portrait frames (nothing is cropped or stretched). There are no landscape photographs to mix in.
- **Held back for your review (not on the site):** 12 exact duplicate photos + 2 duplicate videos; the post that is just your logo graphic; a screenshot of Lightroom edit settings; one oddly masked image; one personal reel showing friends with Malayalam text overlay.
- **Your watermark** (`karthik.ks_ PHOTOGRAPHY`) is part of the original photos and is untouched.
- **Phone number:** not requested and not anywhere in the site. A scan of every HTML, CSS, JS, JSON, XML and text file found no phone-style numbers and no call or chat-app links. Contact is by email and Instagram DM only.
- **Canonical URL, sitemap and social-preview image** can only be completed after you have a real address (step 4). Until then they are clearly marked placeholders.
- **No contact form** on purpose — a form needs a backend service. The email button and Instagram DM link are the contact routes.
