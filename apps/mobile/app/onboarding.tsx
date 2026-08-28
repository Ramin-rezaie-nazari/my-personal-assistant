import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import type { AppLocale } from '../lib/i18n';
import { getStoredLocale } from '../lib/i18n';
import { DEFAULT_ONBOARDING, OnboardingState, setOnboardingState } from '../lib/onboarding';
import { BRAND } from '../lib/branding';
import { BrandWordmark } from '../components/BrandWordmark';

const steps = [0, 1, 2, 3, 4] as const;

const COPY = {
  en: {
    eyebrow: 'MAKE MYPA YOURS',
    titles: ['What matters most right now?', 'Where are you today?', 'How should food feel?', 'Where should I learn from?', 'How do you like to move?'],
    subtitles: ['I’ll tune the assistant around the thing you care about most.', 'Your plans will adapt to your current experience, not the other way around.', 'Your recommendations should fit your preferences instead of fighting them.', 'Local context helps meals, routines and suggestions feel more natural.', 'Your available time and setup shape what I suggest next.'],
    next: 'Continue', start: 'Meet my assistant', back: 'Back', saving: 'Setting things up…', required: 'Pick one to continue.',
  },
  fa: {
    eyebrow: 'MYPA را شخصی کن',
    titles: ['الان بیشتر از همه چی برات مهمه؟', 'الان در چه سطحی هستی؟', 'غذا باید چه حسی داشته باشه؟', 'از کجا با تو یاد بگیرم؟', 'چطور دوست داری تمرین کنی؟'],
    subtitles: ['دستیار را حول چیزی تنظیم می‌کنم که بیشتر از همه برایت مهم است.', 'برنامه‌ها با شرایط فعلی تو هماهنگ می‌شوند، نه برعکس.', 'پیشنهادهای غذایی باید با سلیقه‌ات جور باشند، نه اینکه اذیتت کنند.', 'زمینه محلی کمک می‌کند پیشنهادها طبیعی‌تر و کاربردی‌تر باشند.', 'زمان و امکاناتت روی پیشنهادهای بعدی اثر می‌گذارند.'],
    next: 'ادامه', start: 'بریم سراغ MYPA', back: 'قبلی', saving: 'دارم همه‌چیز را تنظیم می‌کنم…', required: 'برای ادامه یکی را انتخاب کن.',
  },
} as const;

function Aura({ progress }: { progress: number }) {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.08] });
  return (
    <View style={styles.auraWrap}>
      <Animated.View style={[styles.aura, { transform: [{ scale }], opacity }]} />
      <View style={styles.auraCore}><Text style={styles.auraMark}>✦</Text></View>
      <View style={styles.progressRing}><View style={[styles.progressArc, { width: `${Math.round(progress * 100)}%` }]} /></View>
    </View>
  );
}

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<OnboardingState>(DEFAULT_ONBOARDING);
  const [locale, setLocale] = useState<AppLocale>('en');
  const [busy, setBusy] = useState(false);
  const entry = useRef(new Animated.Value(0)).current;

  useEffect(() => { void getStoredLocale().then((value) => { if (value) setLocale(value); }); }, []);
  useEffect(() => {
    entry.setValue(0);
    Animated.spring(entry, { toValue: 1, tension: 65, friction: 9, useNativeDriver: true }).start();
  }, [step, entry]);

  const rtl = locale === 'fa' || locale.startsWith('fa-');
  const copy = COPY[rtl ? 'fa' : 'en'];
  const update = (patch: Partial<OnboardingState>) => setState((current) => ({ ...current, ...patch }));
  const stepComplete = step === 0 ? Boolean(state.goal) : step === 1 ? Boolean(state.fitnessLevel) : step === 2 ? Boolean(state.diet) : step === 3 ? state.country.trim().length > 0 : Boolean(state.equipment) && Number(state.sessionMinutes) > 0;
  const progress = (step + (stepComplete ? 1 : 0)) / steps.length;
  const translateY = entry.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });

  const finish = async () => {
    if (!stepComplete) return;
    try { setBusy(true); await setOnboardingState({ ...state, completed: true }); router.replace('/'); }
    finally { setBusy(false); }
  };

  const goNext = () => { if (!stepComplete || busy) return; if (step === steps.length - 1) void finish(); else setStep((current) => current + 1); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, rtl && styles.rtl]}>
        <View style={styles.header}><BrandWordmark compact /><Text style={styles.counter}>{step + 1}/{steps.length}</Text></View>
        <View style={styles.hero}><Aura progress={progress} /><Text style={styles.eyebrow}>{copy.eyebrow}</Text><Animated.View style={{ transform: [{ translateY }], opacity: entry }}><Text style={styles.title}>{copy.titles[step]}</Text><Text style={styles.subtitle}>{copy.subtitles[step]}</Text></Animated.View></View>
        <Animated.View style={[styles.card, { transform: [{ translateY }], opacity: entry }]}>
          <ScrollView contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {step === 0 ? <OptionGrid options={[[ 'fat_loss', rtl ? 'کاهش چربی' : 'Fat loss' ], [ 'body_sculpt', rtl ? 'خوش‌فرم شدن' : 'Body sculpt' ], [ 'strength', rtl ? 'قدرت بیشتر' : 'Build strength' ], [ 'general_fitness', rtl ? 'سلامت عمومی' : 'General fitness' ]]} value={state.goal} onSelect={(value) => update({ goal: value as OnboardingState['goal'] })} /> : null}
            {step === 1 ? <OptionGrid options={[[ 'beginner', rtl ? 'تازه‌کار' : 'Beginner' ], [ 'foundation', rtl ? 'پایه' : 'Foundation' ], [ 'intermediate', rtl ? 'متوسط' : 'Intermediate' ], [ 'advanced', rtl ? 'پیشرفته' : 'Advanced' ]]} value={state.fitnessLevel} onSelect={(value) => update({ fitnessLevel: value as OnboardingState['fitnessLevel'] })} /> : null}
            {step === 2 ? <OptionGrid options={[[ 'balanced', rtl ? 'متعادل' : 'Balanced' ], [ 'high_protein', rtl ? 'پروتئین بالا' : 'High protein' ], [ 'vegetarian', rtl ? 'گیاهخواری' : 'Vegetarian' ], [ 'vegan', rtl ? 'وگان' : 'Vegan' ], [ 'halal', rtl ? 'حلال' : 'Halal' ]]} value={state.diet} onSelect={(value) => update({ diet: value as OnboardingState['diet'] })} /> : null}
            {step === 3 ? <OptionGrid options={[[ 'Iran', rtl ? 'ایران' : 'Iran' ], [ 'United States', rtl ? 'آمریکا' : 'United States' ], [ 'Spain', rtl ? 'اسپانیا' : 'Spain' ], [ 'Turkey', rtl ? 'ترکیه' : 'Turkey' ], [ 'Germany', rtl ? 'آلمان' : 'Germany' ], [ 'United Kingdom', rtl ? 'بریتانیا' : 'United Kingdom' ]]} value={state.country} onSelect={(value) => update({ country: value })} /> : null}
            {step === 4 ? <><Text style={styles.sectionLabel}>{rtl ? 'امکانات' : 'Equipment'}</Text><OptionGrid options={[[ 'none', rtl ? 'بدون تجهیزات' : 'No equipment' ], [ 'home', rtl ? 'در خانه' : 'Home setup' ], [ 'gym', rtl ? 'باشگاه' : 'Gym' ]]} value={state.equipment} onSelect={(value) => update({ equipment: value as OnboardingState['equipment'] })} /><Text style={[styles.sectionLabel, styles.sectionSpacing]}>{rtl ? 'مدت تمرین' : 'Session length'}</Text><OptionGrid options={[[ '20', '20 min' ], [ '30', '30 min' ], [ '45', '45 min' ], [ '60', '60 min' ]]} value={String(state.sessionMinutes)} onSelect={(value) => update({ sessionMinutes: Number(value) as OnboardingState['sessionMinutes'] })} /></> : null}
          </ScrollView>
        </Animated.View>
        {!stepComplete ? <Text style={styles.required}>{copy.required}</Text> : <Text style={styles.ready}>{step === steps.length - 1 ? '✦ ' + copy.start : '✦ ' + copy.next}</Text>}
        <View style={styles.actions}>{step > 0 ? <Pressable onPress={() => setStep((current) => current - 1)} style={styles.secondary}><Text style={styles.secondaryText}>{copy.back}</Text></Pressable> : <View style={styles.secondaryPlaceholder} />}<Pressable disabled={busy || !stepComplete} onPress={goNext} style={({ pressed }) => [styles.primary, pressed && styles.pressed, (!stepComplete || busy) && styles.disabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{step === steps.length - 1 ? copy.start : copy.next}</Text>}</Pressable></View>
      </View>
    </SafeAreaView>
  );
}

function OptionGrid({ options, value, onSelect }: { options: [string, string][]; value: string; onSelect: (value: string) => void }) {
  return <View style={styles.options}>{options.map(([key, label]) => <Pressable key={key} onPress={() => onSelect(key)} accessibilityRole="radio" accessibilityState={{ selected: key === value }} style={[styles.option, key === value && styles.optionSelected]}><View style={[styles.choiceDot, key === value && styles.choiceDotSelected]} /><View style={styles.optionCopy}><Text style={styles.optionTitle}>{label}</Text></View><Text style={styles.check}>{key === value ? '✓' : ''}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BRAND.colors.canvas}, container:{flex:1,padding:24,gap:12}, rtl:{direction:'rtl'}, header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, counter:{color:BRAND.colors.muted,fontSize:12,fontWeight:'900'}, hero:{alignItems:'flex-start',paddingTop:8}, auraWrap:{width:92,height:92,alignSelf:'center',alignItems:'center',justifyContent:'center',marginBottom:12}, aura:{position:'absolute',width:92,height:92,borderRadius:46,backgroundColor:BRAND.colors.primary}, auraCore:{width:64,height:64,borderRadius:22,backgroundColor:BRAND.colors.ink,alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.18,shadowRadius:18,shadowOffset:{width:0,height:8}}, auraMark:{color:BRAND.colors.white,fontSize:28}, progressRing:{position:'absolute',left:0,right:0,bottom:0,height:4,backgroundColor:BRAND.colors.border,borderRadius:4,overflow:'hidden'}, progressArc:{height:4,backgroundColor:BRAND.colors.primary}, eyebrow:{color:BRAND.colors.primary,fontSize:10,fontWeight:'900',letterSpacing:1.6}, title:{color:BRAND.colors.ink,fontSize:31,lineHeight:37,fontWeight:'900',marginTop:5}, subtitle:{color:BRAND.colors.muted,fontSize:14,lineHeight:21,marginTop:7}, card:{backgroundColor:BRAND.colors.surface,borderRadius:BRAND.radius.card,padding:15,borderWidth:1,borderColor:BRAND.colors.border,flex:1,overflow:'hidden'}, cardContent:{paddingBottom:4}, options:{gap:9}, option:{minHeight:55,borderRadius:18,borderWidth:1,borderColor:BRAND.colors.border,backgroundColor:BRAND.colors.surface,paddingHorizontal:14,flexDirection:'row',alignItems:'center'}, optionSelected:{borderColor:BRAND.colors.primary,borderWidth:2,backgroundColor:BRAND.colors.primarySoft}, choiceDot:{width:12,height:12,borderRadius:6,borderWidth:1.5,borderColor:BRAND.colors.border,marginRight:12}, choiceDotSelected:{borderColor:BRAND.colors.primary,backgroundColor:BRAND.colors.primary}, optionCopy:{flex:1}, optionTitle:{color:BRAND.colors.ink,fontSize:15,fontWeight:'800'}, check:{color:BRAND.colors.primary,fontSize:19,fontWeight:'900'}, sectionLabel:{color:BRAND.colors.inkSoft,fontSize:11,fontWeight:'900',marginBottom:8}, sectionSpacing:{marginTop:17}, required:{color:BRAND.colors.primary,fontSize:11,fontWeight:'800'}, ready:{color:BRAND.colors.inkSoft,fontSize:11,fontWeight:'800'}, actions:{flexDirection:'row',gap:10,alignItems:'center'}, secondary:{minHeight:54,flex:.38,borderRadius:18,borderWidth:1,borderColor:BRAND.colors.border,alignItems:'center',justifyContent:'center',backgroundColor:BRAND.colors.surface}, secondaryPlaceholder:{flex:.38}, secondaryText:{color:BRAND.colors.inkSoft,fontWeight:'800'}, primary:{minHeight:54,flex:1,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:BRAND.colors.primary}, primaryText:{color:'#fff',fontSize:15,fontWeight:'900'}, pressed:{opacity:.82}, disabled:{opacity:.5}
});