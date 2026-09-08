import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import sharp from 'sharp';

const ROOT = path.resolve(process.env.RECIPE_BROWSER_LOCAL_ROOT || './data/mypa-recipe-media-local');
const CATALOG = path.resolve(process.env.RECIPE_BROWSER_LOCAL_CATALOG || './data/mypa-recipe-media/recipe-catalog.jsonl');
const IMAGE_ROOT = path.join(ROOT, 'images', 'recipes');
const MANIFEST = path.join(ROOT, 'manifest', 'recipe-heroes-browser.jsonl');
const FAILURE = path.join(ROOT, 'manifest', 'browser-image-failures.jsonl');
const TARGET_BYTES = 150000;
const MIN_SIDE = 240;
const LIMIT = Math.max(Number(process.env.RECIPE_BROWSER_LOCAL_LIMIT || '0'), 0);
const DELAY_MS = Math.max(Number(process.env.RECIPE_BROWSER_LOCAL_DELAY_MS || '3000'), 0);
const SEARCH_WAIT_MS = Math.max(Number(process.env.RECIPE_BROWSER_LOCAL_SEARCH_WAIT_MS || '2200'), 1500);
const PREVIEW_WAIT_MS = Math.max(Number(process.env.RECIPE_BROWSER_LOCAL_PREVIEW_WAIT_MS || '1400'), 700);
const CHROME_PATH = process.env.RECIPE_BROWSER_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEBUG_PORT = Math.max(Number(process.env.RECIPE_BROWSER_DEBUG_PORT || '9228'), 1024);
const PROFILE_DIR = path.resolve(process.env.RECIPE_BROWSER_PROFILE_DIR || './data/mypa-recipe-media-local/.chrome-profile-v2');
const HEADLESS = process.env.RECIPE_BROWSER_HEADLESS === '1';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => { try { fsSync.accessSync(p); return true; } catch { return false; } };
async function append(file, row) { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.appendFile(file, JSON.stringify(row) + '\n'); }
async function loadCatalog() {
  if (!exists(CATALOG)) throw new Error(`Catalog not found: ${CATALOG}`);
  return (await fs.readFile(CATALOG, 'utf8')).split(/\r?\n/).filter(Boolean).map(JSON.parse)
    .map((r) => ({ recipeId: String(r.recipeId || r.id || ''), name: String(r.name || r.recipeName || '') }))
    .filter((r) => r.recipeId && r.name);
}
async function hasHero(id) { const d = path.join(IMAGE_ROOT, id); return exists(path.join(d, 'hero.webp')) || exists(path.join(d, '01.webp')); }
async function waitForHttp(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {} await sleep(250); }
  throw new Error(`Chrome DevTools endpoint unavailable: ${url}`);
}
class CDP {
  constructor(wsUrl) { this.wsUrl = wsUrl; this.ws = null; this.seq = 0; this.pending = new Map(); }
  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    this.ws.onmessage = (e) => { try { const msg = JSON.parse(e.data); if (msg.id && this.pending.has(msg.id)) { const p = this.pending.get(msg.id); this.pending.delete(msg.id); msg.error ? p.reject(new Error(msg.error.message || 'CDP error')) : p.resolve(msg.result); } } catch {} };
    await new Promise((resolve, reject) => { const t = setTimeout(() => reject(new Error('CDP connection timeout')), 10000); this.ws.onopen = () => { clearTimeout(t); resolve(); }; this.ws.onerror = () => { clearTimeout(t); reject(new Error('CDP websocket error')); }; });
  }
  async send(method, params = {}) { const id = ++this.seq; this.ws.send(JSON.stringify({ id, method, params })); return await new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); } }, 30000); }); }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'browser eval failed'); return r.result?.value; }
  close() { try { this.ws?.close(); } catch {} }
}
function launchChrome() {
  if (!exists(CHROME_PATH)) throw new Error(`Google Chrome not found at ${CHROME_PATH}`);
  fsSync.mkdirSync(PROFILE_DIR, { recursive: true });
  const args = [`--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${PROFILE_DIR}`, '--no-first-run', '--no-default-browser-check', '--disable-popup-blocking', '--window-size=1400,1000'];
  if (HEADLESS) args.push('--headless=new');
  return spawn(CHROME_PATH, args, { detached: false, stdio: 'ignore' });
}
async function getFirstTab() {
  const tabs = await waitForHttp(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
  const tab = tabs.find((x) => x.type === 'page');
  if (!tab?.webSocketDebuggerUrl) throw new Error('No Chrome page target available');
  return tab;
}
function goodImage(src) { return src && /^https?:/i.test(src) && !/google.*logo|favicon|sprite|icon|gstatic\.com.*branding/i.test(src); }

async function browserFindFirstImage(cdp, query) {
  const searchUrl = `https://www.google.com/search?tbm=isch&hl=en&gl=us&q=${encodeURIComponent(query)}`;
  await cdp.send('Page.navigate', { url: searchUrl });
  await sleep(SEARCH_WAIT_MS);

  const before = await cdp.eval(`(() => {
    const imgs = [...document.images].filter(i => i.complete && i.naturalWidth >= 120 && i.naturalHeight >= 120 && /^https?:/i.test(i.currentSrc || i.src));
    return { title: document.title, count: imgs.length, imgs: imgs.slice(0,30).map((i,n)=>({n,src:i.currentSrc||i.src,w:i.naturalWidth,h:i.naturalHeight,r:i.getBoundingClientRect().toJSON()})) };
  })()`);
  if (!before?.imgs?.length) throw new Error(`Google browser returned no image candidate (${before?.title || 'no title'})`);

  const first = before.imgs.find((x) => x.r.width >= 80 && x.r.height >= 80) || before.imgs[0];
  const clicked = await cdp.eval(`(() => {
    const imgs = [...document.images].filter(i => i.complete && i.naturalWidth >= 120 && i.naturalHeight >= 120 && i.getBoundingClientRect().width >= 80 && i.getBoundingClientRect().height >= 80);
    const el = imgs[${first.n}];
    if (!el) return false;
    el.scrollIntoView({block:'center', inline:'center'});
    el.click();
    return true;
  })()`);
  if (!clicked) throw new Error('Could not click first Google Images result');
  await sleep(PREVIEW_WAIT_MS);

  const after = await cdp.eval(`(() => {
    const imgs = [...document.images].filter(i => i.complete && i.naturalWidth >= 240 && i.naturalHeight >= 180 && i.getBoundingClientRect().width >= 180 && i.getBoundingClientRect().height >= 140);
    return imgs.map((i,n)=>({n,src:i.currentSrc||i.src,w:i.naturalWidth,h:i.naturalHeight,area:i.naturalWidth*i.naturalHeight,r:i.getBoundingClientRect().toJSON()})).sort((a,b)=>b.area-a.area).slice(0,20);
  })()`);
  const candidates = (after || []).filter((x) => goodImage(x.src) && x.r.width > 150 && x.r.height > 120);
  const best = candidates[0];
  if (!best) throw new Error('Google preview did not expose a sufficiently large image');

  const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, clip: { x: Math.max(0, best.r.x), y: Math.max(0, best.r.y), width: Math.max(1, best.r.width), height: Math.max(1, best.r.height), scale: 1 } });
  return { provider:'google-browser-first-result-preview', query, searchUrl, imageSrc:best.src, width:best.w, height:best.h, png:Buffer.from(shot.data,'base64') };
}

async function prepareImage(png) {
  const input = sharp(png, { failOn:'none' }).rotate();
  const meta = await input.metadata();
  if (!meta.width || !meta.height || Math.min(meta.width, meta.height) < MIN_SIDE) throw new Error(`captured image too small (${meta.width}x${meta.height})`);
  let best = null;
  for (const width of [1600,1400,1280,1200,1080,960,840,720,640,560,480,400,320,240]) {
    for (const quality of [92,86,80,74,68,62,56,50,44,38,32,26,20]) {
      const out = await input.clone().resize({width,fit:'inside',withoutEnlargement:true}).webp({quality,effort:5}).toBuffer();
      const m = await sharp(out).metadata();
      if (Math.min(Number(m.width||0),Number(m.height||0)) < MIN_SIDE) continue;
      if (out.byteLength <= TARGET_BYTES && (!best || out.byteLength > best.bytes)) best={out,width:Number(m.width),height:Number(m.height),bytes:out.byteLength,quality};
    }
  }
  if (!best) throw new Error('unable to encode captured image below 150KB');
  return best;
}
async function save(recipe,found,prepared) {
  const dir=path.join(IMAGE_ROOT,recipe.recipeId); await fs.mkdir(dir,{recursive:true});
  const file=path.join(dir,'hero.webp'); await fs.writeFile(file,prepared.out);
  await append(MANIFEST,{recipeId:recipe.recipeId,recipeName:recipe.name,imageType:'hero',file:path.relative(ROOT,file),source:found.provider,sourceImageUrl:found.imageSrc,query:found.query,searchUrl:found.searchUrl,resultPosition:1,verified:false,confidence:'browser-first-preview-unverified',width:prepared.width,height:prepared.height,bytes:prepared.bytes,quality:prepared.quality,sha256:crypto.createHash('sha256').update(prepared.out).digest('hex'),downloadedAt:new Date().toISOString()});
}
async function main(){
  const catalog=await loadCatalog(); const pending=[]; for(const r of catalog) if(!(await hasHero(r.recipeId))) pending.push(r); const selected=LIMIT?pending.slice(0,LIMIT):pending;
  console.log(JSON.stringify({engine:'local-browser-google-first-v2',policy:'Google Images first result via real Chrome preview; local hero only',localOnly:true,totalCatalog:catalog.length,selected:selected.length,skipped:catalog.length-pending.length,targetBytes:TARGET_BYTES,delayMs:DELAY_MS},null,2));
  const chrome=launchChrome(); try{const tab=await getFirstTab();const cdp=new CDP(tab.webSocketDebuggerUrl);await cdp.connect();await cdp.send('Page.enable');await cdp.send('Runtime.enable');let complete=0,failed=0;
    for(const recipe of selected){try{const found=await browserFindFirstImage(cdp,`${recipe.name} recipe`);const prepared=await prepareImage(found.png);await save(recipe,found,prepared);complete++;console.log(`[COMPLETE ${complete}] ${recipe.name} -> 1 hero [Google browser preview] ${prepared.bytes} bytes ${prepared.width}x${prepared.height}`);}catch(e){failed++;const reason=e instanceof Error?e.message:String(e);await append(FAILURE,{recipeId:recipe.recipeId,recipeName:recipe.name,status:'pending-retry',reason,updatedAt:new Date().toISOString()});console.error(`[PENDING ${failed}] ${recipe.name}: ${reason}`);}if(DELAY_MS)await sleep(DELAY_MS);}
    console.log(JSON.stringify({status:selected.length===complete?'complete':'partial',totalCatalog:catalog.length,selected:selected.length,complete,failed,skipped:catalog.length-pending.length,missingAfterRun:selected.length-complete},null,2)); cdp.close();
  } finally {try{chrome.kill();}catch{}}
}
main().catch(e=>{console.error(e);process.exit(1);});
