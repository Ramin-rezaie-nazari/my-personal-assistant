import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AuthUser, login, register } from '../lib/api';
import { AppLocale, getStoredLocale, t } from '../lib/i18n';
import { hasCompletedOnboarding } from '../lib/onboarding';
import { BRAND } from '../lib/branding';
import { BrandWordmark } from '../components/BrandWordmark';

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [locale, setLocale] = useState<AppLocale>('en');
  const entry = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => { void getStoredLocale().then((stored) => { if (stored) setLocale(stored); }); }, []);
  useEffect(() => { Animated.spring(entry, { toValue: 1, tension: 60, friction: 9, useNativeDriver: true }).start(); const loop = Animated.loop(Animated.sequence([Animated.timing(glow,{toValue:1,duration:2200,easing:Easing.inOut(Easing.quad),useNativeDriver:true}),Animated.timing(glow,{toValue:0,duration:2200,easing:Easing.inOut(Easing.quad),useNativeDriver:true})])); loop.start(); return () => loop.stop(); }, [entry, glow]);

  const isFa = locale === 'fa' || locale.startsWith('fa-');
  const onAuthenticated = async (_user: AuthUser) => { router.replace((await hasCompletedOnboarding()) ? '/' : '/onboarding'); };
  const submit = async () => {
    if (!email.trim() || !password) { setError(isFa ? 'ایمیل و رمز عبور را وارد کن.' : 'Email and password are required.'); return; }
    if (mode === 'register' && password.length < 8) { setError(isFa ? 'رمز عبور باید حداقل ۸ کاراکتر باشد.' : 'Password must be at least 8 characters.'); return; }
    try { setBusy(true); setError(null); const auth = mode === 'login' ? await login(email.trim(), password) : await register({ email: email.trim(), password, firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined }); await onAuthenticated(auth.user); }
    catch (err) { setError(err instanceof Error ? err.message : (isFa ? 'ورود ناموفق بود.' : 'Unable to authenticate.')); }
    finally { setBusy(false); }
  };
  const translateY = entry.interpolate({ inputRange:[0,1], outputRange:[24,0] }); const auraScale = glow.interpolate({inputRange:[0,1],outputRange:[1,1.16]}); const auraOpacity = glow.interpolate({inputRange:[0,1],outputRange:[0.12,0.22]});

  return <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={[styles.container, isFa && styles.rtl]}>
      <View style={styles.hero}><Animated.View style={[styles.aura,{transform:[{scale:auraScale}],opacity:auraOpacity}]} /><View style={styles.mark}><Text style={styles.markText}>✦</Text></View><BrandWordmark compact /></View>
      <Animated.View style={{transform:[{translateY}],opacity:entry}}><Text style={styles.eyebrow}>{isFa ? 'MY PERSONAL ASSISTANT' : 'MY PERSONAL ASSISTANT'}</Text><Text style={styles.title}>{mode === 'login' ? (isFa ? 'خوش اومدی.' : 'Welcome back.') : (isFa ? 'از همین‌جا شروع کنیم.' : 'Let’s make it personal.')}</Text><Text style={styles.subtitle}>{mode === 'login' ? (isFa ? 'دستیار شخصی‌ات منتظر ادامه‌ی روزته.' : 'Your personal assistant is ready for the rest of your day.') : (isFa ? 'یک فضای شخصی برای غذا، برنامه، عادت‌ها و کارهای روزمره.' : 'One calm place for food, plans, habits and everything in between.')}</Text></Animated.View>
      <Animated.View style={[styles.card,{transform:[{translateY}],opacity:entry}]}>
        {mode === 'register' ? <View style={styles.row}><TextInput value={firstName} onChangeText={setFirstName} placeholder={t(locale,'firstName')} placeholderTextColor="#94A3B8" style={[styles.input,styles.half]} /><TextInput value={lastName} onChangeText={setLastName} placeholder={t(locale,'lastName')} placeholderTextColor="#94A3B8" style={[styles.input,styles.half]} /></View> : null}
        <TextInput value={email} onChangeText={setEmail} placeholder={t(locale,'email')} placeholderTextColor="#94A3B8" style={styles.input} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
        <TextInput value={password} onChangeText={setPassword} placeholder={t(locale,'password')} placeholderTextColor="#94A3B8" style={styles.input} secureTextEntry />
        {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
        <Pressable disabled={busy} onPress={() => void submit()} style={({pressed})=>[styles.primary,pressed&&styles.pressed]}>{busy?<ActivityIndicator color="#fff"/>:<Text style={styles.primaryText}>{mode==='login'?(isFa?'ورود':'Sign in'):(isFa?'ساخت حساب':'Create account')}</Text>}</Pressable>
        <Pressable onPress={()=>{setMode(mode==='login'?'register':'login');setError(null);}} style={styles.switch}><Text style={styles.switchText}>{mode==='login'?(isFa?'حساب نداری؟ یکی بساز.':'Need an account? Create one.'):(isFa?'قبلاً حساب داری؟ وارد شو.':'Already have an account? Sign in.')}</Text></Pressable>
      </Animated.View>
      <Text style={styles.footer}>{isFa ? 'ساده برای تو. قدرتمند در پشت صحنه.' : 'Simple for you. Powerful underneath.'}</Text>
    </View>
  </KeyboardAvoidingView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:BRAND.colors.canvas},container:{flex:1,justifyContent:'center',padding:24,gap:14},rtl:{direction:'rtl'},hero:{alignItems:'center',justifyContent:'center',marginBottom:2},aura:{position:'absolute',width:150,height:150,borderRadius:75,backgroundColor:BRAND.colors.primary},mark:{width:76,height:76,borderRadius:24,backgroundColor:BRAND.colors.ink,alignItems:'center',justifyContent:'center',marginBottom:12,shadowColor:'#000',shadowOpacity:.18,shadowRadius:18,shadowOffset:{width:0,height:8}},markText:{color:BRAND.colors.white,fontSize:28},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.6,color:BRAND.colors.primary,textAlign:'center'},title:{fontSize:31,lineHeight:37,fontWeight:'900',color:BRAND.colors.ink,textAlign:'center',marginTop:4},subtitle:{fontSize:14,lineHeight:21,color:BRAND.colors.muted,textAlign:'center',marginTop:5},card:{backgroundColor:BRAND.colors.surface,borderRadius:24,padding:16,gap:11,borderWidth:1,borderColor:BRAND.colors.border},row:{flexDirection:'row',gap:9},input:{minHeight:54,borderWidth:1,borderColor:BRAND.colors.border,borderRadius:16,paddingHorizontal:14,color:BRAND.colors.ink,backgroundColor:BRAND.colors.surface,flex:1},half:{minWidth:0},error:{backgroundColor:'#FEF2F2',borderRadius:12,padding:11},errorText:{color:'#991B1B',fontSize:12,lineHeight:18,fontWeight:'700'},primary:{minHeight:55,borderRadius:17,backgroundColor:BRAND.colors.primary,alignItems:'center',justifyContent:'center'},primaryText:{color:'#fff',fontSize:15,fontWeight:'900'},switch:{alignItems:'center',paddingVertical:7},switchText:{color:BRAND.colors.inkSoft,fontSize:12,fontWeight:'800'},pressed:{opacity:.82},footer:{textAlign:'center',color:BRAND.colors.muted,fontSize:10,marginTop:2}});