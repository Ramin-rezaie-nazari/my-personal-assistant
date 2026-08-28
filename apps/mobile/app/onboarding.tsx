import { useEffect, useRef, useState } from 'react';
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
    titles: ['What is your main goal for food and exercise?', 'Where are you today?', 'How should your nutrition feel?', 'Where should I learn from?', 'How do you like to train?'],
    subtitles: ['Choose the outcome you want MYPA to help you work toward every day.', 'Your plan should match your current experience so it feels challenging, not overwhelming.', 'Your food plan should fit the way you already want to eat.', 'Local context helps recipes, routines and suggestions feel more natural.', 'Tell me your setup and available time so I can make workouts realistic.'],
    next: 'Continue', start: 'Meet my assistant', back: 'Back', required: 'Pick one to continue.',
    goalHint: 'This shapes both your nutrition and training recommendations.',
    fitnessHint: 'You can change this later as you progress.',
    dietHint: 'Nothing is permanent — MYPA can adapt with you.',
    countryHint: 'Used only to make recommendations feel more local.',
    equipment: 'Where will you train?', session: 'How much time do you usually have?',
  },
  fa: {
    eyebrow: 'MYPA را شخصی کن',
    titles: ['هدف اصلی‌ات از تغذیه و ورزش چیه؟', 'الان در چه سطحی هستی؟', 'تغذیه‌ات دوست داری چه مدلی باشه؟', 'از کجا با تو یاد بگیرم؟', 'چطور دوست داری تمرین کنی؟'],
    subtitles: ['انتخابت هم پیشنهادهای غذایی و هم برنامه تمرینی MYPA را شکل می‌دهد.', 'برنامه باید با سطح فعلی‌ات جور باشد؛ نه زیادی سخت و نه خسته‌کننده.', 'برنامه غذایی باید با سبک زندگی و انتخاب‌های خودت هماهنگ باشد.', 'این اطلاعات کمک می‌کند پیشنهادها و غذاها طبیعی‌تر و محلی‌تر باشند.', 'وسایل و زمانت را بگو تا تمرین‌هایی پیشنهاد بدهم که واقعاً شدنی باشند.'],
    next: 'ادامه', start: 'بریم سراغ MYPA', back: 'قبلی', required: 'برای ادامه یکی را انتخاب کن.',
    goalHint: 'این انتخاب هم روی تغذیه اثر می‌گذارد و هم روی تمرینات.',
    fitnessHint: 'هر وقت پیشرفت کردی می‌توانی بعداً تغییرش بدهی.',
    dietHint: 'هیچ‌چیز دائمی نیست؛ MYPA خودش را با تو هماهنگ می‌کند.',
    countryHint: 'فقط برای طبیعی‌تر و کاربردی‌تر شدن پیشنهادها استفاده می‌شود.',
    equipment: 'کجا تمرین می‌کنی؟', session: 'معمولاً چقدر برای تمرین وقت داری؟',
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
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.16, 0.08] });
  return (
    <View style={styles.auraWrap}>
      <Animated.View style={[styles.aura, { transform: [{ scale }], opacity }]} />
      <View style={styles.auraCore}><Text style={styles.auraMark}>✦</Text></View>
      <View style={styles.progressTrack}><View style={[styles.progressArc, { width: `${Math.round(progress * 100)}%` }]} /></View>
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
  const translateY = entry.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  const finish = async () => {
    if (!stepComplete) return;
    try { setBusy(true); await setOnboardingState({ ...state, completed: true }); router.replace('/'); }
    finally { setBusy(false); }
  };

  const goNext = () => { if (!stepComplete || busy) return; if (step === steps.length - 1) void finish(); else setStep((current) => current + 1); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, rtl && styles.rtl]}>
        <View style={styles.header}>
          <View style={styles.brandHeader}><BrandWordmark compact /></View>
          <View style={styles.counterPill}><Text style={styles.counter}>{step + 1}/{steps.length}</Text></View>
        </View>

        <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Aura progress={progress} />
            <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
            <Animated.View style={{ transform: [{ translateY }], opacity: entry }}>
              <Text style={styles.title}>{copy.titles[step]}</Text>
              <Text style={styles.subtitle}>{copy.subtitles[step]}</Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.card, { transform: [{ translateY }], opacity: entry }]}>
            {step === 0 ? <>
              <OptionGrid options={[
                ['fat_loss', rtl ? 'کاهش چربی و کاهش وزن' : 'Lose fat & weight'],
                ['body_sculpt', rtl ? 'خوش‌فرم شدن' : 'Get in shape'],
                ['strength', rtl ? 'عضله‌سازی و قدرت بیشتر' : 'Build muscle & strength'],
                ['general_fitness', rtl ? 'سلامت و تناسب اندام عمومی' : 'General fitness & health'],
              ]} value={state.goal} onSelect={(value) => update({ goal: value as OnboardingState['goal'] })} />
              <Text style={styles.helper}>{copy.goalHint}</Text>
            </> : null}

            {step === 1 ? <>
              <OptionGrid options={[
                ['beginner', rtl ? 'تازه‌کارم' : 'Beginner'],
                ['foundation', rtl ? 'پایه‌ام خوبه' : 'Foundation'],
                ['intermediate', rtl ? 'متوسط' : 'Intermediate'],
                ['advanced', rtl ? 'پیشرفته' : 'Advanced'],
              ]} value={state.fitnessLevel} onSelect={(value) => update({ fitnessLevel: value as OnboardingState['fitnessLevel'] })} />
              <Text style={styles.helper}>{copy.fitnessHint}</Text>
            </> : null}

            {step === 2 ? <>
              <OptionGrid options={[
                ['balanced', rtl ? 'متعادل و منعطف' : 'Balanced & flexible'],
                ['high_protein', rtl ? 'پروتئین بالا' : 'High protein'],
                ['vegetarian', rtl ? 'گیاهخواری' : 'Vegetarian'],
                ['vegan', rtl ? 'وگان' : 'Vegan'],
                ['halal', rtl ? 'حلال' : 'Halal'],
              ]} value={state.diet} onSelect={(value) => update({ diet: value as OnboardingState['diet'] })} />
              <Text style={styles.helper}>{copy.dietHint}</Text>
            </> : null}

            {step === 3 ? <>
              <OptionGrid options={[
                ['Iran', rtl ? 'ایران' : 'Iran'],
                ['United States', rtl ? 'آمریکا' : 'United States'],
                ['Spain', rtl ? 'اسپانیا' : 'Spain'],
                ['Turkey', rtl ? 'ترکیه' : 'Turkey'],
                ['Germany', rtl ? 'آلمان' : 'Germany'],
                ['United Kingdom', rtl ? 'بریتانیا' : 'United Kingdom'],
              ]} value={state.country} onSelect={(value) => update({ country: value })} />
              <Text style={styles.helper}>{copy.countryHint}</Text>
            </> : null}

            {step === 4 ? <>
              <Text style={styles.sectionLabel}>{copy.equipment}</Text>
              <OptionGrid options={[
                ['none', rtl ? 'بدون تجهیزات' : 'No equipment'],
                ['home', rtl ? 'تمرین در خانه' : 'Home setup'],
                ['gym', rtl ? 'باشگاه' : 'Gym'],
              ]} value={state.equipment} onSelect={(value) => update({ equipment: value as OnboardingState['equipment'] })} />
              <Text style={[styles.sectionLabel, styles.sectionSpacing]}>{copy.session}</Text>
              <OptionGrid options={[
                ['20', '20 min'],
                ['30', '30 min'],
                ['45', '45 min'],
                ['60', '60 min'],
              ]} value={String(state.sessionMinutes)} onSelect={(value) => update({ sessionMinutes: Number(value) as OnboardingState['sessionMinutes'] })} />
            </> : null}
          </Animated.View>
        </ScrollView>

        <View style={styles.bottomArea}>
          <Text style={[styles.ready, !stepComplete && styles.required]}>{stepComplete ? `✦ ${step === steps.length - 1 ? copy.start : copy.next}` : copy.required}</Text>
          <View style={styles.actions}>
            {step > 0 ? <Pressable onPress={() => setStep((current) => current - 1)} style={styles.secondary}><Text style={styles.secondaryText}>{copy.back}</Text></Pressable> : <View style={styles.secondaryPlaceholder} />}
            <Pressable disabled={busy || !stepComplete} onPress={goNext} style={({ pressed }) => [styles.primary, pressed && styles.pressed, (!stepComplete || busy) && styles.disabled]}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{step === steps.length - 1 ? copy.start : copy.next}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function OptionGrid({ options, value, onSelect }: { options: [string, string][]; value: string; onSelect: (value: string) => void }) {
  return <View style={styles.options}>{options.map(([key, label]) => <Pressable key={key} onPress={() => onSelect(key)} accessibilityRole="radio" accessibilityState={{ selected: key === value }} style={[styles.option, key === value && styles.optionSelected]}><View style={[styles.choiceDot, key === value && styles.choiceDotSelected]} /><View style={styles.optionCopy}><Text style={styles.optionTitle}>{label}</Text></View><Text style={styles.check}>{key === value ? '✓' : ''}</Text></Pressable>)}</View>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BRAND.colors.canvas}, container:{flex:1,paddingHorizontal:22,paddingTop:14}, rtl:{direction:'rtl'}, header:{height:46,position:'relative',alignItems:'center',justifyContent:'center'}, brandHeader:{position:'absolute',left:0,right:0,top:1,alignItems:'center',justifyContent:'center'}, counterPill:{position:'absolute',right:0,top:8,minWidth:42,height:30,paddingHorizontal:10,borderRadius:15,backgroundColor:BRAND.colors.surface,borderWidth:1,borderColor:BRAND.colors.border,alignItems:'center',justifyContent:'center'}, counter:{color:BRAND.colors.inkSoft,fontSize:11,fontWeight:'900'}, pageScroll:{flex:1}, pageContent:{paddingTop:8,paddingBottom:18}, hero:{alignItems:'center',paddingTop:4,paddingBottom:16}, auraWrap:{width:96,height:96,alignItems:'center',justifyContent:'center',marginBottom:12}, aura:{position:'absolute',width:96,height:96,borderRadius:30,backgroundColor:BRAND.colors.violet}, auraCore:{width:72,height:72,borderRadius:24,backgroundColor:BRAND.colors.startup,alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.14,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:4}, auraMark:{color:BRAND.colors.violet,fontSize:31}, progressTrack:{position:'absolute',left:3,right:3,bottom:0,height:4,backgroundColor:BRAND.colors.border,borderRadius:4,overflow:'hidden'}, progressArc:{height:4,backgroundColor:BRAND.colors.primary}, eyebrow:{color:BRAND.colors.primary,fontSize:10,fontWeight:'900',letterSpacing:1.5,textAlign:'center'}, title:{color:BRAND.colors.ink,fontSize:30,lineHeight:36,fontWeight:'900',textAlign:'center',marginTop:7}, subtitle:{color:BRAND.colors.muted,fontSize:13,lineHeight:20,textAlign:'center',marginTop:7,maxWidth:340}, card:{backgroundColor:BRAND.colors.surface,borderRadius:28,padding:16,borderWidth:1,borderColor:BRAND.colors.border,shadowColor:'#000',shadowOpacity:.05,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:2}, options:{gap:10}, option:{minHeight:58,borderRadius:18,borderWidth:1,borderColor:BRAND.colors.border,backgroundColor:BRAND.colors.surfaceElevated,paddingHorizontal:14,flexDirection:'row',alignItems:'center'}, optionSelected:{borderColor:BRAND.colors.primary,borderWidth:2,backgroundColor:BRAND.colors.primarySoft}, choiceDot:{width:13,height:13,borderRadius:7,borderWidth:1.5,borderColor:BRAND.colors.border,marginRight:12}, choiceDotSelected:{borderColor:BRAND.colors.primary,backgroundColor:BRAND.colors.primary}, optionCopy:{flex:1}, optionTitle:{color:BRAND.colors.ink,fontSize:15,fontWeight:'800'}, check:{color:BRAND.colors.primary,fontSize:20,fontWeight:'900',width:22,textAlign:'right'}, helper:{color:BRAND.colors.muted,fontSize:11,lineHeight:17,marginTop:12,textAlign:'center'}, sectionLabel:{color:BRAND.colors.inkSoft,fontSize:11,fontWeight:'900',marginBottom:9}, sectionSpacing:{marginTop:20}, bottomArea:{paddingTop:8,paddingBottom:10,gap:9,backgroundColor:BRAND.colors.canvas}, required:{color:BRAND.colors.primary,fontSize:11,fontWeight:'800',textAlign:'center'}, ready:{color:BRAND.colors.inkSoft,fontSize:11,fontWeight:'800',textAlign:'center'}, actions:{flexDirection:'row',gap:10,alignItems:'center'}, secondary:{minHeight:54,flex:.38,borderRadius:18,borderWidth:1,borderColor:BRAND.colors.border,alignItems:'center',justifyContent:'center',backgroundColor:BRAND.colors.surface}, secondaryPlaceholder:{flex:.38}, secondaryText:{color:BRAND.colors.inkSoft,fontWeight:'800'}, primary:{minHeight:54,flex:1,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:BRAND.colors.primary,shadowColor:BRAND.colors.primaryStrong,shadowOpacity:.16,shadowRadius:14,shadowOffset:{width:0,height:7},elevation:3}, primaryText:{color:'#fff',fontSize:15,fontWeight:'900'}, pressed:{opacity:.82}, disabled:{opacity:.5},
});
