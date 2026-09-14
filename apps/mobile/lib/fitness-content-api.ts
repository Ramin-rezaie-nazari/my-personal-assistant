import { clearAuthSession, getStoredAccessToken, getStoredRefreshToken, setAuthSession } from './api';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
type AuthResponse = Parameters<typeof setAuthSession>[0];

export type ExerciseMedia = {
  id: string; kind: 'video' | 'image' | 'animation'; url: string; sourceUrl: string | null; sourceProvider: string; license: string; attribution: string | null; mimeType: string | null; durationSeconds: number | null; width: number | null; height: number | null; language: string | null; posterUrl: string | null; checksum: string | null; acquisitionMode: string | null; sourceReference: string | null; rightsBasis: string | null; creator: string | null; storageKey: string | null; transformed: boolean; position: number;
};
export type ExerciseSummary = { id: string; slug: string; name: string; nameFa: string | null; discipline: string; movementPattern: string | null; primaryMuscles: string[]; equipment: string[]; difficulty: string; goals: string[]; instructions: string | null; approvedMediaCount: number; approvedVideoCount: number; };
export type ExerciseRelationship = { id: string; fromExerciseId: string; toExerciseId: string; kind: string; priority: number; notes: string | null; slug: string; name: string; nameFa: string | null; };
export type ExerciseDetail = ExerciseSummary & { secondaryMuscles: string[]; aliases: string[]; coachCues: string[]; commonMistakes: string[]; cautions: string[]; media: ExerciseMedia[]; relationships: ExerciseRelationship[]; mediaReady: boolean; videoReady: boolean; };
export type ExerciseListResponse = { items: ExerciseSummary[]; total: number; limit: number; offset: number };
export type FitnessProgram = { id: string; slug: string; name: string; nameFa: string | null; description: string; discipline: string; goal: string; level: string; durationWeeks: number; sessionsPerWeek: number; sessionDurationMin: number; equipment: string[]; targetAreas: string[]; tags: string[]; coverMediaUrl: string | null; versionId: string; version: number; publishedAt: string | null; sessionCount: number; };
export type FitnessProgramSession = { id: string; programVersionId: string; weekNumber: number; dayNumber: number; title: string; focus: string; durationMin: number; sessionPayload: { goal?: string; discipline?: string; week?: number; day?: number; prescription?: Array<{ exerciseKey: string; sets: number; reps: string; restSec: number }> }; };
export type FitnessPlanAssignment = { id: string; userId: string; programVersionId: string; startedOn: string; status: 'active' | 'paused' | 'completed' | 'cancelled'; currentWeek: number; currentDay: number; completedSessions: number; lastSessionAt: string | null; };
export type FitnessProgramDetail = FitnessProgram & { sessions: FitnessProgramSession[]; assignment: FitnessPlanAssignment | null };
export type FitnessProgramListResponse = { items: FitnessProgram[]; total: number; limit: number; offset: number };
export type FitnessCurrentProgram = FitnessPlanAssignment & { programId: string; slug: string; name: string; nameFa: string | null; discipline: string; goal: string; level: string; durationWeeks: number; sessionsPerWeek: number; sessionDurationMin: number; sessionId: string | null; sessionTitle: string | null; sessionFocus: string | null; sessionDurationMinCurrent: number | null; sessionPayload: FitnessProgramSession['sessionPayload'] | null; };
export type FitnessCalculatorResult = { bmi: number; bmr: number; tdee: number; recommendedCaloriesForFatLoss: number; recommendedCaloriesForGain: number; workoutCalories: number; leanMassKg: number | null; waterMl: number; activityFactor: number; methodology: string; };

async function rawRequest(path: string, token?: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  return fetch(`${API_URL}${path}`, { ...init, headers });
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = await getStoredAccessToken();
  let response = await rawRequest(path, token ?? undefined, init);
  if (response.status === 401 && token) {
    const refreshToken = await getStoredRefreshToken();
    if (refreshToken) {
      const refreshResponse = await rawRequest('/auth/refresh', undefined, { method: 'POST', body: JSON.stringify({ refreshToken }) });
      if (refreshResponse.ok) {
        const auth = await refreshResponse.json() as AuthResponse;
        await setAuthSession(auth);
        token = auth.accessToken;
        response = await rawRequest(path, token, init);
      } else await clearAuthSession();
    }
  }
  if (!response.ok) throw new Error((await response.text()) || `Request failed with ${response.status}`);
  return response.json() as Promise<T>;
}

function queryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') query.set(key, String(value));
  return query.toString();
}

export function getExerciseList(params: { search?: string; discipline?: string; muscle?: string; equipment?: string; difficulty?: string; goal?: string; limit?: number; offset?: number } = {}) {
  const q = queryString(params); return request<ExerciseListResponse>(`/fitness/exercises${q ? `?${q}` : ''}`);
}
export function getExerciseDetail(id: string) { return request<ExerciseDetail>(`/fitness/exercises/${encodeURIComponent(id)}`); }
export function getFitnessPrograms(params: { discipline?: string; goal?: string; level?: string; limit?: number; offset?: number } = {}) { const q=queryString(params); return request<FitnessProgramListResponse>(`/fitness/programs${q ? `?${q}` : ''}`); }
export function getFitnessProgram(id: string) { return request<FitnessProgramDetail>(`/fitness/programs/${encodeURIComponent(id)}`); }
export function getCurrentFitnessProgram() { return request<FitnessCurrentProgram | null>('/fitness/programs/current'); }
export function startFitnessProgram(programId: string) { return request<FitnessProgramDetail>('/fitness/programs/start', { method:'POST', body:JSON.stringify({ programId }) }); }
export function completeFitnessProgramSession(programId: string, week: number, day: number) { return request<FitnessProgramDetail>(`/fitness/programs/${encodeURIComponent(programId)}/sessions/complete`, { method:'POST', body:JSON.stringify({ week, day }) }); }
export function updateFitnessProgramStatus(programId: string, status: FitnessPlanAssignment['status']) { return request<FitnessProgramDetail>(`/fitness/programs/${encodeURIComponent(programId)}/status`, { method:'POST', body:JSON.stringify({ status }) }); }
export function calculateFitness(input: { sex:'male'|'female'; age:number; heightCm:number; weightKg:number; activityFactor?:number; bodyFatPercent?:number; workoutMinutes?:number; workoutCaloriesPerMinute?:number; waterActivityLevel?:'low'|'moderate'|'high'; }) { return request<FitnessCalculatorResult>('/fitness/calculators', { method:'POST', body:JSON.stringify(input) }); }
