#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.MYPA_CONTENT_MIRROR_ROOT ?? path.join(process.cwd(), 'content-mirror'));
const MEDIA_ROOT = path.join(ROOT, 'media', 'recipes');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');
const SUMMARY_PATH = path.join(ROOT, 'recipe-stage-summary.json');
const DATASET_URL = process.env.RECIPE_DATASET_URL ?? 'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const REQUIRED_PROCESS = 3;
const REQUIRED_TOTAL = 4;
const MAX_RECIPES = Number.isFinite(Number(process.env.RECIPE_STAGE_MAX)) && Number(process.env.RECIPE_STAGE_MAX) > 0 ? Math.floor(Number(process.env.RECIPE_STAGE_MAX)) : null;
const CONCURRENCY = Math.min(4, Math.max(1, Number(process.env.RECIPE_STAGE_CONCURRENCY ?? 2)));
const USER_AGENT = 'MYPA-recipe-guaranteed-media/7.0 (content pipeline)';
const MIN_PROCESS_SCORE = 7;
const MIN_FINAL_SCORE = 6;

const clean = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();
const titleClean = (value = '') => clean(value).replace(/^["']+|["']+$/g, '').trim();
const slug = (value) => titleClean(value).toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || createHash('sha1').update(titleClean(value)).digest('hex').slice(0, 12);
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');

async function exists(file) { try { await access(file); return true; } catch { return false; } }
async function fetchBytes(url) {
  let last;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json,text/html,image/*,*/*;q=0.8' } });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      last = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, 700 * 2 ** attempt));
    }
  }
  throw last;
}
async function json(url) { return JSON.parse((await fetchBytes(url)).toString('utf8')); }
async function saveJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(tmp, file);
}

function license(meta = {}) {
  const short = clean(meta.LicenseShortName?.value ?? meta.LicenseShortName ?? '');
  const terms = clean(meta.UsageTerms?.value ?? meta.UsageTerms ?? '');
  const text = `${short} ${terms}`;
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(text)) return null;
  if (/CC0|public domain|public-domain|PDM/i.test(text)) return 'CC0/Public Domain';
  if (/CC BY-SA/i.test(text)) return 'CC BY-SA';
  if (/CC BY/i.test(text)) return 'CC BY';
  return null;
}

function tokens(text) {
  return new Set(clean(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((x) => x.length >= 3));
}
function extractAction(step = '') {
  const text = clean(step).toLowerCase();
  const actions = [
    ['chop', ['chop', 'dice', 'mince', 'slice', 'cut', 'julienne'], 'knife'],
    ['mix', ['mix', 'stir', 'whisk', 'beat', 'fold', 'combine', 'blend'], 'bowl'],
    ['fry', ['fry', 'saute', 'sauté', 'sear', 'skillet'], 'pan'],
    ['boil', ['boil', 'simmer', 'poach'], 'pot'],
    ['bake', ['bake', 'oven', 'roast', 'broil'], 'oven'],
    ['pour', ['pour', 'drizzle', 'sprinkle', 'season', 'add'], 'pour'],
    ['shape', ['shape', 'knead', 'roll', 'form'], 'bowl']
  ];
  for (const [name, terms, icon] of actions) if (terms.some((term) => text.includes(term))) return { name, terms, icon };
  return { name: 'prepare', terms: ['prepare', 'cook', 'serve', 'dish'], icon: 'bowl' };
}
function stageIcon(stage, step) {
  if (stage === 'process-1') return 'prepare';
  if (stage === 'final') return 'plate';
  return extractAction(step).icon;
}

function parseRecipe(row) {
  const data = row?.recipe_data ?? row ?? {};
  const lines = Array.isArray(data.text_lines) ? data.text_lines : [];
  const title = titleClean(data.title || row.title || row.filename?.split('/').pop()?.replace(/\.html$/i, '') || 'Untitled Recipe');
  const sourceUrl = data.url || `https://en.wikibooks.org/wiki/Cookbook:${encodeURIComponent(title.replace(/ /g, '_'))}`;
  const ingredients = lines.filter((x) => x?.line_type === 'ul' && /ingredient/i.test(x.section || '')).map((x) => clean(x.text)).filter(Boolean);
  const steps = lines.filter((x) => x?.line_type === 'ol').map((x) => clean(x.text)).filter((x) => x.length >= 10);
  return { title, sourceUrl, ingredients, steps };
}

function buildStagePlan(item) {
  const ingredients = item.ingredients.slice(0, 8);
  const steps = [...new Map(item.steps.map((step) => [clean(step).toLowerCase(), clean(step)])).values()];
  const ingredientSummary = ingredients.length ? ingredients.join(', ') : 'the listed recipe ingredients';
  if (steps.length >= 3) {
    return [
      { stage: 'process-1', sourceType: 'explicit-step', step: steps[0], basedOnSteps: [0], visualHint: 'preparation' },
      { stage: 'process-2', sourceType: 'explicit-step', step: steps[Math.floor((steps.length - 1) / 2)], basedOnSteps: [Math.floor((steps.length - 1) / 2)], visualHint: 'core-process' },
      { stage: 'process-3', sourceType: 'explicit-step', step: steps.at(-1), basedOnSteps: [steps.length - 1], visualHint: 'finishing' }
    ];
  }
  if (steps.length === 2) {
    return [
      { stage: 'process-1', sourceType: 'ingredient-derived-stage', step: `Prepare the listed ingredients: ${ingredientSummary}.`, basedOnSteps: [], visualHint: 'preparation' },
      { stage: 'process-2', sourceType: 'explicit-step', step: steps[0], basedOnSteps: [0], visualHint: 'core-process' },
      { stage: 'process-3', sourceType: 'explicit-step', step: steps[1], basedOnSteps: [1], visualHint: 'finishing' }
    ];
  }
  if (steps.length === 1) {
    return [
      { stage: 'process-1', sourceType: 'ingredient-derived-stage', step: `Prepare the listed ingredients: ${ingredientSummary}.`, basedOnSteps: [], visualHint: 'preparation' },
      { stage: 'process-2', sourceType: 'explicit-step', step: steps[0], basedOnSteps: [0], visualHint: 'core-process' },
      { stage: 'process-3', sourceType: 'step-derived-stage', step: `Finishing view derived from the recipe procedure: ${steps[0]}`, basedOnSteps: [0], visualHint: 'finishing' }
    ];
  }
  return [
    { stage: 'process-1', sourceType: 'ingredient-derived-stage', step: `Ingredient preparation reference: ${ingredientSummary}.`, basedOnSteps: [], visualHint: 'preparation' },
    { stage: 'process-2', sourceType: 'procedure-missing-fallback', step: `Recipe procedure is unavailable; process illustration is derived from the recipe title and ingredients for ${item.title}.`, basedOnSteps: [], visualHint: 'core-process' },
    { stage: 'process-3', sourceType: 'procedure-missing-fallback', step: `Finishing illustration derived from the recipe title and ingredients for ${item.title}.`, basedOnSteps: [], visualHint: 'finishing' }
  ];
}

function scoreCandidate(query, candidateText, action) {
  const q = tokens(query);
  const c = tokens(candidateText);
  const titleOverlap = [...q].filter((token) => c.has(token)).reduce((sum, token) => sum + (token.length >= 6 ? 2 : 1), 0);
  const actionOverlap = action.terms.filter((term) => candidateText.toLowerCase().includes(term)).length * 3;
  const processCue = /pan|skillet|pot|bowl|oven|knife|chop|slice|dice|mix|stir|whisk|bake|boil|fry|cook|knead|roll/i.test(candidateText) ? 2 : 0;
  const finishedCue = /finished|served|plated|dish|meal|ready to eat/i.test(candidateText) ? 2 : 0;
  return titleOverlap + actionOverlap + processCue - finishedCue;
}

async function commonsSearch(query, { mode = 'process', action = extractAction(query), limit = 12 } = {}) {
  const params = new URLSearchParams({
    action: 'query',
    generator: 'search',
    gsrnamespace: '6',
    gsrsearch: query,
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '1600',
    format: 'json',
    formatversion: '2'
  });
  const pages = (await json(`${COMMONS_API}?${params}`))?.query?.pages ?? [];
  const out = [];
  for (const page of pages) {
    const info = page?.imageinfo?.[0];
    if (!info?.url || !/^image\/(jpeg|png|webp)$/i.test(info.mime ?? '')) continue;
    if (Number(info.width || 0) < 500 || Number(info.height || 0) < 500) continue;
    const approved = license(info.extmetadata ?? {});
    if (!approved) continue;
    const text = `${page.title || ''} ${info.extmetadata?.ImageDescription?.value || ''} ${info.extmetadata?.Categories?.value || ''}`;
    const score = scoreCandidate(query, clean(text), action);
    if (mode === 'process') {
      const hasActionCue = action.terms.some((term) => clean(text).toLowerCase().includes(term));
      if (!hasActionCue || score < MIN_PROCESS_SCORE || /finished|served|plated/i.test(text)) continue;
    } else if (score < MIN_FINAL_SCORE && !/finished|served|plated|dish|meal/i.test(text)) continue;
    out.push({ url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, license: approved, attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), title: String(page.title || '').replace(/^File:/i, ''), score });
  }
  return out.sort((a, b) => b.score - a.score);
}

async function pageImages(item) {
  let page;
  try { page = decodeURIComponent(new URL(item.sourceUrl).pathname.split('/wiki/')[1] || '') || `Cookbook:${item.title}`; } catch { page = `Cookbook:${item.title}`; }
  const params = new URLSearchParams({ action: 'parse', page, prop: 'images', format: 'json', formatversion: '2' });
  const names = (await json(`${WIKIBOOKS_API}?${params}`))?.parse?.images ?? [];
  const filtered = names.filter((name) => /\.(jpe?g|png|webp)$/i.test(name) && !/icon|logo|flag|difficulty/i.test(name)).slice(0, 24);
  if (!filtered.length) return [];
  const infoParams = new URLSearchParams({ action: 'query', titles: filtered.map((name) => `File:${name}`).join('|'), prop: 'imageinfo', iiprop: 'url|size|mime|extmetadata', iiurlwidth: '1600', format: 'json', formatversion: '2' });
  const pages = (await json(`${WIKIBOOKS_API}?${infoParams}`))?.query?.pages ?? [];
  return pages.map((page) => page?.imageinfo?.[0]).filter((info) => info?.url && /^image\/(jpeg|png|webp)$/i.test(info.mime ?? '') && Number(info.width || 0) >= 500 && Number(info.height || 0) >= 500 && license(info.extmetadata ?? {})).map((info) => ({ url: info.thumburl || info.url, sourceUrl: info.descriptionurl || info.url, license: license(info.extmetadata ?? {}), attribution: clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor'), title: clean(info.extmetadata?.ObjectName?.value || info.descriptionurl || 'Wikibooks image') }));
}

async function encodeWebp(source, target) {
  const attempts = [
    [1200, 82], [1000, 74], [900, 66], [800, 58], [700, 50], [600, 44], [520, 38], [440, 32], [360, 26]
  ];
  let best = null;
  for (const [width, quality] of attempts) {
    const image = await sharp(source, { failOn: 'none' }).rotate().resize({ width, height: width, fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 5 }).toBuffer();
    best = image;
    if (image.length <= 64 * 1024) break;
  }
  if (!best || best.length > 64 * 1024) throw new Error('WebP size budget exceeded');
  await writeFile(target, best);
  return { sizeBytes: best.length, sha256: sha256(best) };
}

function escapeXml(value) { return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;'); }
function wrapText(text, maxChars) {
  const words = clean(text).split(' '); const lines = []; let line = '';
  for (const word of words) { const next = line ? `${line} ${word}` : word; if (next.length > maxChars && line) { lines.push(line); line = word; } else line = next; }
  if (line) lines.push(line); return lines.slice(0, 6);
}
function iconSvg(kind, accent) {
  const common = `fill="none" stroke="${accent}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"`;
  if (kind === 'knife') return `<path ${common} d="M160 330 L430 70 L560 200 L290 460 Z"/><path ${common} d="M340 410 L540 610"/>`;
  if (kind === 'oven') return `<rect ${common} x="170" y="100" width="460" height="500" rx="34"/><rect ${common} x="235" y="235" width="330" height="240" rx="20"/><circle ${common} cx="255" cy="160" r="10"/><circle ${common} cx="320" cy="160" r="10"/>`;
  if (kind === 'pan') return `<ellipse ${common} cx="330" cy="310" rx="210" ry="110"/><path ${common} d="M520 285 L720 150"/><path ${common} d="M150 360 Q330 545 510 360"/>`;
  if (kind === 'pot') return `<rect ${common} x="190" y="235" width="340" height="310" rx="40"/><path ${common} d="M135 235 H585"/><path ${common} d="M250 160 H470"/><path ${common} d="M170 300 H110"/><path ${common} d="M610 300 H550"/>`;
  if (kind === 'pour') return `<path ${common} d="M210 150 H500 L450 520 H260 Z"/><path ${common} d="M520 190 Q640 235 550 350"/><path ${common} d="M480 370 C555 425 620 425 690 365"/>`;
  if (kind === 'plate') return `<ellipse ${common} cx="400" cy="380" rx="270" ry="160"/><ellipse ${common} cx="400" cy="380" rx="205" ry="112"/>`;
  return `<path ${common} d="M160 280 Q400 520 640 280"/><path ${common} d="M175 280 Q400 150 625 280"/><path ${common} d="M250 255 C300 200 340 200 390 255"/><path ${common} d="M410 255 C460 200 500 200 550 255"/>`;
}

async function generateProcessIllustration({ item, stage, step, visualHint, target }) {
  const action = extractAction(step);
  const kind = visualHint === 'preparation' ? (item.ingredients.some((x) => /chop|slice|dice|mince|cut/i.test(x)) ? 'knife' : 'bowl') : stage === 'process-3' ? action.icon : action.icon;
  const seed = createHash('sha1').update(`${item.title}|${stage}|${step}`).digest('hex');
  const accent = `#${seed.slice(0, 6)}`;
  const lines = wrapText(step, 34);
  const ingredientLine = wrapText(item.ingredients.slice(0, 5).join(' • ') || 'Recipe ingredients', 42).slice(0, 2);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" rx="48" fill="#F7F5EF"/>
  <text x="70" y="90" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#6B7280">MYPA RECIPE PROCESS</text>
  <text x="70" y="150" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="800" fill="#172033">${escapeXml(item.title).slice(0, 48)}</text>
  <text x="70" y="200" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="#4B5563">${escapeXml(stage.replace('-', ' ').toUpperCase())} • ${escapeXml(action.name)}</text>
  <circle cx="920" cy="320" r="190" fill="#E9EEF5"/>
  <g transform="translate(700 100) scale(.7)">${iconSvg(stage === 'process-3' ? 'plate' : kind, accent)}</g>
  <rect x="70" y="275" width="710" height="430" rx="34" fill="#FFFFFF" stroke="#D9DEE7" stroke-width="4"/>
  <text x="110" y="335" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="700" fill="#6B7280">RECIPE-DERIVED STAGE</text>
  ${lines.map((line, i) => `<text x="110" y="${405 + i * 52}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="600" fill="#172033">${escapeXml(line)}</text>`).join('')}
  <text x="110" y="610" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700" fill="#6B7280">Ingredients context</text>
  ${ingredientLine.map((line, i) => `<text x="110" y="${650 + i * 30}" font-family="Arial, Helvetica, sans-serif" font-size="21" fill="#374151">${escapeXml(line)}</text>`).join('')}
  <text x="70" y="815" font-family="Arial, Helvetica, sans-serif" font-size="23" fill="#6B7280">Deterministic illustration generated from this recipe's procedure text.</text>
</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return encodeWebp(png, target);
}

async function generateFinalIllustration(item, target) {
  const seed = createHash('sha1').update(item.title).digest('hex');
  const accentA = `#${seed.slice(0, 6)}`;
  const accentB = `#${seed.slice(6, 12)}`;
  const ingredientWords = item.ingredients.slice(0, 6).map((x) => clean(x).split(/\s+/).slice(0, 3).join(' '));
  const garnish = ingredientWords.map((word, i) => {
    const x = 390 + ((i * 97) % 380); const y = 465 + ((i * 37) % 65);
    return `<ellipse cx="${x}" cy="${y}" rx="${30 + (i % 3) * 8}" ry="${18 + (i % 2) * 6}" fill="${i % 2 ? accentA : accentB}" opacity="0.82"/><text x="${x - 26}" y="${y + 6}" font-family="Arial, Helvetica, sans-serif" font-size="14" font-weight="700" fill="#172033">${escapeXml(word.slice(0, 12))}</text>`;
  }).join('');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" rx="48" fill="#F7F5EF"/>
  <text x="70" y="95" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" fill="#6B7280">MYPA RECIPE FINAL</text>
  <text x="70" y="160" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800" fill="#172033">${escapeXml(item.title).slice(0, 44)}</text>
  <ellipse cx="600" cy="600" rx="365" ry="175" fill="#D9DEE7" opacity="0.7"/>
  <ellipse cx="600" cy="500" rx="330" ry="195" fill="#FFFFFF" stroke="#C9CFD8" stroke-width="10"/>
  <ellipse cx="600" cy="500" rx="270" ry="145" fill="#F3F5F7"/>
  <path d="M380 500 Q600 360 820 500 Q600 650 380 500 Z" fill="#FFFFFF"/>
  ${garnish}
  <circle cx="565" cy="455" r="15" fill="#FFFFFF" opacity="0.8"/><circle cx="635" cy="470" r="11" fill="#FFFFFF" opacity="0.8"/>
  <text x="70" y="790" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#6B7280">Recipe-derived final illustration from title + ingredient context; not a licensed photo.</text>
</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return encodeWebp(png, target);
}

async function mirror(item) {
  const dir = path.join(MEDIA_ROOT, slug(item.title), 'stages');
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const plan = buildStagePlan(item);
  const media = [];
  for (const stagePlan of plan) {
    const target = path.join(dir, `${Number(stagePlan.stage.replace(/\D/g, '')) .toString().padStart(2, '0')}-${stagePlan.stage}.webp`);
    const action = extractAction(stagePlan.step);
    const query = `${item.title} ${action.name} ${clean(stagePlan.step).slice(0, 160)}`;
    let candidate = null;
    try {
      const candidates = await commonsSearch(query, { mode: 'process', action, limit: 10 });
      candidate = candidates.find((x) => !media.some((m) => m.sourceUrl === x.sourceUrl));
    } catch {}
    if (candidate) {
      try {
        const input = await fetchBytes(candidate.url);
        const converted = await encodeWebp(input, target);
        media.push({ position: media.length + 1, stage: stagePlan.stage, localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), target).split(path.sep).join('/'), ...converted, format: 'webp', provider: 'Wikimedia Commons semantic process search', sourceUrl: candidate.sourceUrl, license: candidate.license, attribution: candidate.attribution, caption: candidate.title, status: 'ready', evidence: 'commons-action-and-title-match', relevanceScore: candidate.score, query, step: stagePlan.step, stageSourceType: stagePlan.sourceType, basedOnSteps: stagePlan.basedOnSteps });
        continue;
      } catch {}
    }
    const converted = await generateProcessIllustration({ item, stage: stagePlan.stage, step: stagePlan.step, visualHint: stagePlan.visualHint, target });
    media.push({ position: media.length + 1, stage: stagePlan.stage, localPath: path.relative(ROOT, target).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), target).split(path.sep).join('/'), ...converted, format: 'webp', provider: 'MYPA deterministic recipe-step illustration', license: 'Generated', attribution: 'MYPA', status: 'ready', evidence: stagePlan.sourceType === 'explicit-step' ? 'recipe-procedure-step' : stagePlan.sourceType, query, step: stagePlan.step, stageSourceType: stagePlan.sourceType, basedOnSteps: stagePlan.basedOnSteps });
  }

  const finalTarget = path.join(dir, '04-final.webp');
  let finalSource = null;
  try {
    const candidates = await commonsSearch(`${item.title} finished dish`, { mode: 'final', action: { name: 'finish', terms: ['finished', 'served', 'plated', 'dish', 'meal'], icon: 'plate' }, limit: 12 });
    finalSource = candidates[0] ?? null;
  } catch {}
  if (!finalSource) {
    try {
      const candidates = await pageImages(item);
      finalSource = candidates[0] ?? null;
    } catch {}
  }
  if (finalSource) {
    try {
      const input = await fetchBytes(finalSource.url);
      const converted = await encodeWebp(input, finalTarget);
      media.push({ position: 4, stage: 'final', localPath: path.relative(ROOT, finalTarget).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), finalTarget).split(path.sep).join('/'), ...converted, format: 'webp', provider: 'Wikimedia Commons/Wikibooks licensed final image', sourceUrl: finalSource.sourceUrl, license: finalSource.license, attribution: finalSource.attribution, caption: finalSource.title, status: 'ready', evidence: finalSource.sourceUrl.includes('wikibooks') ? 'licensed-recipe-page-image' : 'commons-finished-dish-search' });
    } catch {}
  }
  if (!media.some((x) => x.stage === 'final' && x.status === 'ready')) {
    const converted = await generateFinalIllustration(item, finalTarget);
    media.push({ position: 4, stage: 'final', localPath: path.relative(ROOT, finalTarget).split(path.sep).join('/'), objectKey: path.relative(path.join(ROOT, 'media'), finalTarget).split(path.sep).join('/'), ...converted, format: 'webp', provider: 'MYPA deterministic recipe final illustration', license: 'Generated', attribution: 'MYPA', status: 'ready', evidence: 'recipe-title-ingredient-derived-final' });
  }
  const stageSourceTypes = media.filter((x) => x.stage.startsWith('process-')).map((x) => x.stageSourceType);
  return {
    media,
    mediaCount: media.length,
    stageStatus: media.length === REQUIRED_TOTAL && media.every((x) => x.status === 'ready' && x.format === 'webp' && x.sizeBytes > 0 && x.sizeBytes <= 64 * 1024) ? 'complete' : 'incomplete',
    stageRequirement: { processImages: REQUIRED_PROCESS, finalImage: 1, total: REQUIRED_TOTAL },
    processCoverage: { explicitStepStages: stageSourceTypes.filter((x) => x === 'explicit-step').length, derivedStages: stageSourceTypes.filter((x) => x !== 'explicit-step').length },
    mediaPolicy: 'Exactly 3 stage-aware process visuals plus 1 final visual. Licensed Wikimedia media is accepted only with source/license metadata and semantic matching; otherwise a deterministic recipe-derived illustration is used.'
  };
}

async function main() {
  const dataset = await json(DATASET_URL);
  if (!Array.isArray(dataset) || dataset.length === 0) throw new Error('Recipe dataset is invalid');
  const rows = (MAX_RECIPES ? dataset.slice(0, MAX_RECIPES) : dataset).map(parseRecipe).filter((x) => x.title && x.title !== 'Untitled Recipe');
  let manifest = { schemaVersion: 12, generatedAt: null, root: ROOT, requiredMediaPerItem: REQUIRED_TOTAL, items: {} };
  if (await exists(MANIFEST_PATH)) { try { manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')); } catch {} }
  let cursor = 0;
  let done = 0;
  const worker = async () => {
    while (cursor < rows.length) {
      const item = rows[cursor++];
      const key = `recipe:${slug(item.title)}`;
      try {
        const result = await mirror(item);
        manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, ingredients: item.ingredients.length, steps: item.steps.length, ...result, legacyImagesRemoved: true };
      } catch (error) {
        manifest.items[key] = { kind: 'recipe', name: item.title, slug: slug(item.title), sourceUrl: item.sourceUrl, stageStatus: 'failed', media: [], mediaCount: 0, legacyImagesRemoved: true, error: error instanceof Error ? error.message : String(error) };
      }
      done += 1;
      const current = manifest.items[key];
      await saveJson(MANIFEST_PATH, { ...manifest, schemaVersion: 12, generatedAt: new Date().toISOString() });
      console.log(`[recipe-guaranteed-v7] ${done}/${rows.length} '${item.title}' status=${current.stageStatus} process=${current.media.filter((x) => x.status === 'ready' && x.stage.startsWith('process-')).length}/3 final=${current.media.some((x) => x.status === 'ready' && x.stage === 'final') ? 1 : 0} generatedProcess=${current.media.filter((x) => x.stage.startsWith('process-') && x.license === 'Generated').length}`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  const recipes = Object.values(manifest.items).filter((x) => x.kind === 'recipe');
  const complete = recipes.filter((x) => x.stageStatus === 'complete').length;
  const generatedProcessImages = recipes.reduce((sum, x) => sum + x.media.filter((m) => m.stage.startsWith('process-') && m.license === 'Generated').length, 0);
  const licensedProcessImages = recipes.reduce((sum, x) => sum + x.media.filter((m) => m.stage.startsWith('process-') && m.license !== 'Generated').length, 0);
  const finalPhotos = recipes.filter((x) => x.media.some((m) => m.stage === 'final' && m.license !== 'Generated')).length;
  const report = {
    schemaVersion: 10,
    generatedAt: new Date().toISOString(),
    root: ROOT,
    required: { processImages: REQUIRED_PROCESS, finalImage: 1, total: REQUIRED_TOTAL, maxBytes: 64 * 1024, format: 'webp' },
    recipes: recipes.length,
    complete,
    incomplete: recipes.length - complete,
    processImages: { licensed: licensedProcessImages, generated: generatedProcessImages },
    licensedFinalPhotos: finalPhotos,
    mediaPolicy: 'Every recipe receives exactly 3 stage-aware process visuals and 1 final visual. Real Wikimedia media is used only with license/source metadata and semantic matching; otherwise the stage is generated deterministically from recipe content. Generated media is never represented as licensed evidence.'
  };
  await saveJson(SUMMARY_PATH, report);
  console.log(JSON.stringify(report, null, 2));
  if (recipes.length && complete < recipes.length) process.exitCode = 2;
}

main().catch((error) => { console.error(error); process.exit(1); });
