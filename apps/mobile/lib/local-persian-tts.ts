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

const MODEL_ARCHIVE_DIR = 'vits-piper-fa_IR-ganji-medium-v4';
const SOURCE_MODEL_ASSET_PATH = 'vits-piper-fa_IR-ganji-medium';
const MODEL_ASSET_PATH = SOURCE_MODEL_ASSET_PATH;
const PLAYBACK_DIR = `${FileSystem.cacheDirectory}mypa-tts/`;

let enginePromise: Promise<TtsEngine> | null = null;
let activeSound: Audio.Sound | null = null;
let activePlaybackToken = 0;
let resolvedModelPathPromise: Promise<string> | null = null;

function nativeFilePath(uri: string): string {
  return uri.startsWith('file://') ? uri.slice('file://'.length) : uri;
}

async function removeDirectoryRecursive(dirPath: string): Promise<void> {
  const uri = dirPath.startsWith('file://') ? dirPath : `file://${dirPath}`;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // Best-effort cleanup; resolver will report if re-extraction still fails.
  }
}

async function resolveReadyBundledModel(): Promise<string> {
  if (!resolvedModelPathPromise) {
    resolvedModelPathPromise = (async () => {
      let resolvedPath = await resolveModelPath({ type: 'asset', path: MODEL_ASSET_PATH });
      const requiredFiles = [
        `${resolvedPath}/fa_IR-ganji-medium.onnx`,
        `${resolvedPath}/tokens.txt`,
        `${resolvedPath}/espeak-ng-data/phontab`,
        `${resolvedPath}/espeak-ng-data/phonindex`,
      ];
      const ready = (await Promise.all(requiredFiles.map((filePath) => exists(filePath)))).every(Boolean);

      if (!ready) {
        await removeDirectoryRecursive(resolvedPath);
        resolvedPath = await resolveModelPath({ type: 'asset', path: MODEL_ASSET_PATH });
      }

      const finalRequiredFiles = [
        `${resolvedPath}/fa_IR-ganji-medium.onnx`,
        `${resolvedPath}/tokens.txt`,
        `${resolvedPath}/espeak-ng-data/phontab`,
        `${resolvedPath}/espeak-ng-data/phonindex`,
      ];
      const finalReady = (await Promise.all(finalRequiredFiles.map((filePath) => exists(filePath)))).every(Boolean);
      if (!finalReady) {
        throw new Error(`Persian TTS model extraction incomplete at ${resolvedPath}`);
      }
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
    enginePromise = resolveReadyBundledModel().then((resolvedPath) => createTTS({
      modelPath: { type: 'file', path: resolvedPath },
      modelType: 'vits',
      numThreads: 2,
      modelOptions: {
        vits: {
          noiseScale: 0.667,
          lengthScale: 1.0,
          noiseScaleW: 0.8,
        },
      },
    })).catch((error) => {
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
  try { await sound.stopAsync(); } catch {}
  try { await sound.unloadAsync(); } catch {}
}

export async function isLocalPersianTtsAvailable(): Promise<boolean> {
  try {
    const resolvedPath = await resolveReadyBundledModel();
    const result = await detectTtsModel({ type: 'file', path: resolvedPath }, { modelType: 'vits' });
    if (__DEV__) console.warn('[MYPA][LOCAL_TTS_STATUS]', JSON.stringify(result));
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
    if (__DEV__) console.warn('[MYPA][LOCAL_TTS]', JSON.stringify({ status: 'starting', provider: 'sherpa-onnx-piper', model: MODEL_ARCHIVE_DIR }));
    const engine = await ensureEngine();
    const audio = await engine.generateSpeech(normalizedText, { sid: 0, speed: Math.min(1.25, Math.max(0.8, rate)) });
    await FileSystem.makeDirectoryAsync(PLAYBACK_DIR, { intermediates: true });
    const outputUri = `${PLAYBACK_DIR}response-${Date.now()}-${token}.wav`;
    await saveAudioToFile(audio, nativeFilePath(outputUri));
    if (token !== activePlaybackToken) return false;
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false, shouldDuckAndroid: false });
    const { sound } = await Audio.Sound.createAsync({ uri: outputUri }, { shouldPlay: true, volume: 1.0 });
    activeSound = sound;
    if (__DEV__) console.warn('[MYPA][LOCAL_TTS]', JSON.stringify({ status: 'playing', provider: 'sherpa-onnx-piper', model: MODEL_ARCHIVE_DIR, sampleRate: audio.sampleRate, samples: audio.samples.length }));
    await new Promise<void>((resolve, reject) => {
      const handleStatus = (status: Audio.AVPlaybackStatus) => {
        if (!status.isLoaded) { if (status.error) reject(new Error(status.error)); return; }
        if (status.didJustFinish) resolve();
      };
      sound.setOnPlaybackStatusUpdate(handleStatus);
    });
    if (activeSound === sound) activeSound = null;
    await sound.unloadAsync();
    try { await FileSystem.deleteAsync(outputUri, { idempotent: true }); } catch {}
    return true;
  } catch (error) {
    if (__DEV__) console.warn('[MYPA][LOCAL_TTS]', JSON.stringify({ status: 'failed', provider: 'sherpa-onnx-piper', model: MODEL_ARCHIVE_DIR, error: error instanceof Error ? error.message : String(error) }));
    await stopCurrentPlayback();
    return false;
  }
}

export async function stopLocalPersianTts(): Promise<void> { await stopCurrentPlayback(); }

export async function releaseLocalPersianTts(): Promise<void> {
  await stopCurrentPlayback();
  if (!enginePromise) return;
  try { const engine = await enginePromise; await engine.destroy(); } catch {}
  finally { enginePromise = null; resolvedModelPathPromise = null; }
}

export const LOCAL_PERSIAN_TTS_MODEL = {
  version: '20260831-sherpa-piper-fa-ganji-medium-bundled-v4',
  locale: 'fa-IR',
  voice: 'ganji',
  quality: 'medium',
  archive: MODEL_ARCHIVE_DIR,
  modelFile: 'fa_IR-ganji-medium.onnx',
  tokensFile: 'tokens.txt',
  dataDir: 'espeak-ng-data',
};
