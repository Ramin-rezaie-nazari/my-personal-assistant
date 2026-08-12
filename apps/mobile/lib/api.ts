import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'mpa.accessToken';
const REFRESH_TOKEN_KEY = 'mpa.refreshToken';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

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

export type DashboardOverviewResponse = {
  dateKey: string;
  range: { startKey: string; endKey: string };
  today: DashboardResponse;
  weekly: {
    loggedDays: number;
    consistencyPercent: number;
    totalCalories: number;
    totalProtein: number;
    totalWaterMl: number;
    averageCalories: number;
    averageProtein: number;
    currentStreak: number;
  };
  workouts: {
    count: number;
    activeDays: number;
    totalMinutes: number;
    totalCaloriesBurned: number;
    latest: {
      id: string;
      name: string;
      type: string;
      durationMinutes: number;
      caloriesBurned: number;
      performedAt: string;
    } | null;
  };
};

export type PersonalInsight = {
  key: string;
  title: string;
  description: string;
  score: number;
  category: 'nutrition' | 'hydration' | 'fitness' | 'consistency';
};

export type PersonalInsightsResponse = {
  generatedAt: string;
  dateKey: string;
  profileGoal: string | null;
  summary: string;
  insights: PersonalInsight[];
};

export async function setAuthSession(auth: AuthResponse) {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, auth.accessToken],
    [REFRESH_TOKEN_KEY, auth.refreshToken],
  ]);
}

export async function setAccessToken(token: string) {
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export async function getStoredAccessToken() {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getStoredRefreshToken() {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function hasAuthSession() {
  const [accessToken, refreshToken] = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
  ]);
  return Boolean(accessToken[1] || refreshToken[1]);
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
}

export async function clearAccessToken() {
  await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
}

async function rawRequest<T>(path: string, init: RequestInit = {}, token?: string): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

async function refreshAccessToken() {
  const refreshToken = await getStoredRefreshToken();
  if (!refreshToken) return null;

  const response = await rawRequest<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await clearAuthSession();
    return null;
  }

  const auth = (await response.json()) as AuthResponse;
  await setAuthSession(auth);
  return auth.accessToken;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = await getStoredAccessToken();
  let response = await rawRequest<T>(path, init, token ?? undefined);

  if (response.status === 401 && token) {
    token = await refreshAccessToken();
    if (token) response = await rawRequest<T>(path, init, token);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function register(data: { email: string; password: string; firstName?: string; lastName?: string }) {
  return request<AuthResponse>('/auth/register', { method: 'POST', body: JSON.stringify(data) }).then(async (auth) => {
    await setAuthSession(auth);
    return auth;
  });
}

export function login(email: string, password: string) {
  return request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }).then(async (auth) => {
    await setAuthSession(auth);
    return auth;
  });
}

export function getMe() { return request<AuthUser>('/auth/me'); }

export async function logout() {
  const refreshToken = await getStoredRefreshToken();
  try {
    if (refreshToken) await rawRequest('/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) });
  } finally {
    await clearAuthSession();
  }
}

export function getTodayDashboard(dateKey?: string) {
  const query = dateKey ? `?dateKey=${encodeURIComponent(dateKey)}` : '';
  return request<DashboardResponse>(`/dashboard/today${query}`);
}

export function getDashboardOverview(dateKey?: string) {
  const query = dateKey ? `?dateKey=${encodeURIComponent(dateKey)}` : '';
  return request<DashboardOverviewResponse>(`/dashboard/overview${query}`);
}

export function getPersonalInsights(dateKey?: string) {
  const query = dateKey ? `?dateKey=${encodeURIComponent(dateKey)}` : '';
  return request<PersonalInsightsResponse>(`/adaptive-learning/insights${query}`);
}

export function addWater(amountMl: number, dateKey?: string) {
  const query = dateKey ? `?dateKey=${encodeURIComponent(dateKey)}` : '';
  return request<{ waterMl: number }>(`/daily/water${query}`, {
    method: 'POST',
    body: JSON.stringify({ amountMl }),
  });
}

export function createWorkout(data: {
  name: string;
  type: string;
  durationMinutes: number;
  caloriesBurned: number;
}) {
  return request('/workout', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
