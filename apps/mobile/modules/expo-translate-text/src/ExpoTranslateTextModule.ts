import { requireNativeModule } from 'expo-modules-core';
import { ExpoTranslateTextModule, TranslationErrorCode, TranslationTaskRequest } from './ExpoTranslateText.types';
import { Platform } from 'react-native';

export class TranslationError extends Error {
  code: TranslationErrorCode;
  constructor(message: string, code: TranslationErrorCode = 'UNKNOWN_ERROR') {
    super(message);
    this.name = 'TranslationError';
    this.code = code;
  }
}

function getNativeModule(): ExpoTranslateTextModule | null {
  try {
    return requireNativeModule<ExpoTranslateTextModule>('ExpoTranslateText');
  } catch {
    return null;
  }
}

export const translateTask = (params: TranslationTaskRequest) => {
  const nativeModule = getNativeModule();
  if (!nativeModule) {
    throw new TranslationError('Native translation module is unavailable in this build.', 'INTERNAL_ERROR');
  }
  if (Platform.OS === 'android') {
    return (nativeModule as any).translateTask(
      JSON.stringify(params.input),
      params.targetLangCode ?? '',
      params.sourceLangCode ?? null,
      params.requiresWifi ?? false,
      params.requireCharging ?? false,
    );
  }
  return nativeModule.translateTask(params);
};

export const translateSheet = (params: Parameters<ExpoTranslateTextModule['translateSheet']>[0]) => {
  const nativeModule = getNativeModule();
  if (!nativeModule) {
    throw new TranslationError('Native translation module is unavailable in this build.', 'INTERNAL_ERROR');
  }
  return nativeModule.translateSheet(params);
};

export const isTranslationSupported = () => Boolean(getNativeModule()?.isTranslationSupported());
