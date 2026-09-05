import AsyncStorage from '@react-native-async-storage/async-storage';
import { FitnessDiscipline } from './fitness-api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'mpa.accessToken';
const REFRESH_TOKEN_KEY = 'mpa.refreshToken';

export type FitnessProgress = {
  discipline: FitnessDiscipline;
  currentLevel: number;
  sessionsCompleted: number;
  completionRate: number | null;
  formScoreAvg: number | null;
  recentDifficulty: number | null;
  nextLevel: number | null;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  let response = await fetch(`${API_URL}${path}`, withAuth(init, token));
  if (response.status === 401 && token) {
    const refresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (refresh) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (refreshResponse.ok) {
        const auth = await refreshResponse.json() as { accessToken: string; refreshToken: string };
        await AsyncStorage.multiSet([[ACCESS_TOKEN_KEY, auth.accessToken], [REFRESH_TOKEN_KEY, auth.refreshToken]]);
        response = await fetch(`${API_URL}${path}`, withAuth(init, auth.accessToken));
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

export function getFitnessProgress() {
  return request<FitnessProgress[]>('/fitness/progress');
}

export function recordFitnessSession(input: { discipline: FitnessDiscipline; difficulty: number; completed: boolean; formScore?: number | null }) {
  return request<FitnessProgress>('/fitness/progress/session', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
