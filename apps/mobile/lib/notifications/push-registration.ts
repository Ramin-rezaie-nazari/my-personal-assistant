import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = '@my-personal-assistant/notification-device-id';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type AppLanguage = 'fa' | 'en';
export type RegisteredDevice = { id: string; userId: string; platform: 'ios' | 'android' | 'web'; pushToken: string; enabled: boolean; locale?: AppLanguage; timezone?: string };

type RegistrationOptions = { accessToken: string; language: AppLanguage; timezone?: string; projectId?: string };

function getProjectId(explicit?: string) {
  return explicit ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? Constants.expoConfig?.extra?.eas?.projectId;
}

export async function registerForPushNotifications(options: RegistrationOptions): Promise<RegisteredDevice | null> {
  if (!API_URL || !options.accessToken || Platform.OS === 'web') return null;
  const permissions = await Notifications.getPermissionsAsync();
  let status = permissions.status;
  if (status !== Notifications.PermissionStatus.GRANTED) {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== Notifications.PermissionStatus.GRANTED) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const projectId = getProjectId(options.projectId);
  const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  const timezone = options.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const response = await fetch(`${API_URL}/personal-brain/coach/device`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform: Platform.OS, pushToken: tokenResponse.data, locale: options.language, timezone }),
  });
  if (!response.ok) throw new Error(`Notification device registration failed: ${response.status}`);
  const device = (await response.json()) as RegisteredDevice;
  await AsyncStorage.setItem(DEVICE_ID_KEY, device.id);
  return device;
}

export async function getRegisteredNotificationDeviceId() {
  return AsyncStorage.getItem(DEVICE_ID_KEY);
}

export async function disableRegisteredNotificationDevice(accessToken: string) {
  if (!API_URL) return false;
  const deviceId = await getRegisteredNotificationDeviceId();
  if (!deviceId) return false;
  const response = await fetch(`${API_URL}/personal-brain/coach/device/disable`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId }),
  });
  if (!response.ok) throw new Error(`Notification device disable failed: ${response.status}`);
  await AsyncStorage.removeItem(DEVICE_ID_KEY);
  return true;
}
