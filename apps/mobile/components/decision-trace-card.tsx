import { StyleSheet, Text, View } from 'react-native';
import type { DecisionTrace } from '../lib/api';

export function DecisionTraceCard({ trace }: { trace: DecisionTrace | null }) {
  if (!trace) return null;
  const state = trace.blockedIds.length ? 'Waiting' : trace.rejectedIds.length ? 'Stopped' : 'Completed';
  return (
    <View style={styles.card}>
      <View style={styles.row}><Text style={styles.title}>Brain trace</Text><Text style={styles.state}>{state}</Text></View>
      <Text style={styles.reason} numberOfLines={2}>{trace.reason}</Text>
      <Text style={styles.meta}>{new Date(trace.createdAt).toLocaleString()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:16},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  title:{color:'#111827',fontSize:15,fontWeight:'900'},
  state:{color:'#6B7280',fontSize:11,fontWeight:'900'},
  reason:{color:'#374151',fontSize:12,lineHeight:18,marginTop:8},
  meta:{color:'#9CA3AF',fontSize:10,marginTop:6},
});
