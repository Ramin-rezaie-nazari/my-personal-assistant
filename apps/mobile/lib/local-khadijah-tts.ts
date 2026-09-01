import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { exists } from '@dr.pogodin/react-native-fs';
import {
  createTTS,
  detectTtsModel,
  saveAudioToFile,
  type TtsEngine,
} from 'react-native-sherpa-onnx/tts';
import { resolveModelPath } from 'react-native-sherpa-onnx';

const MODEL_ASSET_PATH = 'matcha-tts-fa_en-khadijah';
const MODEL_FILE = 'model.onnx';
const TOKENS_FILE = 'tokens.txt';
const VOCODER_FILE = 'vocos-22khz-univ.onnx';
const DATA_DIR = 'espeak-ng-data';
const PLAYBACK_DIR = `${FileSystem.cacheDirectory}mypa-tts/`;

let enginePromise: Promise<TtsEngine> | null = null;
let activeSound: Audio.Sound | null = null;
let activePlaybackToken = 0;
let resolvedModelPathPromise: Promise<string> | null = null;

function nativeFilePath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

async function stopCurrentPlayback(): Promise<void> {
  activePlaybackToken += 1;
  const sound = activeSound;
  activeSound = null;
  if (!sound) return;
  try { await sound.stopAsync(); } catch {}
  try { await sound.unloadAsync(); } catch {}
}

async function resolveReadyModel(): Promise<string> {
  if (!resolvedModelPathPromise) {
    resolvedModelPathPromise = (async () => {
      const resolvedPath = await resolveModelPath({ type: 'asset', path: MODEL_ASSET_PATH });
      const requiredFiles = [
        `${resolvedPath}/${MODEL_FILE}`,
        `${resolvedPath}/${TOKENS_FILE}`,
        `${resolvedPath}/${VOCODER_FILE}`,
        `${resolvedPath}/${DATA_DIR}/phontab`,
        `${resolvedPath}/${DATA_DIR}/phonindex`,
      ];
      const ready = (await Promise.all(requiredFiles.map((filePath) => exists(filePath)))).every(Boolean);
      if (!ready) throw new Error(`Khadijah Matcha assets are incomplete at ${resolvedPath}`);
      return resolvedPath;
    })().catch((error) => {
      resolvedModelPathPromise = null;
      throw error;
    });
  }
  return resolvedModelPathPromise;
}

async function ensureEngine(): Promise<TtsEngine> {
  if (!enginePromise) {
    enginePromise = resolveReadyModel().then((modelPath) => createTTS({
      modelPath: { type: 'file', path: modelPath },
      modelType: 'matcha',
      numThreads: 2,
      modelOptions: {
        matcha: {
          acousticModel: `${modelPath}/${MODEL_FILE}`,
          vocoder: `${modelPath}/${VOCODER_FILE}`,
          tokens: `${modelPath}/${TOKENS_FILE}`,
          dataDir: `${modelPath}/${DATA_DIR}`,
          lengthScale: 1.0,
        },
      },
    })).catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

export async function isKhadijahTtsAvailable(): Promise<boolean> {
  try {
    const modelPath = await resolveReadyModel();
    const result = await detectTtsModel(
      { type: 'file', path: modelPath },
      { modelType: 'matcha' },
    );
    if (__DEV__) console.warn('[MYPA][KHADIJAH_TTS_STATUS]', JSON.stringify(result));
    return Boolean(result.success && result.detectedModels.some((item) => item.type === 'matcha'));
  } catch (error) {
    if (__DEV__) console.warn('[MYPA][KHADIJAH_TTS_STATUS]', error);
    return false;
  }
}

export async function speakKhadijahLocally(text: string, rate = 1): Promise<boolean> {
  const normalizedText = text.trim();
  if (!normalizedText) return false;
  await stopCurrentPlayback();
  const token = activePlaybackToken;

  try {
    const engine = await ensureEngine();
    const audio = await engine.generateSpeech(normalizedText, {
      speed: Math.min(1.2, Math.max(0.82, rate)),
    });

    await FileSystem.makeDirectoryAsync(PLAYBACK_DIR, { intermediates: true });
    const outputUri = `${PLAYBACK_DIR}khadijah-${Date.now()}-${token}.wav`;
    await saveAudioToFile(audio, nativeFilePath(outputUri));
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
      console.warn('[MYPA][KHADIJAH_TTS]', JSON.stringify({
        status: 'playing',
        model: MODEL_ASSET_PATH,
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
    try { await FileSystem.deleteAsync(outputUri, { idempotent: true }); } catch {}
    return true;
  } catch (error) {
    if (__DEV__) console.warn('[MYPA][KHADIJAH_TTS]', JSON.stringify({
      status: 'failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    await stopCurrentPlayback();
    return false;
  }
}

export async function stopKhadijahTts(): Promise<void> {
  await stopCurrentPlayback();
}
