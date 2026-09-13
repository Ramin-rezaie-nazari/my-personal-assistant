import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PlanExecutionState } from '../lib/api';
import { AppLocale, getStoredLocale, isRTL, t } from '../lib/i18n';

export function PlanStatusCard({ plan, rtl }: { plan: PlanExecutionState | null; rtl?: boolean }) {
  const [locale, setLocale] = useState<AppLocale>('en');
  useEffect(() => { let active = true; void getStoredLocale().then((stored) => { if (active && stored) setLocale(stored); }); return () => { active = false; }; }, []);
  if (!plan) return null;
  const effectiveRTL = rtl ?? isRTL(locale);
  const total = plan.stepIds.length;
  const done = plan.completed.length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const statusLabel = plan.status === 'completed' ? (locale === 'fa' ? 'تمام شد' : 'Completed') : plan.status === 'running' ? (locale === 'fa' ? 'در حال اجرا' : 'Running') : plan.status === 'blocked' ? (locale === 'fa' ? 'منتظر تأیید' : 'Waiting') : plan.status === 'partial' ? (locale === 'fa' ? 'نیازمند ادامه' : 'Needs attention') : plan.status;
  return (
    <View style={styles.card}>
      <View style={[styles.header, effectiveRTL && styles.rtl]}><View style={styles.titleWrap}><Text style={[styles.eyebrow, effectiveRTL && styles.rtlText]}>{locale === 'fa' ? 'وضعیت اجرای Brain' : 'BRAIN EXECUTION'}</Text><Text style={[styles.title, effectiveRTL && styles.rtlText]}>{statusLabel}</Text></View><Text style={styles.progress}>{progress}%</Text></View>
      <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
      <Text style={[styles.meta, effectiveRTL && styles.rtlText]}>{locale === 'fa' ? `${done} مرحله از ${total} انجام شده` : `${done} of ${total} steps completed`}</Text>
      {plan.currentStep ? <Text style={[styles.next, effectiveRTL && styles.rtlText]}>{locale === 'fa' ? 'مرحله بعدی: ' : 'Next step: '}{plan.currentStep}</Text> : null}
      {plan.failed.length ? <Text style={[styles.warning, effectiveRTL && styles.rtlText]}>{locale === 'fa' ? `${plan.failed.length} مرحله ناموفق` : `${plan.failed.length} failed step(s)`}</Text> : null}
      <Text style={[styles.assistive, effectiveRTL && styles.rtlText]}>{t(locale, 'progress')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:'#111827',borderRadius:22,padding:18}, header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  rtl:{flexDirection:'row-reverse'}, rtlText:{textAlign:'right',direction:'rtl'}, titleWrap:{flex:1}, eyebrow:{color:'#9CA3AF',fontSize:10,fontWeight:'900',letterSpacing:1.2}, title:{color:'#FFFFFF',fontSize:17,fontWeight:'900',marginTop:4}, progress:{color:'#FFFFFF',fontSize:22,fontWeight:'900'},
  track:{height:7,borderRadius:4,backgroundColor:'#FFFFFF22',overflow:'hidden',marginTop:14}, fill:{height:'100%',backgroundColor:'#FFFFFF',borderRadius:4}, meta:{color:'#D1D5DB',fontSize:11,marginTop:10}, next:{color:'#FFFFFF',fontSize:12,fontWeight:'700',marginTop:6}, warning:{color:'#FCA5A5',fontSize:11,fontWeight:'800',marginTop:7}, assistive:{color:'#9CA3AF',fontSize:9,marginTop:6},
});
