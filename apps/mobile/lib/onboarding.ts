import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistOnboardingToBackend } from './onboarding-api';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type WorkoutPlace = 'home' | 'gym' | 'both';

export type OnboardingState = {
  completed: boolean;
  fullName: string;
  gender: Gender | '';
  visualTheme: 'default' | 'feminine';
  birthDate: string;
  heightCm: string;
  weightKg: string;
  goal: 'fat_loss' | 'body_sculpt' | 'strength' | 'general_fitness';
  fitnessLevel: 'beginner' | 'foundation' | 'intermediate' | 'advanced';
  diet: 'balanced' | 'high_protein' | 'vegetarian' | 'vegan' | 'halal';
  workoutPlace: WorkoutPlace;
  trainingDaysPerWeek: 2 | 3 | 4 | 5 | 6;
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
export const ONBOARDING_VERSION = 4;
const ONBOARDING_REMOTE_SYNC_PENDING_KEY = '@my-personal-assistant/onboarding-sync-pending';

export const DEFAULT_ONBOARDING: OnboardingState = {
  completed: false,
  fullName: '',
  gender: '',
  visualTheme: 'default',
  birthDate: '',
  heightCm: '',
  weightKg: '',
  goal: 'general_fitness',
  fitnessLevel: 'beginner',
  diet: 'balanced',
  workoutPlace: 'home',
  trainingDaysPerWeek: 3,
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
    const gender = parsed.gender ?? DEFAULT_ONBOARDING.gender;
    const state: OnboardingState = {
      ...DEFAULT_ONBOARDING,
      ...parsed,
      gender,
      visualTheme: gender === 'female' ? 'feminine' : 'default',
      permissions: {
        ...DEFAULT_ONBOARDING.permissions,
        ...(parsed.permissions ?? {}),
      },
    };

    if (state.completed && (await AsyncStorage.getItem(ONBOARDING_REMOTE_SYNC_PENDING_KEY)) === '1') {
      void retryPendingRemoteSync(state);
    }

    return state;
  } catch {
    return DEFAULT_ONBOARDING;
  }
}

export async function setOnboardingState(state: OnboardingState): Promise<void> {
  const normalizedState: OnboardingState = {
    ...state,
    visualTheme: state.gender === 'female' ? 'feminine' : 'default',
  };

  await AsyncStorage.setItem(
    ONBOARDING_STORAGE_KEY,
    JSON.stringify({ ...normalizedState, version: ONBOARDING_VERSION }),
  );

  if (!normalizedState.completed) {
    await AsyncStorage.removeItem(ONBOARDING_REMOTE_SYNC_PENDING_KEY);
    return;
  }

  try {
    await persistOnboardingToBackend(normalizedState);
    await AsyncStorage.removeItem(ONBOARDING_REMOTE_SYNC_PENDING_KEY);
  } catch {
    // Local-first onboarding remains usable. The state is retained and retried on the next read.
    await AsyncStorage.setItem(ONBOARDING_REMOTE_SYNC_PENDING_KEY, '1');
  }
}

async function retryPendingRemoteSync(state: OnboardingState): Promise<void> {
  try {
    await persistOnboardingToBackend(state);
    await AsyncStorage.removeItem(ONBOARDING_REMOTE_SYNC_PENDING_KEY);
  } catch {
    // Keep the pending flag for a later retry; do not disrupt foreground UX for transient network errors.
  }
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
