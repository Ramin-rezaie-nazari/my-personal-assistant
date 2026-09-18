import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DecisionTrace } from '../lib/api';
import { useAppLocale, isRTL, t } from '../lib/i18n';
import { localizedCopy } from '../lib/localized-copy';

const copy = localizedCopy({
  en: { title: 'Brain trace', waiting: 'Waiting', stopped: 'Stopped', completed: 'Completed' },
  fa: { title: 'ردیابی Brain', waiting: 'در انتظار', stopped: 'متوقف', completed: 'انجام شد' },
});

export function DecisionTraceCard({ trace, rtl }: { trace: DecisionTrace | null; rtl?: boolean }) {
  const { locale } = useAppLocale();
  if (!trace) return null;
  const effectiveRTL = rtl ?? isRTL(locale);
  const text = copy[locale];
  const state = trace.blockedIds.length ? text.waiting : trace.rejectedIds.length ? text.stopped : text.completed;
  return (
    <View style={styles.card}>
      <View style={[styles.row, effectiveRTL && styles.rtl]}><Text style={[styles.title, effectiveRTL && styles.rtlText]}>{text.title}</Text><Text style={styles.state}>{state}</Text></View>
      <Text style={[styles.reason, effectiveRTL && styles.rtlText]} numberOfLines={2}>{trace.reason}</Text>
      <Text style={[styles.meta, effectiveRTL && styles.rtlText]}>{new Date(trace.createdAt).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')}</Text>
      <Text style={[styles.label, effectiveRTL && styles.rtlText]}>{t(locale, 'progress')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card:{backgroundColor:'#FFFFFF',borderRadius:20,padding:16},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  rtl:{flexDirection:'row-reverse'}, title:{color:'#111827',fontSize:15,fontWeight:'900'},
  state:{color:'#6B7280',fontSize:11,fontWeight:'900'}, reason:{color:'#374151',fontSize:12,lineHeight:18,marginTop:8},
  meta:{color:'#9CA3AF',fontSize:10,marginTop:6}, label:{color:'#9CA3AF',fontSize:9,marginTop:6}, rtlText:{textAlign:'right',direction:'rtl'},
});
