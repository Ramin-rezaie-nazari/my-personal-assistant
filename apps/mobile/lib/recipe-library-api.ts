import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'mpa.accessToken';
const REFRESH_TOKEN_KEY = 'mpa.refreshToken';

export type RecipeLibraryItem = {
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
  userId: string | null;
};
export type RecipeLibraryResponse = {
  items: RecipeLibraryItem[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
};

async function request<T>(path: string): Promise<T> {
  const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  let response = await fetch(`${API_URL}${path}`, { headers });
  if (response.status === 401 && token) {
    const refresh = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (refresh) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      });
      if (refreshResponse.ok) {
        const auth = (await refreshResponse.json()) as { accessToken: string; refreshToken: string };
        await AsyncStorage.multiSet([[ACCESS_TOKEN_KEY, auth.accessToken], [REFRESH_TOKEN_KEY, auth.refreshToken]]);
        headers.set('Authorization', `Bearer ${auth.accessToken}`);
        response = await fetch(`${API_URL}${path}`, { headers });
      }
    }
  }
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

export function getRecipeLibrary(page = 1, pageSize = 24, q = '') {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (q.trim()) params.set('q', q.trim());
  return request<RecipeLibraryResponse>(`/recipes/library?${params.toString()}`);
}
