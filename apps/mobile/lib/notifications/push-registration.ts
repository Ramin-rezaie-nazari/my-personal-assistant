import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = '@my-personal-assistant/notification-device-id';
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export type AppLanguage = 'fa' | 'en';
export type RegisteredDevice = { id: string; userId: string; platform: 'ios' | 'android' | 'web'; pushToken: string; enabled: boolean; locale?: AppLanguage; timezone?: string };
type RegistrationOptions = { accessToken: string; language: AppLanguage; timezone?: string; projectId: string };

async function registerToken(accessToken: string, language: AppLanguage, pushToken: string, timezone?: string) {
  if (!API_URL) return null;
  const response = await fetch(`${API_URL}/personal-brain/coach/device`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform: Platform.OS, pushToken, locale: language, timezone: timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone }),
  });
  if (!response.ok) throw new Error(`Notification device registration failed: ${response.status}`);
  const device = (await response.json()) as RegisteredDevice;
  await AsyncStorage.setItem(DEVICE_ID_KEY, device.id);
  return device;
}

export async function registerForPushNotifications(options: RegistrationOptions): Promise<RegisteredDevice | null> {
  if (!API_URL || !options.accessToken || Platform.OS === 'web') return null;
  let status = (await Notifications.getPermissionsAsync()).status;
  if (status !== Notifications.PermissionStatus.GRANTED) status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== Notifications.PermissionStatus.GRANTED) return null;
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Default', importance: Notifications.AndroidImportance.DEFAULT });
  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId: options.projectId });
  return registerToken(options.accessToken, options.language, tokenResponse.data, options.timezone);
}

export function listenForPushTokenRefresh(options: RegistrationOptions) {
  return Notifications.addPushTokenListener(({ data }) => {
    void registerToken(options.accessToken, options.language, data, options.timezone);
  });
}

export async function getRegisteredNotificationDeviceId() { return AsyncStorage.getItem(DEVICE_ID_KEY); }

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
