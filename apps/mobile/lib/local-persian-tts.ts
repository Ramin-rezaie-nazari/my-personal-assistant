import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { createTTS, saveAudioToFile, type TtsEngine } from 'react-native-sherpa-onnx';

const MODEL_VERSION = '20260831-ganji-medium-v1';
const MODEL_DIR_NAME = `mypa-tts-${MODEL_VERSION}`;
const MODEL_BASE_URL =
  'https://huggingface.co/rhasspy/piper-voices/resolve/5b44ec7bab7c5822cfec48fbd5aa99db71a823d6/fa/fa_IR/ganji/medium';
const MODEL_FILE = 'fa_IR-ganji-medium.onnx';
const MODEL_CONFIG_FILE = 'fa_IR-ganji-medium.onnx.json';
const MODEL_DIR = `${FileSystem.documentDirectory}${MODEL_DIR_NAME}/`;
const MODEL_PATH = `${MODEL_DIR}${MODEL_FILE}`;
const MODEL_CONFIG_PATH = `${MODEL_DIR}${MODEL_CONFIG_FILE}`;
const PLAYBACK_DIR = `${FileSystem.cacheDirectory}mypa-tts/`;

let enginePromise: Promise<TtsEngine> | null = null;
let activeSound: Audio.Sound | null = null;
let activePlaybackToken = 0;

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

async function downloadFile(url: string, destination: string): Promise<void> {
  const existing = await isRealFile(destination);
  if (existing) return;

  const temporary = `${destination}.partial`;
  try {
    await FileSystem.deleteAsync(temporary, { idempotent: true });
  } catch {
    // Ignore stale partial-file cleanup failures.
  }

  try {
    await FileSystem.downloadAsync(url, temporary);
    const downloaded = await isRealFile(temporary);
    if (!downloaded) throw new Error(`TTS model download was empty: ${url}`);
    await FileSystem.moveAsync({ from: temporary, to: destination });
  } catch (error) {
    try {
      await FileSystem.deleteAsync(temporary, { idempotent: true });
    } catch {
      // Best-effort cleanup.
    }
    throw error;
  }
}

async function ensurePersianModel(): Promise<string> {
  await ensureDirectory(MODEL_DIR);
  await downloadFile(`${MODEL_BASE_URL}/${MODEL_FILE}?download=true`, MODEL_PATH);
  await downloadFile(
    `${MODEL_BASE_URL}/${MODEL_CONFIG_FILE}?download=true`,
    MODEL_CONFIG_PATH,
  );
  return MODEL_DIR;
}

async function getEngine(): Promise<TtsEngine> {
  if (!enginePromise) {
    enginePromise = (async () => {
      const modelDir = await ensurePersianModel();
      return createTTS({
        modelPath: { type: 'file', path: modelDir },
        modelType: 'vits',
        numThreads: 2,
        modelOptions: {
          vits: {
            noiseScale: 0.667,
            lengthScale: 1.02,
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
  if (!FileSystem.documentDirectory) return false;
  try {
    const modelDir = await ensurePersianModel();
    return Boolean(modelDir) && (await isRealFile(MODEL_PATH)) && (await isRealFile(MODEL_CONFIG_PATH));
  } catch {
    return false;
  }
}

export async function speakPersianLocally(text: string, rate = 1): Promise<boolean> {
  const normalizedText = text.trim();
  if (!normalizedText) return false;

  await stopCurrentPlayback();
  const token = activePlaybackToken;

  try {
    const engine = await getEngine();
    const audio = await engine.generateSpeech(normalizedText, {
      sid: 0,
      speed: Math.min(1.35, Math.max(0.75, rate)),
    });

    await ensureDirectory(PLAYBACK_DIR);
    const outputPath = `${PLAYBACK_DIR}response-${Date.now()}-${token}.wav`;
    await saveAudioToFile(audio, outputPath);

    if (token !== activePlaybackToken) return false;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: outputPath },
      { shouldPlay: true, volume: 1.0 },
    );
    activeSound = sound;

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
      await FileSystem.deleteAsync(outputPath, { idempotent: true });
    } catch {
      // Cache cleanup is best-effort.
    }
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
  version: MODEL_VERSION,
  locale: 'fa-IR',
  voice: 'ganji',
  quality: 'medium',
  modelFile: MODEL_FILE,
  modelConfigFile: MODEL_CONFIG_FILE,
};
