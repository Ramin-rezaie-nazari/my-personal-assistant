import AsyncStorage from '@react-native-async-storage/async-storage';

export type OnboardingState = {
  completed: boolean;
  goal: 'fat_loss' | 'body_sculpt' | 'strength' | 'general_fitness';
  fitnessLevel: 'beginner' | 'foundation' | 'intermediate' | 'advanced';
  diet: 'balanced' | 'high_protein' | 'vegetarian' | 'vegan' | 'halal';
  country: string;
  cuisine: string;
  equipment: 'none' | 'home' | 'gym';
  sessionMinutes: 20 | 30 | 45 | 60;
};

export const ONBOARDING_STORAGE_KEY = '@my-personal-assistant/onboarding';

export const DEFAULT_ONBOARDING: OnboardingState = {
  completed: false,
  goal: 'general_fitness',
  fitnessLevel: 'beginner',
  diet: 'balanced',
  country: 'Iran',
  cuisine: 'Persian',
  equipment: 'none',
  sessionMinutes: 30,
};

export async function getOnboardingState(): Promise<OnboardingState> {
  const raw = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (!raw) return DEFAULT_ONBOARDING;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return { ...DEFAULT_ONBOARDING, ...parsed };
  } catch {
    return DEFAULT_ONBOARDING;
  }
}

export async function setOnboardingState(state: OnboardingState): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const state = await getOnboardingState();
  return state.completed;
}
