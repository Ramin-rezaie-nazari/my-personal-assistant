import { useEffect, useMemo, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getYogaCue, getYogaSession, startYogaCoach, tickYogaCoach, YogaCoachState, YogaSession } from '../lib/api';

export default function YogaScreen() {
  const [session, setSession] = useState<YogaSession | null>(null);
  const [state, setState] = useState<YogaCoachState | null>(null);
  const [cue, setCue] = useState('آماده‌ای؟ آرام شروع می‌کنیم.');
  const [loading, setLoading] = useState(true);
  const [trainingMode, setTrainingMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    void (async () => {
      const next = await getYogaSession(20, 'beginner', 'mobility');
      setSession(next);
      setState(await startYogaCoach(next));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!session || !state || state.phase === 'completed') return;
    const id = setInterval(() => {
      void (async () => {
        const next = await tickYogaCoach(session, state, 1);
        setState(next);
        const currentCue = await getYogaCue(next);
        if (currentCue?.text) setCue(currentCue.text);
      })();
    }, 1000);
    return () => clearInterval(id);
  }, [session, state]);

  const currentPose = useMemo(() => {
    if (!session || !state) return null;
    return session.steps[state.stepIndex] ?? null;
  }, [session, state]);

  if (loading || !session || !state) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }

  const handleTrainingMode = async () => {
    if (trainingMode) {
      setTrainingMode(false);
      return;
    }
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setTrainingMode(true);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <View>
          <Text style={styles.eyebrow}>YOGA COACH</Text>
          <Text style={styles.title}>آرام، پیوسته، با مربی</Text>
        </View>
        <Text style={styles.level}>{session.level}</Text>
      </View>

      <View style={styles.cameraStage}>
        {trainingMode ? (
          <CameraView style={styles.camera} facing="front" active />
        ) : (
          <View style={styles.previewFallback}>
            <Text style={styles.guideText}>TRAINING MODE</Text>
            <Text style={styles.guidePose}>{currentPose?.poseId.replaceAll('_', ' ') ?? 'ready'}</Text>
            <Text style={styles.guideHint}>وقتی آماده‌ای، حالت تمرین زنده را روشن کن.</Text>
          </View>
        )}

        {trainingMode ? (
          <View pointerEvents="none" style={styles.overlay}>
            <View style={styles.alignmentFrame} />
            <View style={styles.overlayTopRow}>
              <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
              <View style={styles.privacyPill}><Text style={styles.privacyText}>فقط روی دستگاه</Text></View>
            </View>
            <View style={styles.overlayBottom}>
              <Text style={styles.overlayPose}>{currentPose?.poseId.replaceAll('_', ' ') ?? 'ready'}</Text>
              <Text style={styles.overlayHint}>بدن خودت را در کادر نگه دار و با صدای مربی جلو برو.</Text>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.poseTitle}>{currentPose?.poseId.replaceAll('_', ' ') ?? 'Session complete'}</Text>
        <Text style={styles.phase}>{state.phase}</Text>
        <Text style={styles.timer}>
          {Math.floor(state.remainingSec / 60).toString().padStart(2, '0')}:{(state.remainingSec % 60).toString().padStart(2, '0')}
        </Text>
        <Text style={styles.cue}>{state.phase === 'completed' ? 'عالی بود. جلسه تمام شد.' : cue}</Text>
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.modeButton, trainingMode && styles.modeButtonActive]} onPress={() => void handleTrainingMode()}>
          <Text style={[styles.modeButtonText, trainingMode && styles.modeButtonTextActive]}>
            {trainingMode ? 'خاموش کردن دوربین' : 'شروع تمرین با دوربین'}
          </Text>
        </Pressable>
        <Pressable style={styles.nextButton} onPress={() => { if (session && state) void tickYogaCoach(session, { ...state, remainingSec: 0 }, 1); }}>
          <Text style={styles.nextText}>{state.phase === 'completed' ? 'پایان' : 'ادامه'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F2EC', padding: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.7, color: '#756C61' },
  title: { fontSize: 25, fontWeight: '900', color: '#1F1B17', marginTop: 5 },
  level: { backgroundColor: '#1F1B17', color: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, fontSize: 11, fontWeight: '800' },
  cameraStage: { flex: 1, marginTop: 18, borderRadius: 28, backgroundColor: '#D9D2C7', overflow: 'hidden', position: 'relative' },
  camera: { ...StyleSheet.absoluteFillObject },
  previewFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  guideText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#655A4E' },
  guidePose: { fontSize: 30, fontWeight: '900', marginTop: 12, textTransform: 'capitalize', color: '#1F1B17', textAlign: 'center' },
  guideHint: { fontSize: 12, color: '#655A4E', textAlign: 'center', marginTop: 10, lineHeight: 18 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 16 },
  alignmentFrame: { position: 'absolute', left: '18%', right: '18%', top: '12%', bottom: '13%', borderRadius: 80, borderWidth: 1.5, borderColor: '#FFFFFFAA' },
  overlayTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  livePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827AA', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14 },
  liveDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: '#F87171', marginRight: 6 },
  liveText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  privacyPill: { backgroundColor: '#111827AA', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14 },
  privacyText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  overlayBottom: { backgroundColor: '#111827B8', borderRadius: 18, padding: 14 },
  overlayPose: { color: '#FFF', fontSize: 18, fontWeight: '900', textTransform: 'capitalize' },
  overlayHint: { color: '#E5E7EB', marginTop: 5, fontSize: 11, lineHeight: 17 },
  card: { backgroundColor: '#FFFDF9', borderRadius: 24, padding: 20, marginTop: 16 },
  poseTitle: { fontSize: 22, fontWeight: '900', color: '#1F1B17', textTransform: 'capitalize' },
  phase: { fontSize: 11, color: '#8A7F73', fontWeight: '800', marginTop: 4, textTransform: 'uppercase' },
  timer: { fontSize: 44, fontWeight: '900', color: '#1F1B17', marginTop: 10 },
  cue: { fontSize: 16, lineHeight: 24, color: '#4C4339', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  modeButton: { flex: 1, minHeight: 54, borderRadius: 18, borderWidth: 1, borderColor: '#B8AEA2', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFDF9' },
  modeButtonActive: { backgroundColor: '#EFE9DF' },
  modeButtonText: { color: '#4C4339', fontSize: 13, fontWeight: '900' },
  modeButtonTextActive: { color: '#1F1B17' },
  nextButton: { flex: 0.8, backgroundColor: '#1F1B17', borderRadius: 18, minHeight: 54, alignItems: 'center', justifyContent: 'center' },
  nextText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
