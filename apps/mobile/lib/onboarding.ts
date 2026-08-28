import AsyncStorage from '@react-native-async-storage/async-storage';

export type Goal = 'fat_loss' | 'body_sculpt' | 'strength' | 'general_fitness';
export type FitnessLevel = 'beginner' | 'foundation' | 'intermediate' | 'advanced';
export type Diet = 'balanced' | 'high_protein' | 'vegetarian' | 'vegan' | 'halal';
export type Gender = 'female' | 'male' | 'other' | 'prefer_not_to_say';
export type ExerciseLocation = 'home' | 'gym';
export type SessionMinutes = 20 | 30 | 45 | 60 | 90 | 120 | 180;
export type PermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export type OnboardingState = {
  version: number;
  completed: boolean;
  gender: Gender | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  bmi: number | null;
  country: string | null;
  countryCode: string | null;
  goal: Goal | null;
  fitnessLevel: FitnessLevel | null;
  diet: Diet | null;
  exerciseLocation: ExerciseLocation | null;
  sessionMinutes: SessionMinutes | null;
  permissions: {
    location: PermissionStatus;
    microphone: PermissionStatus;
    camera: PermissionStatus;
    notifications: PermissionStatus;
  };
  /** Legacy fields kept only for migration compatibility. */
  cuisine?: string | null;
  equipment?: 'none' | 'home' | 'gym' | null;
};

export const ONBOARDING_VERSION = 2;
export const ONBOARDING_STORAGE_KEY = '@my-personal-assistant/onboarding';

export const DEFAULT_ONBOARDING: OnboardingState = {
  version: ONBOARDING_VERSION,
  completed: false,
  gender: null,
  age: null,
  heightCm: null,
  weightKg: null,
  bmi: null,
  country: null,
  countryCode: null,
  goal: null,
  fitnessLevel: null,
  diet: null,
  exerciseLocation: null,
  sessionMinutes: null,
  permissions: {
    location: 'undetermined',
    microphone: 'undetermined',
    camera: 'undetermined',
    notifications: 'undetermined',
  },
};

export function calculateBMI(weightKg: number, heightCm: number): number | null {
  if (!Number.isFinite(weightKg) || !Number.isFinite(heightCm) || weightKg <= 0 || heightCm <= 0) return null;
  return Number((weightKg / ((heightCm / 100) ** 2)).toFixed(1));
}

export function mergeOnboardingState(parsed: Partial<OnboardingState>): OnboardingState {
  const permissions = { ...DEFAULT_ONBOARDING.permissions, ...(parsed.permissions ?? {}) };
  const next = { ...DEFAULT_ONBOARDING, ...parsed, permissions };
  const bmi = calculateBMI(Number(next.weightKg), Number(next.heightCm));
  return { ...next, version: ONBOARDING_VERSION, bmi };
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const raw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (!raw) return DEFAULT_ONBOARDING;
  try {
    return mergeOnboardingState(JSON.parse(raw) as Partial<OnboardingState>);
  } catch {
    return DEFAULT_ONBOARDING;
  }
}

export async function setOnboardingState(state: OnboardingState): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(mergeOnboardingState(state)));
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await getOnboardingState()).completed;
}

export function toPersonalizationContext(state: OnboardingState) {
  return {
    gender: state.gender,
    age: state.age,
    heightCm: state.heightCm,
    weightKg: state.weightKg,
    bmi: state.bmi,
    country: state.country,
    countryCode: state.countryCode,
    goal: state.goal,
    fitnessLevel: state.fitnessLevel,
    diet: state.diet,
    exerciseLocation: state.exerciseLocation,
    sessionMinutes: state.sessionMinutes,
  };
}
