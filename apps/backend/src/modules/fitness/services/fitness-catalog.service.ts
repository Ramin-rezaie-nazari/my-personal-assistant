import { Injectable } from '@nestjs/common';
import { CalisthenicsLibraryService } from '../../calisthenics/services/calisthenics-library.service';
import { GymLibraryService } from '../../gym/services/gym-library.service';
import { YogaLibraryService } from '../../yoga/services/yoga-library.service';

export type FitnessDiscipline = 'gym' | 'calisthenics' | 'yoga';
export type FitnessCatalogItem = {
  id: string;
  discipline: FitnessDiscipline;
  name: string;
  difficultyLevel: number;
  sourceLevel: string;
  focus: string[];
  equipment: string[];
  instructions: string[];
  cues: string[];
  media: Array<{ position: number; sourceUrl: string; webpUrl: string; format: 'webp' | 'jpg' }>;
  mediaRequired: number;
  mediaActual: number;
  mediaComplete: boolean;
  source: { provider: string; datasetUrl: string; license: string; attribution?: string };
};

type ExternalExercise = {
  id: string;
  name: string;
  level?: string;
  equipment?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  category?: string;
  images?: string[];
};

const PUBLIC_DATASET_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const PUBLIC_IMAGE_ROOT =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises/';
const IMAGE_PROXY_ROOT = 'https://wsrv.nl/';
const CACHE_MS = 30 * 60 * 1000;

@Injectable()
export class FitnessCatalogService {
  private externalCache: { fetchedAt: number; items: ExternalExercise[] } | null = null;

  constructor(
    private readonly gym: GymLibraryService,
    private readonly calisthenics: CalisthenicsLibraryService,
    private readonly yoga: YogaLibraryService,
  ) {}

  async list(input: {
    discipline: FitnessDiscipline;
    level?: number;
    query?: string;
    page?: number;
    pageSize?: number;
    equipment?: string[];
  }) {
    const page = clampInt(input.page ?? 1, 1, 100000);
    const pageSize = clampInt(input.pageSize ?? 24, 1, 50);
    const level = clampInt(input.level ?? 1, 1, 10);
    const query = normalize(input.query ?? '');
    const equipment = new Set((input.equipment ?? []).map(normalize).filter(Boolean));

    const local = this.localItems(input.discipline);
    const external = input.discipline === 'yoga'
      ? []
      : (await this.externalItems())
          .filter((item) => this.matchesDiscipline(item, input.discipline))
          .map((item) => this.normalizeExternal(item, input.discipline));
    const merged = dedupeByName([...local, ...external])
      .filter((item) => item.difficultyLevel <= level)
      .filter((item) => !query || normalize(`${item.name} ${item.focus.join(' ')}`).includes(query))
      .filter((item) => !equipment.size || item.equipment.some((value) => equipment.has(normalize(value))))
      .sort((a, b) => a.difficultyLevel - b.difficultyLevel || a.name.localeCompare(b.name));

    const start = (page - 1) * pageSize;
    return {
      items: merged.slice(start, start + pageSize),
      total: merged.length,
      page,
      pageSize,
      hasNextPage: start + pageSize < merged.length,
      tenLevelScale: Array.from({ length: 10 }, (_, index) => ({ level: index + 1, label: levelLabel(index + 1) })),
      mediaPolicy: { requiredPerExercise: 4, format: 'webp', partialAssetsAreExplicit: true },
      sources: [
        { provider: 'MYPA curated library', license: 'internal' },
        { provider: 'Free Exercise DB', datasetUrl: PUBLIC_DATASET_URL, license: 'Unlicense', attribution: 'Yuhonas / Free Exercise DB' },
      ],
    };
  }

  async getOne(discipline: FitnessDiscipline, id: string) {
    const local = this.localItems(discipline).find((item) => item.id === id);
    if (local) return local;
    if (discipline === 'yoga') return null;
    const external = (await this.externalItems()).find((item) => `public-${item.id}` === id);
    return external ? this.normalizeExternal(external, discipline) : null;
  }

  private localItems(discipline: FitnessDiscipline): FitnessCatalogItem[] {
    if (discipline === 'gym') {
      return this.gym.list('expert', undefined, ['none', 'dumbbells', 'barbell', 'bench', 'cable_machine', 'machine']).map((item) => ({
        id: item.id,
        discipline,
        name: item.name,
        difficultyLevel: mapDifficulty(item.level, item.cues.length),
        sourceLevel: item.level,
        focus: item.focus,
        equipment: item.equipment,
        instructions: [],
        cues: item.cues,
        media: [],
        mediaRequired: 4,
        mediaActual: 0,
        mediaComplete: false,
        source: { provider: 'MYPA curated library', datasetUrl: '', license: 'internal' },
      }));
    }
    if (discipline === 'calisthenics') {
      return this.calisthenics.list(undefined, undefined, ['none', 'bench', 'pull_up_bar', 'wall', 'parallel_bars', 'rings']).map((item) => ({
        id: item.id,
        discipline,
        name: item.name,
        difficultyLevel: Math.max(1, Math.min(10, Math.round(item.difficulty))),
        sourceLevel: item.levels[item.levels.length - 1] ?? 'beginner',
        focus: item.focuses,
        equipment: item.equipment,
        instructions: [],
        cues: item.cues,
        media: [],
        mediaRequired: 4,
        mediaActual: 0,
        mediaComplete: false,
        source: { provider: 'MYPA curated library', datasetUrl: '', license: 'internal' },
      }));
    }
    return this.yoga.list(undefined, undefined).map((item) => ({
      id: item.id,
      discipline,
      name: item.name,
      difficultyLevel: Math.max(1, Math.min(10, Math.round(item.difficulty))),
      sourceLevel: item.levels[item.levels.length - 1] ?? 'beginner',
      focus: item.focuses,
      equipment: [],
      instructions: item.cues.map((cue) => cue.text),
      cues: item.cues.map((cue) => cue.text),
      media: [],
      mediaRequired: 4,
      mediaActual: 0,
      mediaComplete: false,
      source: { provider: 'MYPA curated library', datasetUrl: '', license: 'internal' },
    }));
  }

  private async externalItems(): Promise<ExternalExercise[]> {
    if (this.externalCache && Date.now() - this.externalCache.fetchedAt < CACHE_MS) return this.externalCache.items;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    try {
      const response = await fetch(PUBLIC_DATASET_URL, { signal: controller.signal });
      if (!response.ok) throw new Error(`exercise catalog fetch failed: ${response.status}`);
      const payload = (await response.json()) as ExternalExercise[];
      this.externalCache = { fetchedAt: Date.now(), items: Array.isArray(payload) ? payload : [] };
    } catch {
      this.externalCache = { fetchedAt: Date.now(), items: [] };
    } finally {
      clearTimeout(timeout);
    }
    return this.externalCache.items;
  }

  private matchesDiscipline(item: ExternalExercise, discipline: FitnessDiscipline) {
    const equipment = normalize(item.equipment ?? 'body only');
    const bodyweight = !equipment || equipment === 'body only' || equipment === 'none';
    const category = normalize(item.category ?? '');
    if (discipline === 'calisthenics') return bodyweight && category !== 'stretching';
    return !bodyweight || category === 'strength' || category === 'cardio';
  }

  private normalizeExternal(item: ExternalExercise, discipline: FitnessDiscipline): FitnessCatalogItem {
    const sourceImages = (item.images ?? []).slice(0, 4).map((path) => `${PUBLIC_IMAGE_ROOT}${path}`);
    const media = sourceImages.map((sourceUrl, index) => ({
      position: index + 1,
      sourceUrl,
      webpUrl: `${IMAGE_PROXY_ROOT}?url=${encodeURIComponent(sourceUrl)}&output=webp&w=768&q=82`,
      format: 'jpg' as const,
    }));
    return {
      id: `public-${item.id}`,
      discipline,
      name: item.name,
      difficultyLevel: mapDifficulty(item.level ?? 'intermediate', (item.primaryMuscles ?? []).length + (item.secondaryMuscles ?? []).length),
      sourceLevel: item.level ?? 'intermediate',
      focus: [...(item.primaryMuscles ?? []), ...(item.secondaryMuscles ?? [])].slice(0, 8),
      equipment: item.equipment ? [item.equipment] : ['none'],
      instructions: item.instructions ?? [],
      cues: (item.instructions ?? []).slice(0, 3),
      media,
      mediaRequired: 4,
      mediaActual: media.length,
      mediaComplete: media.length >= 4,
      source: {
        provider: 'Free Exercise DB',
        datasetUrl: PUBLIC_DATASET_URL,
        license: 'Unlicense',
        attribution: 'Yuhonas / Free Exercise DB',
      },
    };
  }
}

function dedupeByName(items: FitnessCatalogItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalize(item.name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapDifficulty(level: string, richness: number) {
  const base = normalize(level) === 'beginner' ? 2 : normalize(level) === 'intermediate' ? 5 : normalize(level) === 'advanced' ? 8 : 6;
  return Math.max(1, Math.min(10, base + (richness >= 5 ? 1 : 0)));
}

function levelLabel(level: number) {
  if (level <= 2) return 'Beginner';
  if (level <= 4) return 'Foundation';
  if (level <= 6) return 'Intermediate';
  if (level <= 8) return 'Advanced';
  return level === 9 ? 'Expert' : 'Elite';
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? Math.round(value) : min));
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}
