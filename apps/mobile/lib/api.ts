import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'mpa.accessToken';

export type DashboardResponse = {
  dateKey: string;
  profile: {
    gender: string | null;
    birthDate: string | null;
    heightCm: number | null;
    weightKg: number | null;
    primaryGoal: string | null;
  } | null;
  nutrition: {
    calories: number;
    calorieGoal: number;
    caloriesRemaining: number;
    caloriesProgress: number;
    protein: number;
    proteinGoal: number;
    proteinRemaining: number;
    proteinProgress: number;
    waterMl: number;
    waterGoalMl: number;
    waterRemainingMl: number;
    waterProgress: number;
  };
  meals: Array<{
    id: string;
    name: string;
    type: string;
    eatenAt: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  mealCount: number;
};

export async function setAccessToken(token: string) {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function clearAccessToken() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getTodayDashboard(dateKey?: string) {
  const query = dateKey ? `?dateKey=${encodeURIComponent(dateKey)}` : '';
  return request<DashboardResponse>(`/dashboard/today${query}`);
}
