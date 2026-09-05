import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { createTTS, saveAudioToFile, type TtsEngine } from 'react-native-sherpa-onnx/tts';
import {
  extractArchive,
  listBundledArchives,
  type BundledArchive,
} from 'react-native-sherpa-onnx/extraction';

const MODEL_VERSION = '20260831-sherpa-ganji-medium-v1';
const MODEL_ARCHIVE_NAME = 'vits-piper-fa_IR-ganji-medium.tar.bz2';
const MODEL_URL =
  'https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-fa_IR-ganji-medium.tar.bz2';
const MODEL_ROOT = `${FileSystem.documentDirectory}mypa-tts-models/`;
const DOWNLOAD_DIR = `${MODEL_ROOT}downloads/`;
const MODEL_DIR = `${MODEL_ROOT}vits-piper-fa_IR-ganji-medium/`;
const MODEL_PATH = `${MODEL_DIR}fa_IR-ganji-medium.onnx`;
const TOKENS_PATH = `${MODEL_DIR}tokens.txt`;
const ESPEAK_DIR = `${MODEL_DIR}espeak-ng-data/`;
const PLAYBACK_DIR = `${FileSystem.cacheDirectory}mypa-tts/`;
const ARCHIVE_PATH = `${DOWNLOAD_DIR}${MODEL_ARCHIVE_NAME}`;

let enginePromise: Promise<TtsEngine> | null = null;
let activeSound: Audio.Sound | null = null;
let activePlaybackToken = 0;
let nativeOperationQueue: Promise<void> = Promise.resolve();
let releaseRequested = false;

function nativeFilePath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

function isRealFile(path: string): Promise<boolean> {
  return FileSystem.getInfoAsync(path)
    .then((info) => Boolean(info.exists && (info.size ?? 0) > 0))
    .catch(() => false);
}

async function ensureDirectory(path: string): Promise<void> {
  try {
    await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  } catch {
    // Directory may already exist.
  }
}

async function downloadArchive(): Promise<void> {
  await ensureDirectory(DOWNLOAD_DIR);
  if (await isRealFile(ARCHIVE_PATH)) return;

  const temporaryPath = `${ARCHIVE_PATH}.partial`;
  await FileSystem.deleteAsync(temporaryPath, { idempotent: true });
  try {
    const result = await FileSystem.downloadAsync(MODEL_URL, temporaryPath);
    if (!(await isRealFile(result.uri || temporaryPath))) {
      throw new Error('Persian TTS model archive download was empty.');
    }
    await FileSystem.moveAsync({ from: result.uri || temporaryPath, to: ARCHIVE_PATH });
  } catch (error) {
    await FileSystem.deleteAsync(temporaryPath, { idempotent: true });
    throw error;
  }
}

async function extractPersianModel(): Promise<string> {
  await ensureDirectory(MODEL_ROOT);
  await downloadArchive();

  if ((await isRealFile(MODEL_PATH)) && (await isRealFile(TOKENS_PATH))) {
    return nativeFilePath(MODEL_DIR);
  }

  const archives: BundledArchive[] = await listBundledArchives(nativeFilePath(DOWNLOAD_DIR));
  const archive = archives.find((item) => item.archivePath.endsWith(MODEL_ARCHIVE_NAME));
  if (!archive) {
    throw new Error('Persian TTS archive was downloaded but not discoverable for extraction.');
  }

  const result = await extractArchive(archive, nativeFilePath(MODEL_ROOT), {
    force: false,
    showNotificationsEnabled: false,
  });

  if (!result.success || !(await isRealFile(MODEL_PATH)) || !(await isRealFile(TOKENS_PATH))) {
    throw new Error(result.reason ?? 'Persian TTS model extraction failed.');
  }

  return nativeFilePath(MODEL_DIR);
}

async function getEngine(): Promise<TtsEngine> {
  if (releaseRequested) {
    throw new Error('Persian TTS engine is releasing.');
  }

  if (!enginePromise) {
    enginePromise = (async () => {
      const modelDir = await extractPersianModel();
      if (!FileSystem.documentDirectory) throw new Error('Document directory is unavailable.');
      if (!(await isRealFile(MODEL_PATH))) throw new Error('Persian TTS ONNX model is missing.');
      if (!(await isRealFile(TOKENS_PATH))) throw new Error('Persian TTS tokens.txt is missing.');
      try {
        const espeak = await FileSystem.getInfoAsync(ESPEAK_DIR);
        if (!espeak.exists) throw new Error('Persian TTS espeak-ng-data is missing.');
      } catch (error) {
        throw error instanceof Error ? error : new Error('Persian TTS espeak-ng-data is missing.');
      }

      return createTTS({
        modelPath: { type: 'file', path: modelDir },
        modelType: 'vits',
        numThreads: 2,
        modelOptions: {
          vits: {
            noiseScale: 0.667,
            lengthScale: 1.0,
            noiseScaleW: 0.8,
          },
        },
      });
    })().catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

function runSerializedNativeOperation<T>(operation: () => Promise<T>): Promise<T> {
  const nextOperation = nativeOperationQueue.then(operation, operation);
  nativeOperationQueue = nextOperation.then(
    () => undefined,
    () => undefined,
  );
  return nextOperation;
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
    await extractPersianModel();
    const espeak = await FileSystem.getInfoAsync(ESPEAK_DIR);
    return (await isRealFile(MODEL_PATH)) && (await isRealFile(TOKENS_PATH)) && Boolean(espeak.exists);
  } catch {
    return false;
  }
}

export async function speakPersianLocally(text: string, rate = 1): Promise<boolean> {
  const normalizedText = text.trim();
  if (!normalizedText) return false;

  await stopCurrentPlayback();
  if (releaseRequested) return false;
  const token = activePlaybackToken;

  try {
    const audio = await runSerializedNativeOperation(async () => {
      if (releaseRequested) throw new Error('Persian TTS release is in progress.');
      const engine = await getEngine();
      return engine.generateSpeech(normalizedText, {
        sid: 0,
        speed: Math.min(1.35, Math.max(0.75, rate)),
      });
    });

    await ensureDirectory(PLAYBACK_DIR);
    const outputUri = `${PLAYBACK_DIR}response-${Date.now()}-${token}.wav`;
    const outputNativePath = nativeFilePath(outputUri);
    await saveAudioToFile(audio, outputNativePath);

    if (token !== activePlaybackToken || releaseRequested) {
      await FileSystem.deleteAsync(outputUri, { idempotent: true });
      return false;
    }

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

    await new Promise<void>((resolve, reject) => {
      const handleStatus = (status) => {
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
    await FileSystem.deleteAsync(outputUri, { idempotent: true });
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('[MYPA][LOCAL_TTS] Persian local TTS failed; caller may use fallback.', error);
    }
    await stopCurrentPlayback();
    return false;
  }
}

export async function stopLocalPersianTts(): Promise<void> {
  await stopCurrentPlayback();
}

export async function releaseLocalPersianTts(): Promise<void> {
  if (releaseRequested) return;
  releaseRequested = true;
  await stopCurrentPlayback();

  await runSerializedNativeOperation(async () => {
    const promise = enginePromise;
    if (!promise) return;
    try {
      const engine = await promise;
      await engine.destroy();
    } catch {
      // Best-effort native resource cleanup.
    } finally {
      if (enginePromise === promise) {
        enginePromise = null;
      }
    }
  });

  releaseRequested = false;
}

export const LOCAL_PERSIAN_TTS_MODEL = {
  version: MODEL_VERSION,
  locale: 'fa-IR',
  voice: 'ganji',
  quality: 'medium',
  archive: MODEL_ARCHIVE_NAME,
  modelFile: 'fa_IR-ganji-medium.onnx',
  tokensFile: 'tokens.txt',
  dataDir: 'espeak-ng-data',
};
