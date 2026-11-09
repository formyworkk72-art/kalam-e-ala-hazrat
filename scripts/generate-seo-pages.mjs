import fs from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

const SITE_URL =
  "https://formyworkk72-art.github.io/kalam-e-ala-hazrat";

const OUTPUT_DIR = "seo-kalam";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "SUPABASE_URL ya SUPABASE_ANON_KEY missing hai."
  );
}

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
    const url = new URL(
      `${SUPABASE_URL}/rest/v1/${table}`
    );

    url.searchParams.set(
      "select",
      "*"
    );
    url.searchParams.set("order", "id.asc");

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Range: `${start}-${start + pageSize - 1}`
      }
    });

    if (!response.ok) {
      throw new Error(
        `${table} table error: ${await response.text()}`
      );
    }

    const rows = await response.json();

    all.push(...rows);

    if (rows.length < pageSize) break;

    start += pageSize;
  }

  return all;
}

const directoryPages = [];
function getTitleAliases(row) {
  if (!row) return [];
  const fields = ["title_roman","roman_title","title_latin","latin_title","title_english","english_title","title_urdu","urdu_title","title_hindi","hindi_title","title_hi","alternate_title","alternate_name","alternate_names"];
  const values = fields.flatMap(field => { const value=row[field]; return Array.isArray(value)?value:(value?[value]:[]); });
  return [...new Set([String(row.title||""),...values].map(value=>String(value||"").trim()).filter(Boolean))];
}
function findLanguagePartner(source, targetRows, targetLanguage) {
  if (!source) return null;
  const direct=targetLanguage==="urdu"?["urdu_id","urdu_kalam_id","urdu_kalaam_id"]:["english_id","english_kalam_id","english_kalaam_id"];
  for(const field of direct){const id=source[field];if(id!==undefined&&id!==null){const row=targetRows.find(item=>String(item.id)===String(id));if(row)return row;}}
  const sourceId=String(source.id),reverse=targetLanguage==="urdu"?["english_id","english_kalam_id","english_kalaam_id"]:["urdu_id","urdu_kalam_id","urdu_kalaam_id"];
  const row=targetRows.find(item=>reverse.some(field=>item[field]!==undefined&&item[field]!==null&&String(item[field])===sourceId));if(row)return row;
  for(const field of ["translation_group_id","kalam_group_id","group_id","translation_key"]){const group=source[field];if(group!==undefined&&group!==null&&String(group).trim()){const match=targetRows.find(item=>item[field]!==undefined&&String(item[field])===String(group));if(match)return match;}}
  return null;
}
function pageUrlFor(row, language, title=row.title, slugTitle=title){const slug=makeSlug(slugTitle,row.id);return `${SITE_URL}/${OUTPUT_DIR}/${language}/${encodeURIComponent(slug)}/`;}
function createAlternateUrls(kalam, language, partner, field, label) {
  const makeTitle = row => label ? `${row.title} — ${label}` : row.title;
  const makeSlugTitle = row => label ? `${row.title} ${label}` : row.title;
  const alternates = [{
    language: language === "english" ? "en" : "ur",
    url: pageUrlFor(kalam, language, makeTitle(kalam), makeSlugTitle(kalam))
  }];
  if (!partner || (field && !String(partner[field] || "").trim())) return alternates;
  const partnerLanguage = language === "english" ? "urdu" : "english";
  alternates.push({
    language: partnerLanguage === "english" ? "en" : "ur",
    url: pageUrlFor(partner, partnerLanguage, makeTitle(partner), makeSlugTitle(partner))
  });
  return alternates;
}
function createPage(kalam, language, pageContent = {}) {
  const title = String(pageContent.title || kalam.title || "Kalam");
  const lyrics = String(pageContent.lyrics ?? kalam.lyrics ?? "");

  const slug = makeSlug(pageContent.slugTitle || title, kalam.id);

  const folder = path.join(
    OUTPUT_DIR,
    language,
    slug
  );

  const pageUrl =
    `${SITE_URL}/${OUTPUT_DIR}/${language}/${encodeURIComponent(slug)}/`;

  fs.mkdirSync(folder, { recursive: true });

  const isUrdu = language === "urdu";
  const isTazmeen = Boolean(pageContent.isTazmeen);
  const aliases = [...new Set([...(pageContent.alternateNames || []), ...getTitleAliases(kalam)])]
    .map(value => String(value || "").trim()).filter(value => value && value.toLocaleLowerCase() !== title.toLocaleLowerCase());
  const aliasText = aliases.join(" · ");
  const alternates = pageContent.alternates || [];
  const hreflangMarkup = alternates.map(item => `<link rel="alternate" hreflang="${escapeHtml(item.language)}" href="${escapeHtml(item.url)}">`).join(" ");
  const languageLinks = alternates.filter(item => item.language !== (isUrdu ? "ur" : "en")).map(item => `<a href="${escapeHtml(item.url)}" lang="${escapeHtml(item.language)}">${item.language === "ur" ? "اردو میں پڑھیں" : "Read in English"}</a>`).join(" · ");
  const descriptionText = `${title} | Complete ${isUrdu ? "Urdu" : "Roman Urdu and English"} naat lyrics by Imam Ahmad Raza Khan.${aliases.length ? ` Also known as ${aliases.slice(0, 2).join(", ")}.` : ""}`.slice(0, 180);
  const schema = JSON.stringify({"@context":"https://schema.org","@type":"CreativeWork",name:title,alternateName:aliases,inLanguage:isUrdu?"ur":"en",url:pageUrl,isPartOf:{"@type":"WebSite",name:"Kalam-e-Ala Hazrat",url:`${SITE_URL}/`}}).replace(/</g,"\\u003c");

  const safeTitle = escapeHtml(title);

  const safeLyrics = escapeHtml(lyrics)
    .replace(/\r?\n/g, "<br>\n");

  const html = `<!DOCTYPE html>
<html lang="${isUrdu ? "ur" : "en"}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="../../../seo-reader.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Naskh+Arabic:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">

  <title>${safeTitle} | Kalam-e-Ala Hazrat</title>

  <meta name="description" content="${escapeHtml(descriptionText)}">

  <meta name="robots" content="index, follow">

  <link rel="canonical" href="${pageUrl}">
  ${hreflangMarkup}

  <meta property="og:title" content="${safeTitle} | Kalam-e-Ala Hazrat">
  <meta property="og:description" content="${escapeHtml(descriptionText)}">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:type" content="article">
  <script type="application/ld+json">${schema}</script>

  <style>
    :root {
      color-scheme: light;
      --paper: #fbf8ed;
      --ink: #182944;
      --navy: #172b4a;
      --gold: #c9a64b;
      --gold-soft: #e9dba9;
      --muted: #596579;
    }
    * { box-sizing: border-box; }
    body {
      min-height: 100vh; margin: 0; padding: 24px 16px 40px;
      color: var(--ink);
      background: radial-gradient(ellipse at top, #fffdf7 0%, var(--paper) 70%);
      font-family: "Poppins", "Noto Nastaliq Urdu", Georgia, serif; line-height: 1.8;
    }
    .page-shell { max-width: 860px; margin: 0 auto; }
    .page-top { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 0 auto 18px; }
    .site-label { color: var(--navy); font-size: 14px; font-weight: 700; letter-spacing: .04em; }
    .site-back {
      display: inline-flex; min-height: 42px; align-items: center; justify-content: center; gap: 8px;
      padding: 9px 16px; border: 1px solid var(--gold); border-radius: 999px; color: var(--navy);
      background: linear-gradient(135deg, #fffdf7, #f3e9c9); box-shadow: 0 3px 12px #172b4a12;
      font: inherit; font-size: 14px; font-weight: 700; text-decoration: none;
      transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
    }
    .site-back:hover, .site-back:focus-visible { transform: translateY(-1px); background: #f2e5b9; box-shadow: 0 5px 16px #172b4a20; }
    .site-back:focus-visible { outline: 3px solid #c9a64b66; outline-offset: 3px; }
    .seo-aliases { margin: -12px 0 18px; color: var(--muted); font-size: 13px; text-align: center; }
    .seo-language-links { display:flex; justify-content:center; gap:12px; margin:0 0 16px; font-size:13px; }
    .seo-language-links a { color:var(--navy); }
    main { overflow: hidden; padding: clamp(22px, 5vw, 48px); border: 1px solid #d6c27b; border-radius: 22px; background: #fffefa; box-shadow: 0 12px 38px #172b4a12, inset 0 0 0 5px #f8f2dc; }
    html[lang="ur"] h1 { font-family: "Noto Nastaliq Urdu", "Noto Naskh Arabic", serif; }
    h1 { margin: 0 0 24px; padding: 0 0 20px; border-bottom: 1px solid var(--gold-soft); color: var(--navy); font-family: "Poppins", "Noto Nastaliq Urdu", Georgia, serif; font-size: clamp(24px, 4vw, 34px); line-height: 1.65; text-align: center; }
    .lyrics { color: #202a39; font-size: clamp(19px, 2.6vw, 23px); line-height: 2.05; overflow-wrap: anywhere; }
    .lyrics[dir="rtl"] { font-family: "Noto Nastaliq Urdu", "Noto Naskh Arabic", serif; font-size: clamp(21px, 3vw, 27px); line-height: 2.35; }
    .page-bottom { display: flex; justify-content: center; margin-top: 22px; }
    @media (max-width: 560px) {
      body { padding: 14px 11px 28px; }
      .page-top { align-items: flex-start; }
      .site-label { max-width: 42%; font-size: 12px; line-height: 1.4; }
      .site-back { min-height: 40px; padding: 8px 12px; font-size: 13px; }
      main { border-radius: 17px; }
    }
    @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; } }
  </style>
</head>

<body>
  <div class="page-shell">
    <header class="page-top" dir="${isUrdu ? "rtl" : "ltr"}">
      <span class="site-label">Kalam-e-Ala Hazrat</span>
      <div class="top-actions">
        <a class="site-back" href="${SITE_URL}/">${isUrdu ? "ویب سائٹ پر واپس" : "Kalam-e-Ala Hazrat Home"}</a>
        <button class="copy-full-btn" id="copyFullKalam" type="button">${isUrdu ? "مکمل کلام کاپی کریں" : "Copy full Kalam"}</button>
      </div>
    </header>
    <main data-tazmeen="${isTazmeen}">
      <h1>${safeTitle}</h1>
      ${aliasText ? `<p class="seo-aliases">Also searched as: ${escapeHtml(aliasText)}</p>` : ""}
      ${languageLinks ? `<nav class="seo-language-links" aria-label="Other language versions">${languageLinks}</nav>` : ""}
      <div class="lyrics reader-lyrics" id="lyricsContent" lang="${isUrdu ? "ur" : "en"}" dir="${isUrdu ? "rtl" : "auto"}">${safeLyrics}</div>
    </main>
    <div class="reader-toast" id="readerToast" role="status" aria-live="polite"></div>
    <footer class="page-bottom"><a class="site-back" href="${SITE_URL}/">${isUrdu ? "ویب سائٹ پر واپس" : "Kalam-e-Ala Hazrat Home"}</a></footer>
  </div>
  <script>
    (() => {
      const main = document.querySelector("main[data-tazmeen]");
      const lyrics = document.getElementById("lyricsContent");
      const copyFull = document.getElementById("copyFullKalam");
      const toast = document.getElementById("readerToast");
      const isUrdu = document.documentElement.lang === "ur";
      const isTazmeen = main?.dataset.tazmeen === "true";
      if (!main || !lyrics || !copyFull) return;
      let toastTimer;
      const showToast = message => {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("visible");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove("visible"), 1800);
      };
      const decoder = document.createElement("div");
      decoder.innerHTML = lyrics.innerHTML.replace(/<br\s*\/?\s*>/gi, "\n");
      const fullLyrics = decoder.textContent || "";
      if (!isTazmeen) {
        const lines = fullLyrics.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        const key = "kalam-seo-highlight:" + location.pathname;
        let saved = {};
        try { saved = JSON.parse(localStorage.getItem(key) || "{}"); } catch (_) {}
        const reader = document.createDocumentFragment();
        for (let i = 0; i < lines.length; i += 2) {
          const coupletLines = lines.slice(i, i + 2);
          const section = document.createElement("section");
          section.className = "couplet";
          const verse = document.createElement("div");
          verse.className = "verse";
          verse.dir = isUrdu ? "rtl" : "auto";
          const index = i / 2;
          coupletLines.forEach((line, lineIndex) => {
            const span = document.createElement("span");
            span.className = "verse-line";
            span.textContent = line;
            if (saved[index]?.[lineIndex]) span.classList.add("highlighted");
            verse.appendChild(span);
          });
          const actions = document.createElement("div");
          actions.className = "verse-actions";
          const makeButton = label => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "verse-action";
            button.textContent = label;
            return button;
          };
          const copy = makeButton(isUrdu ? "کاپی" : "Copy");
          copy.addEventListener("click", async () => {
            try { await navigator.clipboard.writeText(coupletLines.join("\n")); showToast(isUrdu ? "اشعار کاپی ہوگئے" : "Couplet copied"); }
            catch (_) { showToast(isUrdu ? "کاپی نہیں ہوسکا" : "Copy could not complete"); }
          });
          const highlight = makeButton(isUrdu ? "نمایاں کریں" : "Highlight");
          highlight.classList.add("highlight-toggle");
          const initiallyActive = coupletLines.some((_, n) => saved[index]?.[n]);
          if (initiallyActive) { highlight.classList.add("active"); highlight.textContent = isUrdu ? "نمایاں" : "Highlighted"; }
          highlight.addEventListener("click", () => {
            const active = !highlight.classList.contains("active");
            highlight.classList.toggle("active", active);
            highlight.textContent = active ? (isUrdu ? "نمایاں" : "Highlighted") : (isUrdu ? "نمایاں کریں" : "Highlight");
            const spans = [...verse.querySelectorAll(".verse-line")];
            spans.forEach(span => span.classList.toggle("highlighted", active));
            saved[index] = Object.fromEntries(spans.map((_, n) => [n, active]));
            try { localStorage.setItem(key, JSON.stringify(saved)); } catch (_) {}
          });
          const share = makeButton(isUrdu ? "شیئر" : "Share");
          share.addEventListener("click", async () => {
            const text = coupletLines.join("\n");
            try {
              if (navigator.share) { await navigator.share({ title: document.title, text }); showToast(isUrdu ? "شیئر ہوگیا" : "Shared"); }
              else { await navigator.clipboard.writeText(text); showToast(isUrdu ? "شیئر کے لیے کاپی ہوگیا" : "Copied to share"); }
            } catch (error) { if (error.name !== "AbortError") showToast(isUrdu ? "شیئر نہیں ہوسکا" : "Share could not complete"); }
          });
          actions.append(copy, highlight, share);
          section.append(verse, actions);
          reader.appendChild(section);
        }
        lyrics.replaceChildren(reader);
      }
      copyFull.addEventListener("click", async () => {
        const title = document.querySelector("h1")?.textContent?.trim() || "Kalam";
        try { await navigator.clipboard.writeText(title + "\n\n" + fullLyrics.trim()); showToast(isUrdu ? "مکمل کلام کاپی ہوگیا" : "Full Kalam copied"); }
        catch (_) { showToast(isUrdu ? "کاپی نہیں ہوسکا" : "Copy could not complete"); }
      });
    })();
  </script>
  <script src="../../../seo-reader.js" defer></script>
</body>
</html>`;

  directoryPages.push({ title, language, url: pageUrl });
  fs.writeFileSync(
    path.join(folder, "index.html"),
    html,
    "utf8"
  );

  return pageUrl;
}

function createKalamDirectory() {
  const sections=["english","urdu"].map(language=>{const pages=directoryPages.filter(page=>page.language===language);const heading=language==="urdu"?"اردو کلام":"English and Roman Urdu Kalam";const links=pages.map(page=>`<li><a href="${escapeHtml(page.url)}">${escapeHtml(page.title)}</a></li>`).join("\n");return `<section lang="${language=== "urdu"?"ur":"en"}" dir="${language==="urdu"?"rtl":"ltr"}"><h2>${heading}</h2><ul>${links}</ul></section>`;}).join("\n");
  const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>All Kalam and Naat Lyrics | Kalam-e-Ala Hazrat</title><meta name="description" content="Browse all English, Roman Urdu and Urdu Kalam and naat lyrics from Kalam-e-Ala Hazrat."><link rel="canonical" href="${SITE_URL}/${OUTPUT_DIR}/"><link rel="stylesheet" href="../seo-reader.css"><style>body{font-family:Poppins,Arial,sans-serif;background:#fbf8ed;color:#182944;margin:0;padding:20px}main{max-width:900px;margin:20px auto;background:#fffefa;border:1px solid #d6c27b;border-radius:18px;padding:24px}h1,h2{color:#172b4a}li{margin:8px 0}a{color:#172b4a}.home{display:inline-block;padding:8px 14px;border:1px solid #c9a64b;border-radius:999px;text-decoration:none;font-weight:700}</style></head><body><main><a class="home" href="${SITE_URL}/">Kalam-e-Ala Hazrat Home</a><h1>All Kalam and Naat Lyrics</h1><p>Browse each available Kalam page by language. New pages are added automatically.</p>${sections}</main></body></html>`;
  fs.writeFileSync(path.join(OUTPUT_DIR,"index.html"),html,"utf8");
}
function createSitemap(urls) {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}
</urlset>`;

  fs.writeFileSync("sitemap.xml", sitemap, "utf8");
}

async function main() {
const [english, urdu] = await Promise.all([
    getAllKalams("kalaam"),
    getAllKalams("kalaam_urdu")
  ]);

  // Keep the current SEO pages intact unless both source tables were fetched successfully.
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });

  const sitemapUrls = [
    `${SITE_URL}/`
  ];

  let count = 0;

  for (const kalam of english) {
    const urduPartner = findLanguagePartner(kalam, urdu, "urdu");
    if (kalam.title && kalam.lyrics) {
      const pageUrl = createPage(kalam, "english", { alternateNames: getTitleAliases(urduPartner), alternates: createAlternateUrls(kalam, "english", urduPartner) });

      sitemapUrls.push(pageUrl);
      count++;
    }

    const tazmeenFields = ["tazmeen", "tazmeen_2", "tazmeen_3"];
    for (const [index, field] of tazmeenFields.entries()) {
      const text = String(kalam[field] || "").trim();
      if (!kalam.title || !text) continue;

      const label = `Tazmeen ${index + 1}`;
      const pageUrl = createPage(kalam, "english", {
        title: `${kalam.title} — ${label}`,
        slugTitle: `${kalam.title} ${label}`,
        lyrics: text,
        isTazmeen: true,
        alternateNames: getTitleAliases(urduPartner),
        alternates: createAlternateUrls(kalam, "english", urduPartner, field, label)
      });

      sitemapUrls.push(pageUrl);
      count++;
    }
  }

  for (const kalam of urdu) {
    const englishPartner = findLanguagePartner(kalam, english, "english");
    if (kalam.title && kalam.lyrics) {
      const pageUrl = createPage(kalam, "urdu", { alternateNames: getTitleAliases(englishPartner), alternates: createAlternateUrls(kalam, "urdu", englishPartner) });

      sitemapUrls.push(pageUrl);
      count++;
    }

    const tazmeenFields = ["tazmeen", "tazmeen_2", "tazmeen_3"];
    for (const [index, field] of tazmeenFields.entries()) {
      const text = String(kalam[field] || "").trim();
      if (!kalam.title || !text) continue;

      const label = `Tazmeen ${index + 1}`;
      const pageUrl = createPage(kalam, "urdu", {
        title: `${kalam.title} — ${label}`,
        slugTitle: `${kalam.title} ${label}`,
        lyrics: text,
        isTazmeen: true,
        alternateNames: getTitleAliases(englishPartner),
        alternates: createAlternateUrls(kalam, "urdu", englishPartner, field, label)
      });

      sitemapUrls.push(pageUrl);
      count++;
    }
  }

  createKalamDirectory();
  sitemapUrls.push(`${SITE_URL}/${OUTPUT_DIR}/`);
  createSitemap(sitemapUrls);

  console.log(
    `SEO pages successfully generated: ${count}`
  );

  console.log(
    `Sitemap URLs generated: ${sitemapUrls.length}`
  );
}

main().catch(error => {
  console.error("SEO GENERATOR ERROR:", error);
  process.exit(1);
});
