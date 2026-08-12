import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export type NotificationRoute = {
  screen?: string;
  taskId?: string;
  workoutId?: string;
  reminderId?: string;
};

export type NotificationRuntimeHandlers = {
  onReceived?: (notification: Notifications.Notification) => void;
  onResponse?: (response: Notifications.NotificationResponse, route: NotificationRoute) => void;
};

export function configureNotificationRuntime() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function startNotificationRuntime(handlers: NotificationRuntimeHandlers = {}) {
  configureNotificationRuntime();
  if (Platform.OS === 'web') return () => undefined;

  const received = Notifications.addNotificationReceivedListener((notification) => {
    handlers.onReceived?.(notification);
  });
  const response = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data ?? {}) as NotificationRoute;
    handlers.onResponse?.(response, data);
  });

  return () => {
    received.remove();
    response.remove();
  };
}

export async function consumeLastNotificationResponse(handlers: NotificationRuntimeHandlers = {}) {
  if (Platform.OS === 'web') return null;
  const response = await Notifications.getLastNotificationResponseAsync();
  if (!response) return null;
  const data = (response.notification.request.content.data ?? {}) as NotificationRoute;
  handlers.onResponse?.(response, data);
  return response;
}
