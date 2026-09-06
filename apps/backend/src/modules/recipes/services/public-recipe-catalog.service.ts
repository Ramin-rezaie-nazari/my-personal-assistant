import { Injectable } from '@nestjs/common';

const DATASET_URL =
  'https://huggingface.co/datasets/gossminn/wikibooks-cookbook/resolve/main/recipes_parsed.json?download=true';
const WIKIBOOKS_API = 'https://en.wikibooks.org/w/api.php';
const CACHE_MS = 30 * 60 * 1000;
const MAX_MEDIA = 4;
const MIN_STEP_CHARS = 20;

type DatasetRow = {
  filename?: string;
  recipe_data?: {
    title?: string;
    url?: string;
    infobox?: { servings?: string | number | null; category?: string | null; difficulty?: string | number | null };
    text_lines?: Array<{ line_type?: string; section?: string | null; text?: string | null }>;
  };
};

type PublicRecipe = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  imageSource: string | null;
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  verified: boolean;
  sourceUrl: string;
  category: string | null;
  ingredients: Array<{ id: string; foodId: string; name: string; quantity: number; unit: string; measurementKind: string; imageUrl: string | null }>;
  steps: Array<{ id: string; stepNumber: number; instruction: string; durationSeconds: number | null; temperatureC: number | null; imageUrl: string | null; imageSource: string | null; sourceLicense: string; sourceAttribution: string }>;
  media: Array<{ id: string; position: number; url: string; sourceUrl: string; sourceProvider: string; license: string; attribution: string; mimeType: string; width: number | null; height: number | null }>;
};

@Injectable()
export class PublicRecipeCatalogService {
  private cache: { fetchedAt: number; rows: DatasetRow[] } | null = null;
  private mediaCache = new Map<string, PublicRecipe['media']>();

  async list(input: { page: number; pageSize: number; q?: string }) {
    const rows = await this.dataset();
    const q = normalize(input.q ?? '');
    const mapped = rows
      .map((row) => this.parse(row))
      .filter((recipe) => !q || normalize(`${recipe.name} ${recipe.description ?? ''} ${recipe.category ?? ''}`).includes(q));
    const start = (input.page - 1) * input.pageSize;
    const page = mapped.slice(start, start + input.pageSize);
    return {
      items: page.map((recipe) => ({
        id: recipe.id,
        name: recipe.name,
        description: recipe.description,
        imageUrl: recipe.imageUrl,
        imageSource: recipe.imageSource,
        servings: recipe.servings,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        verified: recipe.verified,
        userId: null,
        publicSource: 'Wikibooks Cookbook',
      })),
      total: mapped.length,
      page: input.page,
      pageSize: input.pageSize,
      hasNextPage: start + input.pageSize < mapped.length,
    };
  }

  async get(id: string): Promise<PublicRecipe | null> {
    const rows = await this.dataset();
    const recipe = rows.map((row) => this.parse(row)).find((item) => item.id === id);
    if (!recipe) return null;
    const media = await this.fetchMedia(recipe.sourceUrl);
    return {
      ...recipe,
      imageUrl: media[0]?.url ?? recipe.imageUrl,
      imageSource: media[0] ? `${media[0].sourceProvider}; ${media[0].license}` : recipe.imageSource,
      media,
    };
  }

  private async dataset() {
    if (this.cache && Date.now() - this.cache.fetchedAt < CACHE_MS) return this.cache.rows;
    const response = await fetch(DATASET_URL, { headers: { 'User-Agent': 'MYPA-PublicRecipeCatalog/1.0' } });
    if (!response.ok) throw new Error(`public recipe dataset fetch failed: ${response.status}`);
    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload) || payload.length === 0) throw new Error('public recipe dataset is empty');
    this.cache = { fetchedAt: Date.now(), rows: payload as DatasetRow[] };
    return this.cache.rows;
  }

  private parse(row: DatasetRow) {
    const data = row.recipe_data ?? {};
    const lines = Array.isArray(data.text_lines) ? data.text_lines : [];
    const name = clean(data.title || row.filename?.split('/').pop()?.replace(/\.html$/i, '') || 'Untitled Recipe');
    const ingredients = lines
      .filter((line) => line?.line_type === 'ul' && /ingredient/i.test(line.section ?? ''))
      .map((line, index) => parseIngredient(line.text ?? '', index, name));
    const steps = lines
      .filter((line) => line?.line_type === 'ol' && /procedure|direction|method|instruction|preparation/i.test(line.section ?? ''))
      .map((line) => clean(line.text ?? ''))
      .filter((step) => step.length >= MIN_STEP_CHARS)
      .map((instruction, index) => ({
        id: `${slug(name)}-step-${index + 1}`,
        stepNumber: index + 1,
        instruction,
        durationSeconds: null,
        temperatureC: null,
        imageUrl: null,
        imageSource: null,
        sourceLicense: 'CC BY-SA 4.0',
        sourceAttribution: `Wikibooks Cookbook; ${sourceUrl(name, data.url)}`,
      }));
    return {
      id: `public-recipe-${slug(name)}`,
      name,
      description: lines.filter((line) => line?.line_type === 'p').map((line) => clean(line.text ?? '')).find(Boolean) ?? null,
      imageUrl: null,
      imageSource: 'Wikibooks Cookbook; CC BY-SA 4.0',
      servings: parseServings(data.infobox?.servings),
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      verified: true,
      sourceUrl: sourceUrl(name, data.url),
      category: clean(data.infobox?.category ?? '') || null,
      ingredients,
      steps,
      media: [],
    };
  }

  private async fetchMedia(sourceUrl: string) {
    const cached = this.mediaCache.get(sourceUrl);
    if (cached) return cached;
    const title = decodeURIComponent(sourceUrl.split('/wiki/')[1] || '').replace(/_/g, ' ');
    if (!title) return [];
    const params = new URLSearchParams({ action: 'query', titles: title, prop: 'images', imlimit: '12', format: 'json', formatversion: '2' });
    const response = await fetch(`${WIKIBOOKS_API}?${params.toString()}`, { headers: { 'User-Agent': 'MYPA-PublicRecipeCatalog/1.0' } });
    if (!response.ok) return [];
    const data = (await response.json()) as any;
    const images = data?.query?.pages?.[0]?.images ?? [];
    const media: PublicRecipe['media'] = [];
    for (const image of images) {
      const fileTitle = image?.title ?? '';
      if (!/^File:/i.test(fileTitle) || /\.svg$|\.gif$|\.ico$/i.test(fileTitle)) continue;
      const detailParams = new URLSearchParams({ action: 'query', titles: fileTitle, prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '1200', format: 'json', formatversion: '2' });
      const detail = await fetch(`${WIKIBOOKS_API}?${detailParams.toString()}`, { headers: { 'User-Agent': 'MYPA-PublicRecipeCatalog/1.0' } }).catch(() => null);
      if (!detail?.ok) continue;
      const payload = (await detail.json()) as any;
      const info = payload?.query?.pages?.[0]?.imageinfo?.[0];
      if (!info?.url && !info?.thumburl) continue;
      const license = allowedImageLicense(info.extmetadata ?? {});
      if (!license) continue;
      const url = info.thumburl || info.url;
      media.push({
        id: `${slug(title)}-${media.length + 1}`,
        position: media.length,
        url,
        sourceUrl: info.descriptionurl || info.url,
        sourceProvider: 'Wikimedia Commons/Wikibooks',
        license,
        attribution: `${clean(info.extmetadata?.Artist?.value || info.extmetadata?.Credit?.value || 'Wikimedia contributor')}; ${license}`,
        mimeType: /^image\/webp$/i.test(info.mime ?? '') ? 'image/webp' : /^image\/png$/i.test(info.mime ?? '') ? 'image/png' : 'image/jpeg',
        width: null,
        height: null,
      });
      if (media.length >= MAX_MEDIA) break;
    }
    this.mediaCache.set(sourceUrl, media);
    return media;
  }
}

function parseIngredient(raw: string, index: number, recipeName: string) {
  const text = clean(raw).replace(/[•●]+/g, '').trim();
  const match = text.match(/^\s*((?:\d+(?:\.\d+)?\s*)?[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]|\d+(?:\.\d+)?(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(.*)$/u);
  if (!match) return { id: `${slug(recipeName)}-ingredient-${index + 1}`, foodId: `public-food-${slug(text)}`, name: text, quantity: 1, unit: 'as listed', measurementKind: 'text', imageUrl: null };
  const quantity = parseNumber(match[1]) ?? 1;
  const rest = match[2].trim();
  const unit = rest.match(/^(kg|g|mg|lb|lbs|oz|ml|l|liter|litre|liters|litres|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|clove|cloves|piece|pieces|can|cans|package|packages|slice|slices|pinch|pinches)\b[.]?\s+(.*)$/i);
  const ingredientName = unit?.[2]?.trim() || rest || text;
  return {
    id: `${slug(recipeName)}-ingredient-${index + 1}`,
    foodId: `public-food-${slug(ingredientName)}`,
    name: ingredientName,
    quantity: quantity > 0 ? quantity : 1,
    unit: unit?.[1]?.toLowerCase() || 'item',
    measurementKind: unit ? 'quantity' : 'count',
    imageUrl: null,
  };
}

function allowedImageLicense(meta: Record<string, any>) {
  const short = clean(meta.LicenseShortName?.value || meta.LicenseShortName || '');
  const terms = clean(meta.UsageTerms?.value || meta.UsageTerms || '');
  const combined = `${short} ${terms}`;
  if (/non[- ]?commercial|\bNC\b|no derivatives|\bND\b/i.test(combined)) return null;
  if (/CC0|public domain|public-domain|PDM/i.test(combined)) return 'CC0/Public Domain';
  if (/CC BY-SA/i.test(combined)) return 'CC BY-SA';
  if (/CC BY/i.test(combined)) return 'CC BY';
  return null;
}

function parseServings(value: string | number | null | undefined) {
  const match = String(value ?? '').match(/\d+(?:\.\d+)?/);
  return match ? Math.max(1, Math.min(100, Math.round(Number(match[0])))) : 2;
}

function parseNumber(value: string) {
  const unicode: Record<string, number> = { '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3, '¼': 0.25, '¾': 0.75, '⅕': 0.2, '⅖': 0.4, '⅗': 0.6, '⅘': 0.8, '⅙': 1 / 6, '⅚': 5 / 6, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };
  let total = 0;
  let matched = false;
  for (const token of value.matchAll(/\d+(?:\.\d+)?|[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞]/g)) {
    matched = true;
    total += token[0] in unicode ? unicode[token[0]] : Number(token[0]);
  }
  return matched && Number.isFinite(total) ? total : null;
}

function sourceUrl(name: string, explicit?: string) {
  return explicit || `https://en.wikibooks.org/wiki/Cookbook:${encodeURIComponent(name.replace(/ /g, '_'))}`;
}

function slug(value: string) {
  return normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'recipe';
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function clean(value: unknown) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, ' ').trim();
}
