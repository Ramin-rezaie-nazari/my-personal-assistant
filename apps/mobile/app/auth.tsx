import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AuthUser, login, register } from '../lib/api';
import { t, useAppLocale } from '../lib/i18n';
import { hasCompletedOnboarding } from '../lib/onboarding';

export default function AuthScreen() {
  const locale = useAppLocale();
  const isFa = locale === 'fa';
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [firstName, setFirstName] = useState(''); const [lastName, setLastName] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);

  const onAuthenticated = async (_user: AuthUser) => { router.replace((await hasCompletedOnboarding()) ? '/' : '/onboarding'); };
  const submit = async () => {
    if (!email.trim() || !password) { setError(isFa ? 'ایمیل و رمز عبور را وارد کن.' : 'Email and password are required.'); return; }
    if (mode === 'register' && password.length < 8) { setError(isFa ? 'رمز عبور باید حداقل ۸ کاراکتر باشد.' : 'Password must be at least 8 characters.'); return; }
    try {
      setBusy(true); setError(null);
      const auth = mode === 'login' ? await login(email.trim(), password) : await register({ email: email.trim(), password, firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined });
      await onAuthenticated(auth.user);
    } catch (err) { setError(err instanceof Error ? err.message : (isFa ? 'ورود ناموفق بود.' : 'Unable to authenticate.')); }
    finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.brand}><Text style={styles.brandEmoji}>🧠</Text></View>
        <Text style={styles.eyebrow}>MY PERSONAL ASSISTANT</Text>
        <Text style={styles.title}>{mode === 'login' ? (isFa ? 'خوش اومدی 👋' : 'Welcome back 👋') : (isFa ? 'بیا شروع کنیم ✨' : 'Let’s get started ✨')}</Text>
        <Text style={styles.subtitle}>{mode === 'login' ? (isFa ? 'برای ادامه وارد حساب خودت شو.' : 'Sign in to continue your day.') : (isFa ? 'حساب دستیار شخصی خودت را بساز.' : 'Create your personal assistant account.')}</Text>
        <View style={[styles.card, isFa && styles.rtl]}>
          {mode === 'register' ? <View style={styles.row}><TextInput value={firstName} onChangeText={setFirstName} placeholder={t(locale, 'firstName')} placeholderTextColor="#9CA3AF" style={[styles.input, styles.half]} /><TextInput value={lastName} onChangeText={setLastName} placeholder={t(locale, 'lastName')} placeholderTextColor="#9CA3AF" style={[styles.input, styles.half]} /></View> : null}
          <TextInput value={email} onChangeText={setEmail} placeholder={t(locale, 'email')} placeholderTextColor="#9CA3AF" style={styles.input} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
          <TextInput value={password} onChangeText={setPassword} placeholder={t(locale, 'password')} placeholderTextColor="#9CA3AF" style={styles.input} secureTextEntry />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable disabled={busy} onPress={() => void submit()} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{mode === 'login' ? t(locale, 'signIn') : t(locale, 'createAccount')}</Text>}
          </Pressable>
          <Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }} style={styles.switch}>
            <Text style={styles.switchText}>{mode === 'login' ? (isFa ? 'حساب نداری؟ بسازش' : 'Need an account? Create one') : (isFa ? 'قبلاً حساب ساختی؟ وارد شو' : 'Already have an account? Sign in')}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:'#F7F8FA'}, container:{flex:1,justifyContent:'center',padding:24}, brand:{width:82,height:82,borderRadius:26,backgroundColor:'#0B1026',alignSelf:'center',alignItems:'center',justifyContent:'center',marginBottom:18}, brandEmoji:{fontSize:34}, eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.5,color:'#6B7280',textAlign:'center'}, title:{fontSize:30,fontWeight:'900',color:'#111827',textAlign:'center',marginTop:8}, subtitle:{fontSize:14,lineHeight:21,color:'#6B7280',textAlign:'center',marginTop:8,marginBottom:24}, card:{backgroundColor:'#FFFFFF',borderRadius:22,padding:18,gap:12,borderWidth:1,borderColor:'#E5E7EB'}, rtl:{direction:'rtl'}, row:{flexDirection:'row',gap:10}, input:{minHeight:52,borderWidth:1,borderColor:'#E5E7EB',borderRadius:14,paddingHorizontal:14,color:'#111827',backgroundColor:'#FFFFFF',flex:1}, half:{minWidth:0}, error:{color:'#B42318',fontSize:13,lineHeight:19}, primary:{minHeight:54,borderRadius:15,backgroundColor:'#6D28D9',alignItems:'center',justifyContent:'center',marginTop:2}, primaryText:{color:'#FFFFFF',fontSize:16,fontWeight:'900'}, switch:{alignItems:'center',paddingVertical:8}, switchText:{color:'#6B7280',fontSize:13,fontWeight:'700'}, pressed:{opacity:0.82} });
