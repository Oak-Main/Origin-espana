#!/usr/bin/env node
// Origin España — deterministic bilingual static site builder.
// English is the default arrival language (owner directive 2026-09-21); the
// full Spanish experience lives at /es/ with hreflang alternates and a header
// toggle on every page. No framework, no runtime database, no client JS.
// Deployed direct-upload to the existing Cloudflare Pages project
// "originespana" (originespana.com).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ORIGIN = 'https://originespana.com';
const TODAY = new Date().toISOString().slice(0, 10);
const es = JSON.parse(readFileSync(new URL('./recipes.json', import.meta.url), 'utf8'));
const en = JSON.parse(readFileSync(new URL('./recipes.en.json', import.meta.url), 'utf8'));
for (const r of es) r.en = en[r.slug];
const T = {
  en: { lang: 'en', site: 'Origin España', tag: 'Traditional Spanish cooking, from grandma\'s recipe to your table', kicker: 'Recipes of a lifetime', home: 'Home', recipes: 'Recipes', all: 'All recipes', regions: 'Regions', ingredients: 'Ingredients', method: 'Method', grandma: 'Grandma\'s note', prep: 'Prep', cook: 'Cook', total: 'Total', servings: 'servings', hours: 'h', search: 'Search recipes', searchBody: 'The interactive search is on its way. Meanwhile, the full recipe index works just as well.', goIndex: 'Go to the index →', nf: '404 — This page got burnt', nfBody: 'Like a clove of garlic left too long on the fire. Head back to the home page or the recipe index.', fundamentals: 'Essential recipes', byRegion: 'By region', count: (n, rg) => `${n} traditional recipes from ${rg} regions`, switch: 'Español', locale: 'en_EN', cuisine: 'Spanish', descHome: 'Authentic recipes from all over Spain: rice dishes, stews, tortillas and desserts, explained step by step.', descList: 'Complete index of traditional Spanish recipes: by region, category and cooking time.', descSearch: 'Search traditional Spanish recipes.' },
  es: { lang: 'es', site: 'Origin España', tag: 'Cocina tradicional española, de la receta de la abuela a tu mesa', kicker: 'Recetas de toda la vida', home: 'Inicio', recipes: 'Recetas', all: 'Todas las recetas', regions: 'Regiones', ingredients: 'Ingredientes', method: 'Elaboración', grandma: 'Nota de la abuela', prep: 'Preparación', cook: 'Cocción', total: 'Total', servings: 'raciones', hours: ' h', search: 'Buscar recetas', searchBody: 'El buscador interactivo está de camino. Mientras tanto, el índice completo de recetas sirve igual.', goIndex: 'Ir al índice →', nf: '404 — Esta página se nos ha quemado', nfBody: 'Como un ajo pasado de fuego. Vuelve al inicio o al índice de recetas.', fundamentals: 'Recetas fundamentales', byRegion: 'Por región', count: (n, rg) => `${n} recetas tradicionales, de ${rg} regiones`, switch: 'English', locale: 'es_ES', cuisine: 'Española', descHome: 'Recetas auténticas de toda España: arroces, guisos, tortillas y postres, explicados paso a paso.', descList: 'Índice completo de recetas tradicionales españolas: por región, categoría y tiempo de cocción.', descSearch: 'Buscador de recetas tradicionales españolas.' },
};
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const iso = (m) => `PT${String(m).padStart(2, '0')}M`;
const total = (r) => r.prepMinutes + r.cookMinutes;
const num = (n) => Math.round(n * 10) / 10;

const CSS = `:root{--ink:#2b2118;--cream:#faf6ef;--paper:#fff;--terra:#a34a2a;--olive:#5c6b3f;--line:#e7ddcd;--soft:#6f6353}*{margin:0;padding:0;box-sizing:border-box}body{font:17px/1.65 Georgia,'Iowan Old Style','Times New Roman',serif;color:var(--ink);background:var(--cream)}a{color:var(--terra);text-decoration:none}a:hover{text-decoration:underline}.wrap{max-width:880px;margin:0 auto;padding:0 20px}header.site{border-bottom:2px solid var(--ink);background:var(--paper)}.site .wrap{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;padding:16px 20px}.brand{font-size:1.4rem;font-weight:700;color:var(--ink)}.brand em{color:var(--terra);font-style:normal}nav.main a{margin-left:20px;font-size:.95rem;color:var(--soft)}nav.main a:hover{color:var(--terra);text-decoration:none}.lang{font-size:.85rem;border:1.5px solid var(--terra);color:var(--terra);border-radius:999px;padding:3px 14px;margin-left:20px;font-family:system-ui}.lang:hover{background:var(--terra);color:#fff;text-decoration:none}.hero{padding:52px 0 36px}.hero h1{font-size:2.2rem;line-height:1.2;max-width:660px}.hero p{margin-top:14px;max-width:580px;color:var(--soft);font-size:1.05rem}.kicker{display:inline-block;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--olive);border:1px solid var(--olive);border-radius:999px;padding:3px 12px;margin-bottom:18px}section{padding:32px 0}.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}.card{background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:20px 20px 16px;transition:box-shadow .15s;display:block;color:var(--ink)}.card:hover{box-shadow:0 4px 18px rgba(43,33,24,.08);text-decoration:none}.card h3{font-size:1.1rem;line-height:1.3}.card .sub{font-size:.85rem;color:var(--soft);margin-top:4px}.card .meta{margin-top:8px;font-size:.8rem;color:var(--soft)}.card .region{color:var(--olive)}h2.section-title{font-size:1.5rem;margin-bottom:20px}.recipe h1{font-size:2rem;line-height:1.25;max-width:700px}.recipe .lede{margin:16px 0 6px;font-size:1.06rem;color:var(--soft);max-width:640px}.facts{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 26px}.fact{font-size:.85rem;background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:6px 12px}.cols{display:grid;grid-template-columns:290px 1fr;gap:36px}.cols h2{font-size:1.15rem;margin-bottom:12px}ul.ingredients{list-style:none}.ingredients li{padding:7px 0;border-bottom:1px dashed var(--line);font-size:.98rem}ol.steps{counter-reset:step;list-style:none}.steps li{counter-increment:step;position:relative;padding:0 0 18px 44px}.steps li::before{content:counter(step);position:absolute;left:0;top:1px;width:28px;height:28px;border-radius:50%;background:var(--terra);color:#fff;font-size:.9rem;display:flex;align-items:center;justify-content:center;font-family:system-ui}.steps li::after{content:'';position:absolute;left:13px;top:32px;bottom:2px;width:1px;background:var(--line)}.steps li:last-child::after{display:none}.note{margin-top:26px;padding:14px 18px;background:#f3efe4;border-left:3px solid var(--olive);font-size:.95rem;border-radius:0 8px 8px 0}footer.site{margin-top:60px;border-top:2px solid var(--ink);background:var(--paper);padding:24px 0;font-size:.88rem;color:var(--soft)}footer .wrap{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px}.skip-link{position:absolute;left:16px;top:-80px;z-index:10;background:var(--ink);color:var(--cream);padding:8px 14px;border-radius:4px}.skip-link:focus{top:12px}a:focus-visible,.skip-link:focus-visible{outline:3px solid var(--olive);outline-offset:3px}@media(max-width:720px){.cols{grid-template-columns:1fr}.hero h1{font-size:1.7rem}}`;

// Routes: EN default at /, full ES mirror at /es/. Same recipe slugs.
const routes = { en: { home: '/', list: '/recipes/', recipe: (s) => `/recipes/${s}/`, search: '/search/' }, es: { home: '/es/', list: '/es/recetas/', recipe: (s) => `/es/receta/${s}/`, search: '/es/buscar/' } };
const alt = { en: 'es', es: 'en' };

function head(L, { title, desc, path, altPath, jsonLd = [] }) {
  return `<!DOCTYPE html>
<html lang="${L.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${ORIGIN}${path}">
${altPath ? `<link rel="alternate" hreflang="${alt[L.lang]}" href="${ORIGIN}${altPath}">\n<link rel="alternate" hreflang="${L.lang}" href="${ORIGIN}${path}">\n<link rel="alternate" hreflang="x-default" href="${ORIGIN}${routes.en.home}">` : ''}
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${L.site}">
<meta property="og:locale" content="${L.locale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${ORIGIN}${path}">
<meta name="twitter:card" content="summary">
<style>${CSS}</style>
${jsonLd.map((n) => `<script type="application/ld+json">${JSON.stringify(n)}</script>`).join('\n')}
</head>
<body>
<a class="skip-link" href="#main-content">${L.lang === 'es' ? 'Saltar al contenido principal' : 'Skip to main content'}</a>`;
}

const header = (L, altHref) => `<header class="site"><div class="wrap"><a class="brand" href="${routes[L.lang].home}">Origin <em>España</em></a><span style="display:flex;align-items:baseline"><nav class="main"><a href="${routes[L.lang].list}">${L.recipes}</a></nav><a class="lang" href="${altHref || routes[alt[L.lang]].home}">${L.switch}</a></span></div></header>`;
const footer = (L) => `<footer class="site"><div class="wrap"><span>© ${TODAY.slice(0, 4)} Origin España</span><span>${L.lang === 'es' ? 'Recetas de la abuela, cocinadas sin prisa' : 'Grandma\'s recipes, cooked without hurry'} · <a href="${routes[alt[L.lang]].home}">${L.switch}</a></span></div></footer>`;

function recipePage(L, r) {
  const isEn = L.lang === 'en';
  const title = isEn ? r.en.title : r.title;
  const sub = isEn ? r.en.subtitle : r.subtitle;
  const desc = isEn ? r.en.description : r.description;
  const steps = isEn ? r.en.steps : r.steps;
  const note = isEn ? r.en.note : r.note;
  const cat = isEn ? r.en.category : r.category;
  const path = routes[L.lang].recipe(r.slug);
  const altPath = routes[alt[L.lang]].recipe(r.slug);
  const ld = { '@context': 'https://schema.org', '@type': 'Recipe', name: title, description: desc, inLanguage: L.lang,
    recipeCuisine: L.cuisine, recipeCategory: cat, keywords: [...(isEn ? [r.title] : [r.en.title]), ...r.tags].join(', '),
    author: { '@type': 'Organization', name: 'Origin España', url: ORIGIN },
    prepTime: iso(r.prepMinutes), cookTime: iso(r.cookMinutes), totalTime: iso(total(r)), recipeYield: `${r.servings} ${L.servings}`,
    recipeIngredient: r.ingredients.map((i) => `${i.qty} ${i.item}`.trim()),
    recipeInstructions: steps.map((s, n) => ({ '@type': 'HowToStep', position: n + 1, name: s.name, text: s.text })) };
  const crumbs = { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
    { '@type': 'ListItem', position: 1, name: L.home, item: `${ORIGIN}${routes[L.lang].home}` },
    { '@type': 'ListItem', position: 2, name: L.recipes, item: `${ORIGIN}${routes[L.lang].list}` },
    { '@type': 'ListItem', position: 3, name: title, item: `${ORIGIN}${path}` }] };
  return `${head(L, { title: `${title} — ${isEn ? 'Traditional Spanish Recipe' : 'Receta Tradicional'} | Origin España`, desc, path, altPath, jsonLd: [ld, crumbs] })}
${header(L, altPath)}
<main id="main-content" class="wrap recipe">
  <p class="kicker">${esc(r.region)} · ${esc(cat)}</p>
  <h1>${esc(title)}</h1>
  <p class="lede">${esc(sub)}</p>
  <div class="facts"><span class="fact">${L.prep}: ${r.prepMinutes} min</span><span class="fact">${L.cook}: ${r.cookMinutes} min</span><span class="fact">${L.total}: ${num(total(r) / 60)}${L.hours}</span><span class="fact">${r.servings} ${L.servings}</span></div>
  <div class="cols">
    <div><h2>${L.ingredients}</h2><ul class="ingredients">${r.ingredients.map((i) => `<li>${esc(`${i.qty ? i.qty + ' ' : ''}${i.item}`.trim())}</li>`).join('')}</ul></div>
    <div><h2>${L.method}</h2><ol class="steps">${steps.map((s) => `<li><strong>${esc(s.name)}.</strong> ${esc(s.text)}</li>`).join('')}</ol>${note ? `<div class="note"><strong>${L.grandma}.</strong> ${esc(note)}</div>` : ''}</div>
  </div>
</main>
${footer(L)}
</body></html>`;
}

const card = (L, r) => { const isEn = L.lang === 'en'; const t = isEn ? r.en.title : r.title; const s = isEn ? r.en.subtitle : r.subtitle;
  return `<a class="card" href="${routes[L.lang].recipe(r.slug)}"><h3>${esc(t)}</h3><p class="sub">${esc(s)}</p><p class="meta"><span class="region">${esc(r.region)}</span> · ${num(total(r) / 60)}${L.hours}</p></a>`; };

function homePage(L) {
  const regions = [...new Set(es.map((r) => r.region))];
  return `${head(L, { title: `Origin España — ${L.lang === 'es' ? 'Cocina Tradicional Española y Catalana' : 'Traditional Spanish Cooking'}`, desc: L.descHome, path: routes[L.lang].home, altPath: routes[alt[L.lang]].home, jsonLd: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Origin España', url: ORIGIN, inLanguage: L.lang }] })}
${header(L, routes[alt[L.lang]].home)}
<main id="main-content" class="wrap">
  <section class="hero"><span class="kicker">${L.kicker}</span><h1>${esc(L.tag)}</h1><p>${esc(L.descHome)}</p></section>
  <section><h2 class="section-title">${L.fundamentals}</h2><div class="cards">${es.map((r) => card(L, r)).join('')}</div></section>
  <section id="regions"><h2 class="section-title">${L.byRegion}</h2><p>${regions.map((rg) => `<a href="${routes[L.lang].list}">${esc(rg)}</a>`).join(' · ')}</p></section>
</main>
${footer(L)}
</body></html>`;
}

function listPage(L) {
  return `${head(L, { title: `${L.all} | Origin España`, desc: L.descList, path: routes[L.lang].list, altPath: routes[alt[L.lang]].list })}
${header(L, routes[alt[L.lang]].list)}
<main id="main-content" class="wrap"><section><h1 style="font-size:1.85rem;margin:30px 0 6px">${L.all}</h1>
<p class="lede" style="margin-bottom:24px">${L.count(es.length, [...new Set(es.map((r) => r.region))].length)}</p>
<div class="cards" style="padding-bottom:50px">${es.map((r) => card(L, r)).join('')}</div></section></main>
${footer(L)}
</body></html>`;
}

function searchPage(L) {
  return `${head(L, { title: `${L.search} | Origin España`, desc: L.descSearch, path: routes[L.lang].search, altPath: routes[alt[L.lang]].search })}
${header(L, routes[alt[L.lang]].search)}
<main id="main-content" class="wrap"><section style="padding:50px 0"><h1>${L.search}</h1>
<p class="lede" style="margin:14px 0 20px">${L.searchBody}</p>
<p><a class="fact" href="${routes[L.lang].list}" style="display:inline-block">${L.goIndex}</a></p></section></main>${footer(L)}</body></html>`;
}

const notFound = `${head(T.en, { title: `Page not found | Origin España`, desc: 'Page not found.', path: '/404.html' })}
${header(T.en, routes.es.home)}<main id="main-content" class="wrap"><section style="padding:60px 0"><h1>${T.en.nf}</h1>
<p class="lede" style="margin:14px 0 20px">${T.en.nfBody}</p></section></main>${footer(T.en)}</body></html>`;

const IN_KEY = "d390aee0a606d453b3585684871efd3e"; // fleet IndexNow key (vault: INDEXNOW_KEY)
const dist = fileURLToPath(new URL('./dist/', import.meta.url));
const write = (rel, content) => { mkdirSync(join(dist, rel), { recursive: true }); writeFileSync(join(dist, rel, 'index.html'), content); };
write('.', homePage(T.en)); write('recipes', listPage(T.en)); write('search', searchPage(T.en));
write('es', homePage(T.es)); write('es/recetas', listPage(T.es)); write('es/buscar', searchPage(T.es));
for (const r of es) { write(`recipes/${r.slug}`, recipePage(T.en, r)); write(`es/receta/${r.slug}`, recipePage(T.es, r)); }
writeFileSync(join(dist, '404.html'), notFound);
writeFileSync(join(dist, IN_KEY + '.txt'), IN_KEY);
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);
const urls = ['.', 'recipes/', 'search/', 'es/', 'es/recetas/', 'es/buscar/', ...es.map((r) => `recipes/${r.slug}/`), ...es.map((r) => `es/receta/${r.slug}/`)];
writeFileSync(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${ORIGIN}/${u === '.' ? '' : u}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);
console.log(`Origin España: built ${urls.length} URLs (${es.length} recipes × en/es) -> dist/`);
