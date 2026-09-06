import { MOBILE_API_URL } from './api-base';
import { getStoredAccessToken } from './api';
import type { OnboardingState } from './onboarding';

export async function persistOnboardingToBackend(state: OnboardingState): Promise<void> {
  const token = await getStoredAccessToken();
  if (!token) return;

  const response = await fetch(`${MOBILE_API_URL}/users/onboarding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fullName: state.fullName.trim(),
      gender: state.gender,
      birthDate: new Date(state.birthDate).toISOString(),
      heightCm: Number(state.heightCm),
      weightKg: Number(state.weightKg),
      goal: state.goal,
      fitnessLevel: state.fitnessLevel,
      diet: state.diet,
      workoutPlace: state.workoutPlace,
      trainingDaysPerWeek: state.trainingDaysPerWeek,
      equipment: state.equipment,
      sessionMinutes: state.sessionMinutes,
      detectedCountry: state.detectedCountry.trim(),
      notificationsEnabled: state.permissions.notifications,
      locationPermissionGranted: state.permissions.location,
      cameraPermissionGranted: state.permissions.camera,
      microphonePermissionGranted: state.permissions.microphone,
    }),
  });

  if (!response.ok) {
    throw new Error((await response.text()) || `Onboarding sync failed with ${response.status}`);
  }
}
