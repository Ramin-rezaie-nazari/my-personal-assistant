import { StyleSheet, Text, View } from 'react-native';
import type { PlanExecutionState } from '../lib/api';

export function PlanStatusCard({ plan, rtl = false }: { plan: PlanExecutionState | null; rtl?: boolean }) {
  if (!plan) return null;
  const total = plan.stepIds.length;
  const done = plan.completed.length;
  const progress = total ? Math.round((done / total) * 100) : 0;
  const statusLabel = plan.status === 'completed' ? (rtl ? 'تمام شد' : 'Completed') : plan.status === 'running' ? (rtl ? 'در حال اجرا' : 'Running') : plan.status === 'blocked' ? (rtl ? 'منتظر تأیید' : 'Waiting') : plan.status === 'partial' ? (rtl ? 'نیازمند ادامه' : 'Needs attention') : plan.status;
  return (
    <View style={styles.card}>
      <View style={[styles.header, rtl && styles.rtl]}><View style={styles.titleWrap}><Text style={styles.eyebrow}>{rtl ? 'وضعیت اجرای Brain' : 'BRAIN EXECUTION'}</Text><Text style={styles.title}>{statusLabel}</Text></View><Text style={styles.progress}>{progress}%</Text></View>
      <View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View>
      <Text style={[styles.meta, rtl && styles.rtl]}>{rtl ? `${done} مرحله از ${total} انجام شده` : `${done} of ${total} steps completed`}</Text>
      {plan.currentStep ? <Text style={[styles.next, rtl && styles.rtl]}>{rtl ? 'مرحله بعدی: ' : 'Next step: '}{plan.currentStep}</Text> : null}
      {plan.failed.length ? <Text style={styles.warning}>{rtl ? `${plan.failed.length} مرحله ناموفق` : `${plan.failed.length} failed step(s)`}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:'#111827',borderRadius:22,padding:18},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  rtl:{direction:'rtl'}, titleWrap:{flex:1}, eyebrow:{color:'#9CA3AF',fontSize:10,fontWeight:'900',letterSpacing:1.2}, title:{color:'#FFFFFF',fontSize:17,fontWeight:'900',marginTop:4}, progress:{color:'#FFFFFF',fontSize:22,fontWeight:'900'}, track:{height:7,borderRadius:4,backgroundColor:'#FFFFFF22',overflow:'hidden',marginTop:14}, fill:{height:'100%',backgroundColor:'#FFFFFF',borderRadius:4}, meta:{color:'#D1D5DB',fontSize:11,marginTop:10}, next:{color:'#FFFFFF',fontSize:12,fontWeight:'700',marginTop:6}, warning:{color:'#FCA5A5',fontSize:11,fontWeight:'800',marginTop:7},
});
