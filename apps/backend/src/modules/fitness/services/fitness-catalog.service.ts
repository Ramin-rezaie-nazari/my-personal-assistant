import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/database/prisma.service';
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
  media: Array<{ position: number; sourceUrl: string; webpUrl: string; format: 'webp' }>;
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

type PersistedRow = {
  id: string;
  discipline: string;
  name: string;
  difficultyLevel: number;
  sourceLevel: string | null;
  focus: string[];
  equipment: string[];
  instructions: string[];
  cues: string[];
  sourceProvider: string;
  sourceUrl: string | null;
  license: string;
  attribution: string | null;
  media: Array<{
    position: number;
    sourceUrl: string;
    webpUrl: string;
    format: string;
  }> | null;
  totalCount: number;
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
    private readonly prisma: PrismaService,
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

    const persisted = await this.listPersisted({ ...input, page, pageSize, level, query, equipment }).catch(() => null);
    if (persisted) return persisted;

    return this.listFallback({ discipline: input.discipline, level, query, page, pageSize, equipment });
  }

  async getOne(discipline: FitnessDiscipline, id: string) {
    const persisted = await this.getPersistedOne(discipline, id).catch(() => null);
    if (persisted) return persisted;

    const local = this.localItems(discipline).find((item) => item.id === id);
    if (local) return local;
    if (discipline === 'yoga') return null;
    const external = (await this.externalItems()).find((item) => `public-${item.id}` === id);
    return external ? this.normalizeExternal(external, discipline) : null;
  }

  private async listPersisted(input: {
    discipline: FitnessDiscipline;
    level: number;
    query: string;
    page: number;
    pageSize: number;
    equipment: Set<string>;
  }) {
    const start = (input.page - 1) * input.pageSize;
    const q = input.query ? `%${input.query.replace(/[%_]/g, (value) => `\\${value}`)}%` : null;
    const rows = q
      ? await this.prisma.$queryRaw<PersistedRow[]>(Prisma.sql`
          SELECT
            c."id", c."discipline", c."name", c."difficultyLevel", c."sourceLevel",
            c."focus", c."equipment", c."instructions", c."cues",
            c."sourceProvider", c."sourceUrl", c."license", c."attribution",
            COALESCE(
              json_agg(
                json_build_object(
                  'position', m."position",
                  'sourceUrl', m."sourceUrl",
                  'webpUrl', m."webpUrl",
                  'format', m."format"
                ) ORDER BY m."position"
              ) FILTER (WHERE m."id" IS NOT NULL),
              '[]'::json
            ) AS "media",
            COUNT(*) OVER()::int AS "totalCount"
          FROM "FitnessExerciseCatalog" c
          LEFT JOIN "FitnessExerciseMedia" m
            ON m."exerciseId" = c."id"
           AND m."status" = 'approved'
           AND m."format" = 'webp'
          WHERE c."discipline" = ${input.discipline}
            AND c."difficultyLevel" <= ${input.level}
            AND c."status" = 'published'
            AND (
              c."name" ILIKE ${q}
              OR array_to_string(c."focus", ' ') ILIKE ${q}
              OR array_to_string(c."equipment", ' ') ILIKE ${q}
            )
          GROUP BY c."id"
          ORDER BY c."difficultyLevel" ASC, c."name" ASC
          LIMIT ${input.pageSize} OFFSET ${start}
        `)
      : await this.prisma.$queryRaw<PersistedRow[]>(Prisma.sql`
          SELECT
            c."id", c."discipline", c."name", c."difficultyLevel", c."sourceLevel",
            c."focus", c."equipment", c."instructions", c."cues",
            c."sourceProvider", c."sourceUrl", c."license", c."attribution",
            COALESCE(
              json_agg(
                json_build_object(
                  'position', m."position",
                  'sourceUrl', m."sourceUrl",
                  'webpUrl', m."webpUrl",
                  'format', m."format"
                ) ORDER BY m."position"
              ) FILTER (WHERE m."id" IS NOT NULL),
              '[]'::json
            ) AS "media",
            COUNT(*) OVER()::int AS "totalCount"
          FROM "FitnessExerciseCatalog" c
          LEFT JOIN "FitnessExerciseMedia" m
            ON m."exerciseId" = c."id"
           AND m."status" = 'approved'
           AND m."format" = 'webp'
          WHERE c."discipline" = ${input.discipline}
            AND c."difficultyLevel" <= ${input.level}
            AND c."status" = 'published'
          GROUP BY c."id"
          ORDER BY c."difficultyLevel" ASC, c."name" ASC
          LIMIT ${input.pageSize} OFFSET ${start}
        `);

    if (!rows.length && start > 0) {
      const total = await this.persistedCount(input);
      if (total === 0) return null;
    }
    if (!rows.length) {
      const exists = await this.persistedCount(input);
      if (exists === 0) return null;
    }

    if (input.equipment.size) {
      const filtered = rows.filter((row) => row.equipment.some((item) => input.equipment.has(normalize(item))));
      return this.response(filtered, filtered.length ? Number(rows[0]?.totalCount ?? filtered.length) : 0, input.page, input.pageSize);
    }

    return this.response(rows, Number(rows[0]?.totalCount ?? 0), input.page, input.pageSize);
  }

  private async persistedCount(input: {
    discipline: FitnessDiscipline;
    level: number;
    query: string;
    equipment: Set<string>;
  }) {
    const q = input.query ? `%${input.query.replace(/[%_]/g, (value) => `\\${value}`)}%` : null;
    const rows = q
      ? await this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
          SELECT COUNT(*)::int AS count
          FROM "FitnessExerciseCatalog" c
          WHERE c."discipline" = ${input.discipline}
            AND c."difficultyLevel" <= ${input.level}
            AND c."status" = 'published'
            AND (c."name" ILIKE ${q} OR array_to_string(c."focus", ' ') ILIKE ${q})
        `)
      : await this.prisma.$queryRaw<Array<{ count: number }>>(Prisma.sql`
          SELECT COUNT(*)::int AS count
          FROM "FitnessExerciseCatalog" c
          WHERE c."discipline" = ${input.discipline}
            AND c."difficultyLevel" <= ${input.level}
            AND c."status" = 'published'
        `);
    return Number(rows[0]?.count ?? 0);
  }

  private async getPersistedOne(discipline: FitnessDiscipline, id: string) {
    const rows = await this.prisma.$queryRaw<PersistedRow[]>(Prisma.sql`
      SELECT
        c."id", c."discipline", c."name", c."difficultyLevel", c."sourceLevel",
        c."focus", c."equipment", c."instructions", c."cues",
        c."sourceProvider", c."sourceUrl", c."license", c."attribution",
        COALESCE(
          json_agg(
            json_build_object(
              'position', m."position",
              'sourceUrl', m."sourceUrl",
              'webpUrl', m."webpUrl",
              'format', m."format"
            ) ORDER BY m."position"
          ) FILTER (WHERE m."id" IS NOT NULL),
          '[]'::json
        ) AS "media",
        1 AS "totalCount"
      FROM "FitnessExerciseCatalog" c
      LEFT JOIN "FitnessExerciseMedia" m
        ON m."exerciseId" = c."id"
       AND m."status" = 'approved'
       AND m."format" = 'webp'
      WHERE c."discipline" = ${discipline}
        AND c."status" = 'published'
        AND (c."id" = ${id} OR c."slug" = ${id})
      GROUP BY c."id"
      LIMIT 1
    `);
    const row = rows[0];
    return row ? this.toItem(row) : null;
  }

  private response(rows: PersistedRow[], total: number, page: number, pageSize: number) {
    return {
      items: rows.map((row) => this.toItem(row)),
      total,
      page,
      pageSize,
      hasNextPage: page * pageSize < total,
      tenLevelScale: Array.from({ length: 10 }, (_, index) => ({ level: index + 1, label: levelLabel(index + 1) })),
      mediaPolicy: { requiredPerExercise: 4, format: 'webp' as const, partialAssetsAreExplicit: true },
      persistence: { mode: 'database', releaseGate: '500 published movements + 4 approved WebP assets per movement' },
    };
  }

  private toItem(row: PersistedRow): FitnessCatalogItem {
    const media = Array.isArray(row.media)
      ? row.media
          .filter((entry) => entry && entry.format === 'webp')
          .map((entry) => ({
            position: Number(entry.position),
            sourceUrl: String(entry.sourceUrl),
            webpUrl: String(entry.webpUrl),
            format: 'webp' as const,
          }))
      : [];
    return {
      id: row.id,
      discipline: row.discipline as FitnessDiscipline,
      name: row.name,
      difficultyLevel: row.difficultyLevel,
      sourceLevel: row.sourceLevel ?? 'intermediate',
      focus: row.focus ?? [],
      equipment: row.equipment ?? [],
      instructions: row.instructions ?? [],
      cues: row.cues ?? [],
      media,
      mediaRequired: 4,
      mediaActual: media.length,
      mediaComplete: media.length >= 4,
      source: {
        provider: row.sourceProvider,
        datasetUrl: row.sourceUrl ?? '',
        license: row.license,
        attribution: row.attribution ?? undefined,
      },
    };
  }

  private listFallback(input: {
    discipline: FitnessDiscipline;
    level: number;
    query: string;
    page: number;
    pageSize: number;
    equipment: Set<string>;
  }) {
    const local = this.localItems(input.discipline);
    return this.externalItems().then((external) => {
      const normalizedExternal = input.discipline === 'yoga'
        ? []
        : external
            .filter((item) => this.matchesDiscipline(item, input.discipline))
            .map((item) => this.normalizeExternal(item, input.discipline));
      const merged = dedupeByName([...local, ...normalizedExternal])
        .filter((item) => item.difficultyLevel <= input.level)
        .filter((item) => !input.query || normalize(`${item.name} ${item.focus.join(' ')}`).includes(input.query))
        .filter((item) => !input.equipment.size || item.equipment.some((value) => input.equipment.has(normalize(value))))
        .sort((a, b) => a.difficultyLevel - b.difficultyLevel || a.name.localeCompare(b.name));
      const start = (input.page - 1) * input.pageSize;
      const items = merged.slice(start, start + input.pageSize);
      return {
        items,
        total: merged.length,
        page: input.page,
        pageSize: input.pageSize,
        hasNextPage: start + input.pageSize < merged.length,
        tenLevelScale: Array.from({ length: 10 }, (_, index) => ({ level: index + 1, label: levelLabel(index + 1) })),
        mediaPolicy: { requiredPerExercise: 4, format: 'webp' as const, partialAssetsAreExplicit: true },
        persistence: { mode: 'fallback', releaseGate: '500 published movements + 4 approved WebP assets per movement' },
      };
    });
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
        instructions: item.cues,
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
        instructions: item.cues,
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
      format: 'webp' as const,
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
  const normalized = normalize(level);
  const base = normalized === 'beginner'
    ? 1
    : normalized === 'foundation'
      ? 3
      : normalized === 'intermediate'
        ? 5
        : normalized === 'advanced'
          ? 7
          : normalized === 'expert'
            ? 9
            : normalized === 'elite'
              ? 10
              : 5;
  return Math.max(1, Math.min(10, base + (richness >= 5 && base < 10 ? 1 : 0)));
}

function levelLabel(level: number) {
  if (level === 1) return 'Beginner';
  if (level === 2) return 'Beginner+';
  if (level === 3) return 'Foundation';
  if (level === 4) return 'Foundation+';
  if (level === 5) return 'Intermediate';
  if (level === 6) return 'Intermediate+';
  if (level === 7) return 'Advanced';
  if (level === 8) return 'Advanced+';
  if (level === 9) return 'Expert';
  return 'Elite';
}

function clampInt(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? Math.round(value) : min));
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}
