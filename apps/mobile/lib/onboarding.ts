import AsyncStorage from '@react-native-async-storage/async-storage';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type WorkoutPlace = 'home' | 'gym' | 'both';

export type OnboardingState = {
  completed: boolean;
  fullName: string;
  gender: Gender | '';
  birthDate: string;
  heightCm: string;
  weightKg: string;
  goal: 'fat_loss' | 'body_sculpt' | 'strength' | 'general_fitness';
  fitnessLevel: 'beginner' | 'foundation' | 'intermediate' | 'advanced';
  diet: 'balanced' | 'high_protein' | 'vegetarian' | 'vegan' | 'halal';
  workoutPlace: WorkoutPlace;
  equipment: 'none' | 'home' | 'gym';
  sessionMinutes: 20 | 30 | 45 | 60;
  detectedCountry: string;
  permissions: {
    location: boolean;
    notifications: boolean;
    camera: boolean;
    microphone: boolean;
  };
};

export const ONBOARDING_STORAGE_KEY = '@my-personal-assistant/onboarding';
export const ONBOARDING_VERSION = 2;

export const DEFAULT_ONBOARDING: OnboardingState = {
  completed: false,
  fullName: '',
  gender: '',
  birthDate: '',
  heightCm: '',
  weightKg: '',
  goal: 'general_fitness',
  fitnessLevel: 'beginner',
  diet: 'balanced',
  workoutPlace: 'home',
  equipment: 'none',
  sessionMinutes: 30,
  detectedCountry: '',
  permissions: {
    location: false,
    notifications: false,
    camera: false,
    microphone: false,
  },
};

export async function getOnboardingState(): Promise<OnboardingState> {
  const raw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (!raw) return DEFAULT_ONBOARDING;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState> & { version?: number };
    if (parsed.version !== ONBOARDING_VERSION) return DEFAULT_ONBOARDING;
    return {
      ...DEFAULT_ONBOARDING,
      ...parsed,
      permissions: {
        ...DEFAULT_ONBOARDING.permissions,
        ...(parsed.permissions ?? {}),
      },
    };
  } catch {
    return DEFAULT_ONBOARDING;
  }
}

export async function setOnboardingState(state: OnboardingState): Promise<void> {
  await AsyncStorage.setItem(
    ONBOARDING_STORAGE_KEY,
    JSON.stringify({ ...state, version: ONBOARDING_VERSION }),
  );
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const state = await getOnboardingState();
  return state.completed;
}

export function calculateBMI(heightCm: number, weightKg: number): number | null {
  if (!Number.isFinite(heightCm) || !Number.isFinite(weightKg) || heightCm <= 0 || weightKg <= 0) return null;
  const meters = heightCm / 100;
  return Number((weightKg / (meters * meters)).toFixed(1));
}
