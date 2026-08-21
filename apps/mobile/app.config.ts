import type { ExpoConfig } from 'expo/config';

export default ({ config }: { config: ExpoConfig }): ExpoConfig => ({
  ...config,
  ios: {
    ...config.ios,
    supportsTablet: true,
  },
  android: {
    ...config.android,
    permissions: [
      ...(config.android?.permissions ?? []),
      'android.permission.health.READ_STEPS',
      'android.permission.health.READ_DISTANCE',
      'android.permission.health.READ_ACTIVE_CALORIES_BURNED',
      'android.permission.health.READ_TOTAL_CALORIES_BURNED',
      'android.permission.health.READ_SLEEP',
      'android.permission.health.READ_EXERCISE',
      'android.permission.health.READ_HEART_RATE',
      'android.permission.health.READ_WEIGHT',
    ],
  },
  plugins: [
    ...(config.plugins ?? []),
    'expo-dev-client',
    [
      '@kingstinct/react-native-healthkit',
      {
        NSHealthShareUsageDescription:
          'My Personal Assistant برای تحلیل دقیق فعالیت، خواب و وضعیت سلامتی شما به داده‌های Health نیاز دارد.',
        NSHealthUpdateUsageDescription:
          'My Personal Assistant فقط در صورت نیاز و با اجازه شما داده‌های سلامت را ثبت می‌کند.',
        background: false,
      },
    ],
    'react-native-health-connect',
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          minSdkVersion: 26,
        },
      },
    ],
  ],
});
