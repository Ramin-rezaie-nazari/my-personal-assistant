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
const KHADIJAH_MODEL_ASSET_PATH = 'matcha-tts-fa_en-khadijah';
const KHADIJAH_VOCODER_ASSET_PATH = 'vocos-22khz-univ.onnx';
const PLAYBACK_DIR = `${FileSystem.cacheDirectory}mypa-tts/`;

let enginePromises: Record<string, Promise<TtsEngine> | null> = { ganji: null, khadijah: null };
let activeSound: Audio.Sound | null = null;
let activePlaybackToken = 0;
let resolvedModelPathPromises: Record<string, Promise<string> | null> = { ganji: null, khadijah: null };

function nativeFilePath(uri: string): string { return uri.startsWith('file://') ? uri.slice('file://'.length) : uri; }

async function removeDirectoryRecursive(dirPath: string): Promise<void> {
  const uri = dirPath.startsWith('file://') ? dirPath : `file://${dirPath}`;
  try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
}

async function resolveReadyBundledModel(kind: 'ganji' | 'khadijah'): Promise<string> {
  if (!resolvedModelPathPromises[kind]) {
    resolvedModelPathPromises[kind] = (async () => {
      const assetPath = kind === 'khadijah' ? KHADIJAH_MODEL_ASSET_PATH : SOURCE_MODEL_ASSET_PATH;
      let resolvedPath = await resolveModelPath({ type: 'asset', path: assetPath });
      const requiredFiles = kind === 'khadijah'
        ? [`${resolvedPath}/model.onnx`, `${resolvedPath}/tokens.txt`, `${resolvedPath}/espeak-ng-data/phontab`, `${resolvedPath}/espeak-ng-data/phonindex`]
        : [`${resolvedPath}/fa_IR-ganji-medium.onnx`, `${resolvedPath}/tokens.txt`, `${resolvedPath}/espeak-ng-data/phontab`, `${resolvedPath}/espeak-ng-data/phonindex`];
      const ready = (await Promise.all(requiredFiles.map((filePath) => exists(filePath)))).every(Boolean);
      if (!ready) {
        await removeDirectoryRecursive(resolvedPath);
        resolvedPath = await resolveModelPath({ type: 'asset', path: assetPath });
      }
      const finalRequiredFiles = kind === 'khadijah'
        ? [`${resolvedPath}/model.onnx`, `${resolvedPath}/tokens.txt`, `${resolvedPath}/espeak-ng-data/phontab`, `${resolvedPath}/espeak-ng-data/phonindex`]
        : [`${resolvedPath}/fa_IR-ganji-medium.onnx`, `${resolvedPath}/tokens.txt`, `${resolvedPath}/espeak-ng-data/phontab`, `${resolvedPath}/espeak-ng-data/phonindex`];
      const finalReady = (await Promise.all(finalRequiredFiles.map((filePath) => exists(filePath)))).every(Boolean);
      if (!finalReady) throw new Error(`Persian TTS model extraction incomplete at ${resolvedPath}`);
      return resolvedPath;
    })().catch((error) => { resolvedModelPathPromises[kind] = null; throw error; });
  }
  return resolvedModelPathPromises[kind]!;
}

async function ensureEngine(kind: 'ganji' | 'khadijah'): Promise<TtsEngine> {
  if (!enginePromises[kind]) {
    enginePromises[kind] = resolveReadyBundledModel(kind).then((resolvedPath) => {
      if (kind === 'khadijah') {
        return createTTS({
          modelPath: { type: 'asset', path: KHADIJAH_MODEL_ASSET_PATH },
          modelType: 'matcha',
          modelOptions: {
            matcha: {
              acousticModel: `${KHADIJAH_MODEL_ASSET_PATH}/model.onnx`,
              vocoder: KHADIJAH_VOCODER_ASSET_PATH,
              tokens: `${KHADIJAH_MODEL_ASSET_PATH}/tokens.txt`,
              dataDir: `${KHADIJAH_MODEL_ASSET_PATH}/espeak-ng-data`,
              noiseScale: 0.667,
              lengthScale: 1.0,
            },
          },
          numThreads: 2,
        });
      }
      return createTTS({
        modelPath: { type: 'file', path: resolvedPath },
        modelType: 'vits',
        numThreads: 2,
        modelOptions: { vits: { noiseScale: 0.667, lengthScale: 1.0, noiseScaleW: 0.8 } },
      });
    }).catch((error) => { enginePromises[kind] = null; throw error; });
  }
  return enginePromises[kind]!;
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
    const resolvedPath = await resolveReadyBundledModel('ganji');
    const result = await detectTtsModel({ type: 'file', path: resolvedPath }, { modelType: 'vits' });
    return Boolean(result.success && result.detectedModels.some((item) => item.type === 'vits'));
  } catch { return false; }
}

export async function speakPersianLocally(text: string, rate = 1, voiceId = 'ganji'): Promise<boolean> {
  const normalizedText = text.trim();
  if (!normalizedText) return false;
  await stopCurrentPlayback();
  const token = activePlaybackToken;
  const kind = voiceId === 'venus' ? 'khadijah' : 'ganji';
  try {
    if (__DEV__) console.warn('[MYPA][LOCAL_TTS]', JSON.stringify({ status: 'starting', provider: kind === 'khadijah' ? 'sherpa-onnx-matcha' : 'sherpa-onnx-piper', voiceId, model: kind === 'khadijah' ? 'khadijah' : MODEL_ARCHIVE_DIR }));
    const engine = await ensureEngine(kind);
    const audio = await engine.generateSpeech(normalizedText, { sid: 0, speed: Math.min(1.25, Math.max(0.8, rate)) });
    await FileSystem.makeDirectoryAsync(PLAYBACK_DIR, { intermediates: true });
    const outputUri = `${PLAYBACK_DIR}response-${Date.now()}-${token}.wav`;
    await saveAudioToFile(audio, nativeFilePath(outputUri));
    if (token !== activePlaybackToken) return false;
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false, shouldDuckAndroid: false });
    const { sound } = await Audio.Sound.createAsync({ uri: outputUri }, { shouldPlay: true, volume: 1.0 });
    activeSound = sound;
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
    if (__DEV__) console.warn('[MYPA][LOCAL_TTS]', JSON.stringify({ status: 'failed', provider: kind === 'khadijah' ? 'sherpa-onnx-matcha' : 'sherpa-onnx-piper', voiceId, error: error instanceof Error ? error.message : String(error) }));
    await stopCurrentPlayback();
    return false;
  }
}

export async function stopLocalPersianTts(): Promise<void> { await stopCurrentPlayback(); }

export async function releaseLocalPersianTts(): Promise<void> {
  await stopCurrentPlayback();
  for (const kind of ['ganji', 'khadijah'] as const) {
    const promise = enginePromises[kind];
    if (!promise) continue;
    try { const engine = await promise; await engine.destroy(); } catch {}
    finally { enginePromises[kind] = null; resolvedModelPathPromises[kind] = null; }
  }
}
