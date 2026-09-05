import { StyleSheet, Text, View } from 'react-native';
import type { DecisionTrace } from '../lib/api';
import { useAppLocale } from '../lib/i18n';

export function DecisionTraceCard({ trace }: { trace: DecisionTrace | null }) {
  const locale = useAppLocale();
  const isFa = locale === 'fa';
  if (!trace) return null;
  const state = trace.blockedIds.length ? (isFa ? 'در انتظار' : 'Waiting') : trace.rejectedIds.length ? (isFa ? 'متوقف' : 'Stopped') : (isFa ? 'تکمیل‌شده' : 'Completed');
  return (
    <View style={styles.card}>
      <View style={[styles.row, isFa && styles.rtl]}><Text style={styles.title}>{isFa ? 'ردپای Brain' : 'Brain trace'}</Text><Text style={styles.state}>{state}</Text></View>
      <Text style={[styles.reason, isFa && styles.rtl]} numberOfLines={2}>{trace.reason}</Text>
      <Text style={styles.meta}>{new Date(trace.createdAt).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:16},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},title:{color:'#111827',fontSize:15,fontWeight:'900'},state:{color:'#6B7280',fontSize:11,fontWeight:'900'},reason:{color:'#374151',fontSize:12,lineHeight:18,marginTop:8},meta:{color:'#9CA3AF',fontSize:10,marginTop:6},rtl:{direction:'rtl'},
});
