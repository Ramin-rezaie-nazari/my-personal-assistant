import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { requestCameraPermission, requestMicrophonePermission } from '../lib/permissions';
import { registerForPushNotifications } from '../lib/notifications/push-registration';
import { AppLocale, getStoredLocale, isRTL } from '../lib/i18n';
import { localizedCopy } from '../lib/localized-copy';
import { router } from 'expo-router';
import { hasAuthSession, patchMe } from '../lib/api';

const copy = localizedCopy({
  en: {
    title:'Let’s set up your assistant', subtitle:'A few choices help MYPA personalize your day while keeping everything on your device where possible.', language:'Language', permissions:'Permissions', location:'Location', notifications:'Notifications', camera:'Camera', microphone:'Microphone', allow:'Allow', allowed:'Allowed', skip:'Skip for now', continue:'Continue', country:'Detected country', name:'What should I call you?', firstName:'First name', lastName:'Last name', save:'Save and continue', saving:'Saving…', account:'Account', done:'You’re ready', doneBody:'Your assistant is ready to start learning from your routines and plans.', retry:'Try again', unavailable:'Setup could not continue',
  },
  fa: {
    title:'دستیار خودت را راه‌اندازی کنیم', subtitle:'چند انتخاب ساده کمک می‌کنند دستیار روزت را شخصی‌سازی کند و تا جای ممکن اطلاعات روی دستگاهت بماند.', language:'زبان', permissions:'دسترسی‌ها', location:'موقعیت مکانی', notifications:'اعلان‌ها', camera:'دوربین', microphone:'میکروفون', allow:'اجازه بده', allowed:'مجاز است', skip:'فعلاً رد کن', continue:'ادامه', country:'کشور شناسایی‌شده', name:'دوست داری با چه اسمی صدات کنم؟', firstName:'نام', lastName:'نام خانوادگی', save:'ذخیره و ادامه', saving:'در حال ذخیره…', account:'حساب', done:'آماده‌ای', doneBody:'دستیار آماده است تا از برنامه‌ها و عادت‌های تو یاد بگیرد.', retry:'تلاش دوباره', unavailable:'راه‌اندازی ادامه پیدا نکرد',
  },
});

export default function OnboardingScreen() {
  const [locale, setLocale] = useState<AppLocale>('en');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [detectedCountry, setDetectedCountry] = useState('');
  const [busy, setPermissionBusy] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => { void getStoredLocale().then((stored) => setLocale(stored ?? 'en')); }, []);
  useEffect(() => { void hasAuthSession().then((ok) => { if (!ok) router.replace('/auth'); }); }, []);

  const text = copy[locale];
  const rtl = isRTL(locale);
  const update = useCallback((key: string, value: unknown) => {
    void patchMe({ [key]: value as string | boolean }).catch(() => undefined);
  }, []);
  const updatePermission = useCallback((key: string, granted: boolean) => { setPermissions((current) => ({ ...current, [key]: granted })); update(`permission_${key}`, granted); }, [update]);

  const requestPermission = useCallback(async (key: string) => {
    try {
      setPermissionBusy(key);
      if (key === 'location') {
        const result = await Location.requestForegroundPermissionsAsync();
        const granted = result.status === Location.PermissionStatus.GRANTED;
        updatePermission(key, granted);
        if (granted) {
          try {
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            const places = await Location.reverseGeocodeAsync(position.coords);
            const country = places[0]?.country ?? '';
            if (country) { setDetectedCountry(country); update({ detectedCountry: country }); }
          } catch {}
        }
      } else if (key === 'notifications') {
        const result = await Notifications.requestPermissionsAsync();
        const granted = result.status === Notifications.PermissionStatus.GRANTED;
        updatePermission(key, granted);
      } else if (key === 'camera') {
        const result = await requestCameraPermission();
        updatePermission(key, result.granted);
      } else {
        const result = await requestMicrophonePermission();
        updatePermission(key, result.granted);
      }
    } catch { updatePermission(key, false); }
    finally { setPermissionBusy(null); }
  }, [update, updatePermission]);

  const saveProfile = async () => {
    try {
      setSaving(true);
      await patchMe({ firstName, lastName });
      await new Promise((resolve) => setTimeout(resolve, 250));
      if (permissions.notifications) await registerForPushNotifications({ accessToken: '', language: locale, projectId: '' }).catch(() => null);
      Alert.alert(text.done, text.doneBody, [{ text: text.continue, onPress: () => router.replace('/daily') }]);
    } catch { Alert.alert(text.unavailable); }
    finally { setSaving(false); }
  };

  const cards = useMemo(() => [
    { key:'location', label:text.location }, { key:'notifications', label:text.notifications }, { key:'camera', label:text.camera }, { key:'microphone', label:text.microphone },
  ], [text.camera, text.location, text.microphone, text.notifications]);

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView contentContainerStyle={styles.content}>
    <Text style={[styles.eyebrow, rtl && styles.rtlText]}>{text.account}</Text>
    <Text style={[styles.title, rtl && styles.rtlText]}>{text.title}</Text>
    <Text style={[styles.subtitle, rtl && styles.rtlText]}>{text.subtitle}</Text>
    <View style={styles.card}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{text.name}</Text><TextInput value={firstName} onChangeText={setFirstName} placeholder={text.firstName} style={[styles.input, rtl && styles.rtlText]} /><TextInput value={lastName} onChangeText={setLastName} placeholder={text.lastName} style={[styles.input, rtl && styles.rtlText]} /></View>
    <View style={styles.card}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{text.permissions}</Text>{cards.map(({ key, label }) => <Pressable key={key} onPress={() => void requestPermission(key)} style={[styles.permission, rtl && styles.rtl]}><View style={styles.permissionCopy}><Text style={[styles.permissionLabel, rtl && styles.rtlText]}>{label}</Text><Text style={styles.permissionState}>{permissions[key] ? text.allowed : text.allow}</Text></View>{busy === key ? <ActivityIndicator size="small" /> : <Switch value={!!permissions[key]} onValueChange={() => void requestPermission(key)} />}</Pressable>)}</View>
    {detectedCountry ? <View style={styles.country}><Text style={[styles.countryLabel, rtl && styles.rtlText]}>{text.country}</Text><Text style={[styles.countryValue, rtl && styles.rtlText]}>{detectedCountry}</Text></View> : null}
    <Pressable onPress={() => router.replace('/daily')} style={styles.skip}><Text style={styles.skipText}>{text.skip}</Text></Pressable>
    <Pressable disabled={saving} onPress={() => void saveProfile()} style={styles.primary}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.primaryText}>{text.save}</Text>}</Pressable>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F7F8FA'},content:{padding:20,gap:14,paddingBottom:40},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.4,color:'#6B7280'},title:{fontSize:30,fontWeight:'900',color:'#111827'},subtitle:{fontSize:14,lineHeight:21,color:'#6B7280'},rtlText:{writingDirection:'rtl',textAlign:'right'},card:{backgroundColor:'#FFF',borderRadius:20,padding:18,gap:12},sectionTitle:{fontSize:17,fontWeight:'900',color:'#111827'},input:{minHeight:48,borderWidth:1,borderColor:'#E5E7EB',borderRadius:13,paddingHorizontal:13,color:'#111827',backgroundColor:'#FFF'},permission:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#F3F4F6'},rtl:{flexDirection:'row-reverse'},permissionCopy:{flex:1},permissionLabel:{fontSize:14,fontWeight:'800',color:'#111827'},permissionState:{fontSize:10,color:'#6B7280',marginTop:2},country:{backgroundColor:'#EEF2FF',borderRadius:16,padding:14},countryLabel:{fontSize:10,fontWeight:'900',color:'#6B7280'},countryValue:{fontSize:15,fontWeight:'800',color:'#111827',marginTop:3},skip:{alignItems:'center',paddingVertical:11},skipText:{color:'#6B7280',fontWeight:'800'},primary:{backgroundColor:'#111827',borderRadius:15,padding:16,alignItems:'center'},primaryText:{color:'#FFF',fontWeight:'900'}});
