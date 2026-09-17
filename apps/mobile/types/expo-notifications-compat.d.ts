import 'expo-notifications';

declare module 'expo-notifications' {
  interface NotificationPermissionsStatus {
    /** Present at runtime in the SDK used by this project, despite the narrower published type. */
    granted?: boolean;
    /** Legacy/top-level runtime field retained by request/get permission APIs. */
    status?: 'granted' | 'denied' | 'undetermined' | number;
  }
}
