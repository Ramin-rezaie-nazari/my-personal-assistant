declare module 'expo-modules-core' {
  export function requireNativeModule<T = unknown>(name: string): T;
}
