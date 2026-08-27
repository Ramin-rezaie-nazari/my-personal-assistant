import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppLocale, getLanguageOptions, getStoredLocale, isRTL, setStoredLocale, t } from '../lib/i18n';
import { colors, radius, spacing } from '../lib/design-system';
import { AnimatedIn, MotionPress } from '../lib/motion-components';

export default function LanguagePremiumScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getStoredLocale().then((stored) => {
      if (stored) setLocale(stored);
      setReady(true);
    });
  }, []);

  const choose = async (next: AppLocale) => {
    setLocale(next);
    await setStoredLocale(next);
  };

  const continueToApp = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await setStoredLocale(locale);
      router.replace('/auth');
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <View style={styles.loading}><View style={styles.core}><Text style={styles.coreGlyph}>◌</Text></View><ActivityIndicator color="#66DDB0" /></View>;
  const rtl = isRTL(locale);

  return <View style={[styles.screen, rtl && styles.rtl]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AnimatedIn><View style={styles.core}><Text style={styles.coreGlyph}>◌</Text></View></AnimatedIn>
      <AnimatedIn delay={70}><Text style={styles.eyebrow}>MYPA · VOICE-FIRST</Text><Text style={styles.title}>{t(locale, 'languageTitle')}</Text><Text style={styles.subtitle}>{t(locale, 'languageSubtitle')}</Text></AnimatedIn>
      <AnimatedIn delay={130}><View style={styles.panel}><Text style={styles.panelTitle}>{rtl ? 'زبانت را انتخاب کن' : 'Choose your language'}</Text><Text style={styles.panelHint}>{rtl ? 'این انتخاب روی گفتگو و صدای دستیار اثر می‌گذارد؛ اطلاعاتت مستقل می‌ماند.' : 'Your conversation and voice adapt to this choice. Your data stays independent.'}</Text>
        <View style={styles.options}>{getLanguageOptions().map((option) => { const selected = locale === option.code || (locale === 'fa' && option.code === 'fa-IR') || (locale === 'en' && option.code === 'en-US'); return <Pressable key={option.code} onPress={() => void choose(option.code)} style={[styles.option, selected && styles.selected]}><View style={[styles.code, selected && styles.codeSelected]}><Text style={[styles.codeText, selected && styles.codeTextSelected]}>{option.code}</Text></View><View style={styles.copy}><Text style={styles.optionTitle}>{option.label}</Text><Text style={styles.optionRegion}>{option.region}</Text></View><Text style={styles.check}>{selected ? '✓' : ''}</Text></Pressable>; })}</View>
      </View></AnimatedIn>
      <AnimatedIn delay={200}><MotionPress disabled={busy} onPress={() => void continueToApp()} style={styles.button}>{busy ? <ActivityIndicator color="#09110E" /> : <Text style={styles.buttonText}>{t(locale, 'continue')} →</Text>}</MotionPress></AnimatedIn>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#0C1110'},loading:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0C1110',gap:18},content:{padding:spacing.xl,paddingTop:56,paddingBottom:42,gap:18},rtl:{direction:'rtl'},core:{width:74,height:74,borderRadius:37,backgroundColor:'#13221C',borderWidth:1,borderColor:'#2D4B3E',alignItems:'center',justifyContent:'center',alignSelf:'center'},coreGlyph:{fontSize:40,color:'#67E0B0'},eyebrow:{color:'#66D8AC',fontSize:10,fontWeight:'900',letterSpacing:1.6,textAlign:'center'},title:{color:'#F5FBF8',fontSize:31,fontWeight:'900',textAlign:'center',marginTop:6},subtitle:{color:'#A8BBB3',fontSize:13,lineHeight:20,textAlign:'center',marginTop:7},panel:{backgroundColor:'#121A17',borderRadius:26,borderWidth:1,borderColor:'#1F2C27',padding:18},panelTitle:{color:'#F0F7F4',fontSize:18,fontWeight:'900'},panelHint:{color:'#8FA39B',fontSize:11,lineHeight:17,marginTop:5},options:{gap:9,marginTop:14},option:{flexDirection:'row',alignItems:'center',padding:12,borderRadius:16,backgroundColor:'#0F1513',borderWidth:1,borderColor:'#202C27'},selected:{borderColor:'#55C99A',backgroundColor:'#14241E'},code:{minWidth:56,alignItems:'center',paddingVertical:8,borderRadius:11,backgroundColor:'#19241F',marginRight:10},codeSelected:{backgroundColor:'#55C99A'},codeText:{color:'#90A49B',fontSize:10,fontWeight:'900'},codeTextSelected:{color:'#0B1410'},copy:{flex:1},optionTitle:{color:'#EFF7F3',fontSize:14,fontWeight:'900'},optionRegion:{color:'#7E928A',fontSize:10,marginTop:3},check:{color:'#69DCB0',fontSize:18,fontWeight:'900',width:24,textAlign:'right'},button:{minHeight:56,borderRadius:18,backgroundColor:'#55C99A',alignItems:'center',justifyContent:'center'},buttonText:{color:'#0B1410',fontWeight:'900',fontSize:15}
});
