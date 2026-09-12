import { StyleSheet, Text, View } from 'react-native';
import type { DecisionTrace } from '../lib/api';

export function DecisionTraceCard({ trace, rtl = false }: { trace: DecisionTrace | null; rtl?: boolean }) {
  if (!trace) return null;
  const state = trace.blockedIds.length ? (rtl ? 'در انتظار' : 'Waiting') : trace.rejectedIds.length ? (rtl ? 'متوقف' : 'Stopped') : (rtl ? 'انجام شد' : 'Completed');
  return (
    <View style={styles.card}>
      <View style={[styles.row, rtl && styles.rtl]}><Text style={styles.title}>{rtl ? 'ردیابی Brain' : 'Brain trace'}</Text><Text style={styles.state}>{state}</Text></View>
      <Text style={[styles.reason, rtl && styles.rtlText]} numberOfLines={2}>{trace.reason}</Text>
      <Text style={[styles.meta, rtl && styles.rtlText]}>{new Date(trace.createdAt).toLocaleString(rtl ? 'fa-IR' : 'en-US')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:16},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  rtl:{flexDirection:'row-reverse'}, title:{color:'#111827',fontSize:15,fontWeight:'900'},
  state:{color:'#6B7280',fontSize:11,fontWeight:'900'}, reason:{color:'#374151',fontSize:12,lineHeight:18,marginTop:8},
  meta:{color:'#9CA3AF',fontSize:10,marginTop:6}, rtlText:{textAlign:'right',direction:'rtl'},
});