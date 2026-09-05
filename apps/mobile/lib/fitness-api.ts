import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'mpa.accessToken';
const REFRESH_TOKEN_KEY = 'mpa.refreshToken';

export type FitnessDiscipline = 'gym' | 'calisthenics' | 'yoga';
export type FitnessItem = {
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
export type FitnessCatalogResponse = {
  items: FitnessItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  tenLevelScale: Array<{ level: number; label: string }>;
  mediaPolicy: { requiredPerExercise: number; format: 'webp'; partialAssetsAreExplicit: boolean };
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  let response = await fetch(`${API_URL}${path}`, withAuth(init, token));
  if (response.status === 401 && token) {
    const refresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (refresh) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: refresh }),
      });
      if (refreshResponse.ok) {
        const auth = (await refreshResponse.json()) as { accessToken: string; refreshToken: string };
        await AsyncStorage.multiSet([[ACCESS_TOKEN_KEY, auth.accessToken], [REFRESH_TOKEN_KEY, auth.refreshToken]]);
        token = auth.accessToken;
        response = await fetch(`${API_URL}${path}`, withAuth(init, token));
      }
    }
  }
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

function withAuth(init: RequestInit, token: string | null): RequestInit {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return { ...init, headers };
}

export function getFitnessLibrary(discipline: FitnessDiscipline, level = 5, page = 1, pageSize = 24, q = '') {
  const params = new URLSearchParams({ discipline, level: String(level), page: String(page), pageSize: String(pageSize) });
  if (q.trim()) params.set('q', q.trim());
  return request<FitnessCatalogResponse>(`/fitness/catalog?${params.toString()}`);
}

export function getFitnessExercise(discipline: FitnessDiscipline, id: string) {
  return request<FitnessItem>(`/fitness/catalog/${encodeURIComponent(discipline)}/${encodeURIComponent(id)}`);
}
