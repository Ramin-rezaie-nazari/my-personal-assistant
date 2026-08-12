import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { parseNotificationPayload, NotificationPayload } from './notification-contract';

export type NotificationRoute = NotificationPayload;
export type NotificationRuntimeHandlers = {
  onReceived?: (notification: Notifications.Notification, payload: NotificationPayload | null) => void;
  onResponse?: (response: Notifications.NotificationResponse, payload: NotificationPayload | null) => void;
};

export function configureNotificationRuntime() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: true, shouldShowBanner: true, shouldShowList: true }),
  });
}

function payloadFrom(notification: Notifications.Notification) {
  return parseNotificationPayload(notification.request.content.data);
}

export function startNotificationRuntime(handlers: NotificationRuntimeHandlers = {}) {
  configureNotificationRuntime();
  if (Platform.OS === 'web') return () => undefined;
  const received = Notifications.addNotificationReceivedListener((notification) => handlers.onReceived?.(notification, payloadFrom(notification)));
  const response = Notifications.addNotificationResponseReceivedListener((response) => handlers.onResponse?.(response, payloadFrom(response.notification)));
  return () => { received.remove(); response.remove(); };
}

export async function consumeLastNotificationResponse(handlers: NotificationRuntimeHandlers = {}) {
  if (Platform.OS === 'web') return null;
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  handlers.onResponse?.(response, payloadFrom(response.notification));
  return response;
}
