import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import {
  createTTS,
  detectTtsModel,
  saveAudioToFile,
  type TtsEngine,
} from 'react-native-sherpa-onnx';

const MODEL_ARCHIVE_DIR = 'vits-piper-fa_IR-ganji-medium';
const MODEL_ASSET_PATH = MODEL_ARCHIVE_DIR;
const PLAYBACK_DIR = `${FileSystem.cacheDirectory}mypa-tts/`;

let enginePromise: Promise<TtsEngine> | null = null;
let activeSound: Audio.Sound | null = null;
let activePlaybackToken = 0;

function nativeFilePath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

async function ensureEngine(): Promise<TtsEngine> {
  if (!enginePromise) {
    enginePromise = createTTS({
      modelPath: { type: 'asset', path: MODEL_ASSET_PATH },
      modelType: 'vits',
      numThreads: 2,
      modelOptions: {
        vits: {
          noiseScale: 0.667,
          lengthScale: 1.0,
          noiseScaleW: 0.8,
        },
      },
    }).catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

async function stopCurrentPlayback(): Promise<void> {
  activePlaybackToken += 1;
  const sound = activeSound;
  activeSound = null;
  if (!sound) return;
  try {
    await sound.stopAsync();
  } catch {
    // Already stopped or unloaded.
  }
  try {
    await sound.unloadAsync();
  } catch {
    // Best-effort cleanup.
  }
}

export async function isLocalPersianTtsAvailable(): Promise<boolean> {
  try {
    const result = await detectTtsModel(
      { type: 'asset', path: MODEL_ASSET_PATH },
      { modelType: 'vits' },
    );
    if (__DEV__) {
      console.warn('[MYPA][LOCAL_TTS_STATUS]', JSON.stringify(result));
    }
    return Boolean(result.success && result.detectedModels.some((item) => item.type === 'vits'));
  } catch (error) {
    if (__DEV__) console.warn('[MYPA][LOCAL_TTS_STATUS]', 'model detection failed', error);
    return false;
  }
}

export async function speakPersianLocally(text: string, rate = 1): Promise<boolean> {
  const normalizedText = text.trim();
  if (!normalizedText) return false;

  await stopCurrentPlayback();
  const token = activePlaybackToken;

  try {
    if (__DEV__) {
      console.warn('[MYPA][LOCAL_TTS]', JSON.stringify({
        status: 'starting',
        provider: 'sherpa-onnx-piper',
        model: MODEL_ARCHIVE_DIR,
      }));
    }

    const engine = await ensureEngine();
    const audio = await engine.generateSpeech(normalizedText, {
      sid: 0,
      speed: Math.min(1.25, Math.max(0.8, rate)),
    });

    await FileSystem.makeDirectoryAsync(PLAYBACK_DIR, { intermediates: true });
    const outputUri = `${PLAYBACK_DIR}response-${Date.now()}-${token}.wav`;
    const outputNativePath = nativeFilePath(outputUri);
    await saveAudioToFile(audio, outputNativePath);

    if (token !== activePlaybackToken) return false;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: outputUri },
      { shouldPlay: true, volume: 1.0 },
    );
    activeSound = sound;

    if (__DEV__) {
      console.warn('[MYPA][LOCAL_TTS]', JSON.stringify({
        status: 'playing',
        provider: 'sherpa-onnx-piper',
        model: MODEL_ARCHIVE_DIR,
        sampleRate: audio.sampleRate,
        samples: audio.samples.length,
      }));
    }

    await new Promise<void>((resolve, reject) => {
      const handleStatus = (status: Audio.AVPlaybackStatus) => {
        if (!status.isLoaded) {
          if (status.error) reject(new Error(status.error));
          return;
        }
        if (status.didJustFinish) resolve();
      };
      sound.setOnPlaybackStatusUpdate(handleStatus);
    });

    if (activeSound === sound) activeSound = null;
    await sound.unloadAsync();
    try {
      await FileSystem.deleteAsync(outputUri, { idempotent: true });
    } catch {
      // Cache cleanup is best-effort.
    }
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('[MYPA][LOCAL_TTS]', JSON.stringify({
        status: 'failed',
        provider: 'sherpa-onnx-piper',
        model: MODEL_ARCHIVE_DIR,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
    await stopCurrentPlayback();
    return false;
  }
}

export async function stopLocalPersianTts(): Promise<void> {
  await stopCurrentPlayback();
}

export async function releaseLocalPersianTts(): Promise<void> {
  await stopCurrentPlayback();
  if (!enginePromise) return;
  try {
    const engine = await enginePromise;
    await engine.destroy();
  } catch {
    // Best-effort native resource cleanup.
  } finally {
    enginePromise = null;
  }
}

export const LOCAL_PERSIAN_TTS_MODEL = {
  version: '20260831-sherpa-piper-fa-ganji-medium-bundled-v2',
  locale: 'fa-IR',
  voice: 'ganji',
  quality: 'medium',
  archive: MODEL_ARCHIVE_DIR,
  modelFile: 'fa_IR-ganji-medium.onnx',
  tokensFile: 'tokens.txt',
  dataDir: 'espeak-ng-data',
};
