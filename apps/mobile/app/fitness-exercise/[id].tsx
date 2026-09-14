import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { BRAND } from '../../lib/branding';
import { useAppLocale } from '../../lib/i18n';
import { ExerciseDetail, getExerciseDetail } from '../../lib/fitness-content-api';

const ui = {
  en: { eyebrow: 'EXERCISE', back: 'Back', loading: 'Loading movement…', unavailable: 'Exercise unavailable', retry: 'Try again', watch: 'Watch demonstration', noVideo: 'Video not available yet', instructions: 'How to perform', cues: 'Coach cues', mistakes: 'Common mistakes', cautions: 'Safety notes', equipment: 'Equipment', muscles: 'Primary muscles', alternatives: 'Alternatives', progression: 'Progression', regression: 'Regression', source: 'Source', noMedia: 'No approved demonstration media yet.' },
  fa: { eyebrow: 'تمرین', back: 'برگشت', loading: 'در حال بارگذاری حرکت…', unavailable: 'تمرین در دسترس نیست', retry: 'تلاش دوباره', watch: 'مشاهده ویدئو', noVideo: 'ویدئو هنوز آماده نیست', instructions: 'روش اجرا', cues: 'نکات مربی', mistakes: 'اشتباهات رایج', cautions: 'نکات ایمنی', equipment: 'تجهیزات', muscles: 'عضلات اصلی', alternatives: 'جایگزین‌ها', progression: 'پیشرفت', regression: 'پسرفت', source: 'منبع', noMedia: 'هنوز مدیای تأییدشده‌ای برای این تمرین وجود ندارد.' },
} as const;

export default function FitnessExerciseDetailScreen() {
  const { locale, rtl } = useAppLocale();
  const text = ui[locale];
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    try { setError(null); setExercise(await getExerciseDetail(id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load exercise.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={BRAND.colors.primaryStrong} /><Text style={styles.centerText}>{text.loading}</Text></View>;
  if (error || !exercise) return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.errorTitle}>{text.unavailable}</Text><Text style={styles.errorBody}>{error ?? text.noMedia}</Text><Pressable onPress={() => { setLoading(true); void load(); }} style={styles.retry}><Text style={styles.retryText}>{text.retry}</Text></Pressable></View></SafeAreaView>;

  const title = locale === 'fa' && exercise.nameFa ? exercise.nameFa : exercise.name;
  const videos = exercise.media.filter((item) => item.kind === 'video');
  const images = exercise.media.filter((item) => item.kind !== 'video');

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>{rtl ? '→' : '←'} {text.back}</Text></Pressable>
        <Text style={[styles.eyebrow, rtl && styles.rtlText]}>{text.eyebrow}</Text>
        <View style={[styles.titleRow, rtl && styles.rtlRow]}>
          <View style={styles.titleCopy}><Text style={[styles.title, rtl && styles.rtlText]}>{title}</Text><Text style={[styles.subtitle, rtl && styles.rtlText]}>{exercise.discipline} · {exercise.difficulty}</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>{exercise.videoReady ? 'VIDEO' : 'MEDIA'}</Text></View>
        </View>

        {images.length ? <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.mediaScroller} contentContainerStyle={styles.mediaContent}>{images.map((item) => <Image key={item.id} source={{ uri: item.url }} style={styles.heroImage} resizeMode="cover" />)}</ScrollView> : <View style={styles.mediaPlaceholder}><Text style={styles.mediaPlaceholderTitle}>{exercise.videoReady ? text.watch : text.noMedia}</Text></View>}

        {videos.length ? <View style={styles.videoCard}><View style={styles.videoCardCopy}><Text style={[styles.videoTitle, rtl && styles.rtlText]}>{text.watch}</Text><Text style={[styles.videoMeta, rtl && styles.rtlText]}>{videos[0].sourceProvider} · {videos[0].durationSeconds ? `${videos[0].durationSeconds}s` : 'video'}</Text></View><Pressable onPress={() => void Linking.openURL(videos[0].url)} style={styles.playButton}><Text style={styles.playText}>▶</Text></Pressable></View> : <View style={styles.noVideo}><Text style={[styles.noVideoText, rtl && styles.rtlText]}>{text.noVideo}</Text></View>}

        <InfoCard title={text.muscles} values={exercise.primaryMuscles} rtl={rtl} />
        <InfoCard title={text.equipment} values={exercise.equipment.length ? exercise.equipment : ['Bodyweight']} rtl={rtl} />
        {exercise.instructions ? <TextBlock title={text.instructions} body={exercise.instructions} rtl={rtl} /> : null}
        <ListBlock title={text.cues} values={exercise.coachCues} rtl={rtl} />
        <ListBlock title={text.mistakes} values={exercise.commonMistakes} rtl={rtl} />
        <ListBlock title={text.cautions} values={exercise.cautions} rtl={rtl} />

        {exercise.relationships.length ? <View style={styles.section}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{text.alternatives}</Text>{exercise.relationships.map((rel) => <Pressable key={rel.id} onPress={() => router.push(`/fitness-exercise/${encodeURIComponent(rel.toExerciseId)}`)} style={[styles.relationship, rtl && styles.rtlRow]}><View style={styles.relationshipCopy}><Text style={[styles.relationshipName, rtl && styles.rtlText]}>{locale === 'fa' && rel.nameFa ? rel.nameFa : rel.name}</Text><Text style={[styles.relationshipMeta, rtl && styles.rtlText]}>{rel.kind === 'progression' ? text.progression : rel.kind === 'regression' ? text.regression : text.alternatives}</Text></View><Text style={styles.arrow}>{rtl ? '←' : '→'}</Text></Pressable>)}</View> : null}

        {(exercise.media[0]?.sourceProvider || exercise.media[0]?.sourceUrl) ? <View style={styles.source}><Text style={[styles.sourceLabel, rtl && styles.rtlText]}>{text.source}</Text><Text style={[styles.sourceText, rtl && styles.rtlText]}>{exercise.media[0]?.sourceProvider ?? '—'}{exercise.media[0]?.license ? ` · ${exercise.media[0].license}` : ''}</Text></View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ title, values, rtl }: { title: string; values: string[]; rtl: boolean }) { return <View style={styles.section}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{title}</Text><View style={styles.pillWrap}>{values.map((value) => <View key={value} style={styles.pill}><Text style={styles.pillText}>{value}</Text></View>)}</View></View>; }
function TextBlock({ title, body, rtl }: { title: string; body: string; rtl: boolean }) { return <View style={styles.section}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{title}</Text><Text style={[styles.body, rtl && styles.rtlText]}>{body}</Text></View>; }
function ListBlock({ title, values, rtl }: { title: string; values: string[]; rtl: boolean }) { if (!values.length) return null; return <View style={styles.section}><Text style={[styles.sectionTitle, rtl && styles.rtlText]}>{title}</Text>{values.map((value, index) => <View key={`${value}-${index}`} style={[styles.listRow, rtl && styles.rtlRow]}><View style={styles.dot} /><Text style={[styles.body, styles.listText, rtl && styles.rtlText]}>{value}</Text></View>)}</View>; }

const styles = StyleSheet.create({ safe:{flex:1,backgroundColor:BRAND.colors.canvas}, content:{padding:20,paddingBottom:40}, back:{paddingVertical:7,alignSelf:'flex-start'}, backText:{fontWeight:'800',color:'#374151'}, eyebrow:{marginTop:10,fontSize:11,fontWeight:'900',letterSpacing:1.7,color:BRAND.colors.primaryStrong}, titleRow:{marginTop:8,flexDirection:'row',alignItems:'flex-start',gap:12}, rtlRow:{flexDirection:'row-reverse'}, titleCopy:{flex:1}, title:{fontSize:32,lineHeight:38,fontWeight:'900',color:'#111827'}, subtitle:{marginTop:6,fontSize:13,color:'#6B7280',textTransform:'capitalize'}, badge:{paddingHorizontal:10,paddingVertical:7,borderRadius:10,backgroundColor:'#111827'}, badgeText:{color:'#FFF',fontSize:9,fontWeight:'900',letterSpacing:1}, mediaScroller:{marginTop:18,marginHorizontal:-20}, mediaContent:{gap:10,paddingHorizontal:20}, heroImage:{width:335,height:250,borderRadius:24,backgroundColor:'#E5E7EB'}, mediaPlaceholder:{marginTop:18,height:220,borderRadius:24,backgroundColor:'#111827',alignItems:'center',justifyContent:'center',padding:24}, mediaPlaceholderTitle:{color:'#FFF',fontSize:17,fontWeight:'900',textAlign:'center'}, videoCard:{marginTop:14,padding:14,borderRadius:18,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#EEF0F3',flexDirection:'row',alignItems:'center',gap:12}, videoCardCopy:{flex:1}, videoTitle:{fontSize:15,fontWeight:'900',color:'#111827'}, videoMeta:{marginTop:4,fontSize:11,color:'#6B7280'}, playButton:{width:50,height:50,borderRadius:25,backgroundColor:'#111827',alignItems:'center',justifyContent:'center'}, playText:{color:'#FFF',fontSize:17}, noVideo:{marginTop:14,padding:14,borderRadius:14,backgroundColor:'#F3F4F6'}, noVideoText:{fontSize:12,fontWeight:'700',color:'#6B7280'}, section:{marginTop:22}, sectionTitle:{fontSize:15,fontWeight:'900',color:'#111827',marginBottom:10}, pillWrap:{flexDirection:'row',flexWrap:'wrap',gap:8}, pill:{paddingHorizontal:12,paddingVertical:9,borderRadius:999,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:'#E5E7EB'}, pillText:{fontSize:11,fontWeight:'800',color:'#374151'}, body:{fontSize:14,lineHeight:22,color:'#4B5563'}, listRow:{flexDirection:'row',alignItems:'flex-start',gap:10,marginBottom:8}, listText:{flex:1}, dot:{width:7,height:7,borderRadius:4,backgroundColor:BRAND.colors.primaryStrong,marginTop:8}, relationship:{padding:14,borderRadius:16,backgroundColor:'#FFF',borderWidth:1,borderColor:'#EEF0F3',flexDirection:'row',alignItems:'center',gap:12,marginBottom:8}, relationshipCopy:{flex:1}, relationshipName:{fontSize:14,fontWeight:'900',color:'#111827'}, relationshipMeta:{marginTop:4,fontSize:10,fontWeight:'800',color:BRAND.colors.primaryStrong,textTransform:'uppercase'}, arrow:{fontSize:20,color:'#6B7280'}, source:{marginTop:20,paddingTop:14,borderTopWidth:1,borderTopColor:'#E5E7EB'}, sourceLabel:{fontSize:10,fontWeight:'900',letterSpacing:1.3,color:'#9CA3AF'}, sourceText:{marginTop:5,fontSize:11,color:'#6B7280'}, center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:BRAND.colors.canvas}, centerText:{marginTop:12,color:'#6B7280'}, errorTitle:{fontSize:19,fontWeight:'900',color:'#111827'}, errorBody:{marginTop:8,color:'#6B7280',textAlign:'center'}, retry:{marginTop:16,paddingHorizontal:18,paddingVertical:11,borderRadius:12,backgroundColor:'#111827'}, retryText:{color:'#FFF',fontWeight:'800'}, rtlText:{textAlign:'right',writingDirection:'rtl'} });
