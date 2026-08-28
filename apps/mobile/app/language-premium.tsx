import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppLocale, getLanguageOptions, getStoredLocale, isRTL, setStoredLocale, t } from '../lib/i18n';
import { BRAND } from '../lib/branding';
import { BrandWordmark } from '../components/BrandWordmark';
import { MotionPress } from '../lib/motion-components';

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

  if (!ready) {
    return (
      <View style={styles.loading}>
        <View style={styles.loadingMark}><Text style={styles.spark}>✦</Text></View>
        <ActivityIndicator color={BRAND.colors.primary} />
      </View>
    );
  }

  const rtl = isRTL(locale);

  return (
    <View style={[styles.screen, rtl && styles.rtl]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.brandHeader}>
          <BrandWordmark compact />
        </View>

        <View style={styles.hero}>
          <View style={styles.orbWrap}>
            <View style={styles.orbGlow} />
            <View style={styles.orb}><Text style={styles.orbSpark}>✦</Text></View>
          </View>
          <Text style={styles.eyebrow}>MYPA · PERSONAL ASSISTANT</Text>
          <Text style={styles.title}>{t(locale, 'languageTitle')}</Text>
          <Text style={styles.subtitle}>{t(locale, 'languageSubtitle')}</Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelTitle}>{rtl ? 'زبانت را انتخاب کن' : 'Choose your language'}</Text>
            <View style={styles.panelPill}><Text style={styles.panelPillText}>∞</Text></View>
          </View>
          <Text style={styles.panelHint}>{rtl ? 'زبان گفتگو و صدای دستیار بر اساس این انتخاب تنظیم می‌شود.' : 'Conversation, voice and guidance will follow this choice.'}</Text>

          <View style={styles.options}>
            {getLanguageOptions().map((option) => {
              const selected = locale === option.code || (locale === 'fa' && option.code === 'fa-IR') || (locale === 'en' && option.code === 'en-US');
              return (
                <Pressable
                  key={option.code}
                  onPress={() => void choose(option.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={[styles.option, selected && styles.selected]}
                >
                  <View style={[styles.code, selected && styles.codeSelected]}>
                    <Text style={[styles.codeText, selected && styles.codeTextSelected]}>{option.code === 'fa-IR' ? 'فا' : option.code === 'en-US' ? 'EN' : option.code.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.optionTitle}>{option.label}</Text>
                    <Text style={styles.optionRegion}>{option.region}</Text>
                  </View>
                  <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerHint}>{rtl ? 'می‌توانی بعداً از تنظیمات زبان را تغییر بدهی.' : 'You can change your language later in Settings.'}</Text>
          <MotionPress disabled={busy} onPress={() => void continueToApp()} style={styles.button}>
            {busy ? <ActivityIndicator color={BRAND.colors.white} /> : <Text style={styles.buttonText}>{t(locale, 'continue')} <Text style={styles.buttonArrow}>→</Text></Text>}
          </MotionPress>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:BRAND.colors.canvas},loading:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:BRAND.colors.canvas,gap:18},loadingMark:{width:72,height:72,borderRadius:23,backgroundColor:BRAND.colors.primary,alignItems:'center',justifyContent:'center'},spark:{color:BRAND.colors.white,fontSize:30},content:{paddingHorizontal:24,paddingTop:24,paddingBottom:34,gap:22},rtl:{direction:'rtl'},brandHeader:{alignItems:'center',justifyContent:'center'},hero:{alignItems:'center',paddingTop:4},orbWrap:{width:104,height:104,alignItems:'center',justifyContent:'center',marginBottom:14},orbGlow:{position:'absolute',width:104,height:104,borderRadius:32,backgroundColor:BRAND.colors.violet,opacity:.22,transform:[{scale:1.08}]},orb:{width:78,height:78,borderRadius:25,backgroundColor:BRAND.colors.startup,alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:.14,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:5},orbSpark:{color:BRAND.colors.violet,fontSize:31},eyebrow:{color:BRAND.colors.primary,fontSize:10,fontWeight:'900',letterSpacing:1.4,textAlign:'center'},title:{color:BRAND.colors.ink,fontSize:32,lineHeight:38,fontWeight:'900',textAlign:'center',marginTop:7},subtitle:{color:BRAND.colors.muted,fontSize:14,lineHeight:21,textAlign:'center',marginTop:7,maxWidth:330},panel:{backgroundColor:BRAND.colors.surface,borderRadius:28,borderWidth:1,borderColor:BRAND.colors.border,padding:18,shadowColor:'#000',shadowOpacity:.06,shadowRadius:20,shadowOffset:{width:0,height:8},elevation:2},panelHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},panelTitle:{color:BRAND.colors.ink,fontSize:18,fontWeight:'900'},panelPill:{width:30,height:30,borderRadius:15,backgroundColor:BRAND.colors.primarySoft,alignItems:'center',justifyContent:'center'},panelPillText:{color:BRAND.colors.primary,fontSize:18,fontWeight:'900'},panelHint:{color:BRAND.colors.muted,fontSize:11,lineHeight:17,marginTop:5},options:{gap:10,marginTop:16},option:{flexDirection:'row',alignItems:'center',padding:13,borderRadius:18,backgroundColor:BRAND.colors.surfaceElevated,borderWidth:1,borderColor:BRAND.colors.border},selected:{borderColor:BRAND.colors.primary,backgroundColor:BRAND.colors.primarySoft},code:{width:50,height:42,borderRadius:14,backgroundColor:BRAND.colors.surfaceWarm,alignItems:'center',justifyContent:'center',marginRight:12},codeSelected:{backgroundColor:BRAND.colors.primary},codeText:{color:BRAND.colors.inkSoft,fontSize:11,fontWeight:'900'},codeTextSelected:{color:BRAND.colors.white},copy:{flex:1},optionTitle:{color:BRAND.colors.ink,fontSize:14,fontWeight:'900'},optionRegion:{color:BRAND.colors.muted,fontSize:10,marginTop:3},radio:{width:22,height:22,borderRadius:11,borderWidth:1.5,borderColor:BRAND.colors.border,alignItems:'center',justifyContent:'center'},radioSelected:{borderColor:BRAND.colors.primary},radioDot:{width:10,height:10,borderRadius:5,backgroundColor:BRAND.colors.primary},footer:{gap:10},footerHint:{color:BRAND.colors.muted,fontSize:10,textAlign:'center'},button:{minHeight:58,borderRadius:19,backgroundColor:BRAND.colors.primary,alignItems:'center',justifyContent:'center',shadowColor:BRAND.colors.primaryStrong,shadowOpacity:.18,shadowRadius:16,shadowOffset:{width:0,height:8},elevation:3},buttonText:{color:BRAND.colors.white,fontSize:15,fontWeight:'900'},buttonArrow:{fontSize:20},
});
