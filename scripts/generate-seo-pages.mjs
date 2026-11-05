import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL ya SUPABASE_ANON_KEY missing hai.");
}

const OUTPUT_DIR = "seo-kalam";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function makeSlug(title, id) {
  const slug = String(title || "kalam")
    .normalize("NFC")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return `${slug || "kalam"}-${id}`;
}

async function getAllKalams(table) {
  const all = [];
  let start = 0;
  const pageSize = 1000;

  while (true) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    url.searchParams.set("select", "id,title,lyrics");
    url.searchParams.set("order", "id.asc");

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Range: `${start}-${start + pageSize - 1}`
      }
    });

    if (!response.ok) {
      throw new Error(`${table} table error: ${await response.text()}`);
    }

    const rows = await response.json();
    all.push(...rows);

    if (rows.length < pageSize) break;
    start += pageSize;
  }

  return all;
}

function createPage(kalam, language) {
  const title = String(kalam.title || "Kalam");
  const lyrics = String(kalam.lyrics || "");
  const slug = makeSlug(title, kalam.id);
  const folder = path.join(OUTPUT_DIR, language, slug);
  const pageUrl = `https://formyworkk72-art.github.io/kalam-e-ala-hazrat/${OUTPUT_DIR}/${language}/${slug}/`;

  fs.mkdirSync(folder, { recursive: true });

  const isUrdu = language === "urdu";
  const safeTitle = escapeHtml(title);
  const safeLyrics = escapeHtml(lyrics).replace(/\r?\n/g, "<br>\n");

  const html = `<!DOCTYPE html>
<html lang="${isUrdu ? "ur" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle} | Kalam-e-Ala Hazrat</title>
  <meta name="description" content="${escapeHtml(title)} — Kalam-e-Ala Hazrat. Read the complete Kalam online.">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${pageUrl}">
  <meta property="og:title" content="${safeTitle} | Kalam-e-Ala Hazrat">
  <meta property="og:description" content="Read ${safeTitle} online.">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="article">
  <style>
    body {
      margin: 0;
      padding: 24px 16px;
      background: #f7f9f6;
      color: #183c2d;
      font-family: Georgia, serif;
      line-height: 2;
    }
    main {
      max-width: 760px;
      margin: 30px auto;
      padding: 25px;
      background: white;
      border-radius: 14px;
      box-shadow: 0 4px 20px #183c2d12;
    }
    h1 {
      text-align: center;
      line-height: 1.6;
    }
    .lyrics {
      white-space: normal;
      font-size: 21px;
      text-align: ${isUrdu ? "right" : "left"};
      direction: ${isUrdu ? "rtl" : "auto"};
      line-height: 2.2;
    }
    a { color: #087447; }
  </style>
</head>
<body>
  <main>
    <p><a href="/kalam-e-ala-hazrat/">Kalam-e-Ala Hazrat — Home</a></p>
    <h1>${safeTitle}</h1>
    <div class="lyrics">${safeLyrics}</div>
    <hr>
    <p><a href="/kalam-e-ala-hazrat/">Visit Kalam-e-Ala Hazrat website</a></p>
  </main>
</body>
</html>`;

  fs.writeFileSync(path.join(folder, "index.html"), html, "utf8");
  return pageUrl;
}

async function main() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });

  const [english, urdu] = await Promise.all([
    getAllKalams("kalaam"),
    getAllKalams("kalaam_urdu")
  ]);

  let count = 0;

  for (const kalam of english) {
    if (kalam.title && kalam.lyrics) {
      createPage(kalam, "english");
      count++;
    }
  }

  for (const kalam of urdu) {
    if (kalam.title && kalam.lyrics) {
      createPage(kalam, "urdu");
      count++;
    }
  }

  console.log(`SEO pages successfully generated: ${count}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});