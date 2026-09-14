import { getStoredAccessToken } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

export type ExerciseMedia = {
  id: string;
  kind: 'video' | 'image' | 'animation';
  url: string;
  sourceUrl: string | null;
  sourceProvider: string;
  license: string;
  attribution: string | null;
  mimeType: string | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  language: string | null;
  posterUrl: string | null;
  checksum: string | null;
  acquisitionMode: string | null;
  sourceReference: string | null;
  rightsBasis: string | null;
  creator: string | null;
  storageKey: string | null;
  transformed: boolean;
  position: number;
};

export type ExerciseSummary = {
  id: string;
  slug: string;
  name: string;
  nameFa: string | null;
  discipline: string;
  movementPattern: string | null;
  primaryMuscles: string[];
  equipment: string[];
  difficulty: string;
  goals: string[];
  instructions: string | null;
  approvedMediaCount: number;
  approvedVideoCount: number;
};

export type ExerciseDetail = ExerciseSummary & {
  secondaryMuscles: string[];
  aliases: string[];
  coachCues: string[];
  commonMistakes: string[];
  cautions: string[];
  media: ExerciseMedia[];
  relationships: Array<{ id: string; kind: string; priority: number; notes: string | null; slug: string; name: string; nameFa: string | null }>;
  mediaReady: boolean;
  videoReady: boolean;
};

export type ExerciseListResponse = { items: ExerciseSummary[]; total: number; limit: number; offset: number };

async function request<T>(path: string): Promise<T> {
  const token = await getStoredAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export async function getExerciseList(params: {
  search?: string;
  discipline?: string;
  muscle?: string;
  equipment?: string;
  difficulty?: string;
  goal?: string;
  limit?: number;
  offset?: number;
} = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') query.set(key, String(value));
  }
  return request<ExerciseListResponse>(`/fitness/exercises${query.toString() ? `?${query.toString()}` : ''}`);
}

export function getExerciseDetail(id: string) {
  return request<ExerciseDetail>(`/fitness/exercises/${encodeURIComponent(id)}`);
}
