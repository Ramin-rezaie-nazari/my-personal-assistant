import { Platform } from 'react-native';
import {
  TranslationErrorCode,
  TranslationSheetRequest,
  TranslationTaskRequest,
  TranslationTaskResult,
} from './ExpoTranslateText.types';
import { translateTask, translateSheet, TranslationError, isTranslationSupported } from './ExpoTranslateTextModule';

export { TranslationError, TranslationErrorCode, isTranslationSupported };

const IOS_ERROR_CODE_MAP: Record<number, TranslationErrorCode> = {
  0: 'INTERNAL_ERROR',
  3: 'NO_TEXT_PROVIDED',
  2: 'TRANSLATION_FAILED',
  [-1]: 'UNSUPPORTED_OS_VERSION',
};

const ANDROID_ERROR_CODE_MAP: Record<string, TranslationErrorCode> = {
  INVALID_PARAMETER: 'INVALID_LANGUAGE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  TEXT_TRANSLATE_FAILED: 'TRANSLATION_FAILED',
  MODEL_DOWNLOAD_FAILED: 'MODEL_DOWNLOAD_FAILED',
  LANGUAGE_ID_FAILED: 'LANGUAGE_DETECTION_FAILED',
  PARAMETER_ERROR: 'UNKNOWN_ERROR',
};

function extractErrorCode(error: unknown): TranslationErrorCode {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string' && code in ANDROID_ERROR_CODE_MAP) return ANDROID_ERROR_CODE_MAP[code];
    if (typeof code === 'number' && code in IOS_ERROR_CODE_MAP) return IOS_ERROR_CODE_MAP[code];
  }
  return 'UNKNOWN_ERROR';
}

export const onTranslateTask = async ({ input, sourceLangCode, targetLangCode, requireCharging, requiresWifi }: TranslationTaskRequest): Promise<TranslationTaskResult> => {
  try {
    return await translateTask({ input, sourceLangCode, targetLangCode, requiresWifi, requireCharging });
  } catch (error: unknown) {
    const errorCode = extractErrorCode(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during translation.';
    throw new TranslationError(errorMessage, errorCode);
  }
};

export const onTranslateSheet = async ({ input }: TranslationSheetRequest): Promise<string> => {
  try {
    if (Platform.OS === 'android') throw new Error('Sheet translation is not supported on Android.');
    const response = await translateSheet({ input });
    return response.translatedText;
  } catch (error: unknown) {
    const errorCode = extractErrorCode(error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during translation.';
    throw new TranslationError(errorMessage, errorCode);
  }
};
