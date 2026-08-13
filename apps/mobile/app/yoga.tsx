import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { getYogaCue, getYogaSession, startYogaCoach, tickYogaCoach, YogaCoachState, YogaSession } from '../lib/api';

export default function YogaScreen(){
  const [session,setSession]=useState<YogaSession|null>(null);
  const [state,setState]=useState<YogaCoachState|null>(null);
  const [cue,setCue]=useState<string>('آماده‌ای؟ آرام شروع می‌کنیم.');
  const [loading,setLoading]=useState(true);
  useEffect(()=>{void (async()=>{const next=await getYogaSession(20,'beginner','mobility');setSession(next);setState(await startYogaCoach(next));setLoading(false)})()},[]);
  useEffect(()=>{if(!session||!state||state.phase==='completed')return;const id=setInterval(()=>{void (async()=>{const next=await tickYogaCoach(session,state,1);setState(next);const currentCue=await getYogaCue(next);if(currentCue?.text)setCue(currentCue.text)})()},1000);return()=>clearInterval(id)},[session,state]);
  if(loading||!session||!state)return <View style={styles.center}><ActivityIndicator size="large"/></View>;
  const step=session.steps[state.stepIndex];
  return <SafeAreaView style={styles.safe}>
    <View style={styles.top}><View><Text style={styles.eyebrow}>YOGA COACH</Text><Text style={styles.title}>آرام، پیوسته، با مربی</Text></View><Text style={styles.level}>{session.level}</Text></View>
    <View style={styles.cameraStage}><View style={styles.guide}><Text style={styles.guideText}>LIVE TRAINING</Text><Text style={styles.guidePose}>{step ? step.poseId.replaceAll('_',' ') : 'completed'}</Text><Text style={styles.guideHint}>اینجا تصویر دوربین و Overlay بدن قرار می‌گیرد</Text></View></View>
    <View style={styles.card}><Text style={styles.poseTitle}>{step?.poseId.replaceAll('_',' ') ?? 'Session complete'}</Text><Text style={styles.phase}>{state.phase}</Text><Text style={styles.timer}>{Math.floor(state.remainingSec/60).toString().padStart(2,'0')}:{(state.remainingSec%60).toString().padStart(2,'0')}</Text><Text style={styles.cue}>{state.phase==='completed'?'عالی بود. جلسه تمام شد.':cue}</Text></View>
    <Pressable style={styles.nextButton} onPress={()=>{if(session&&state)void tickYogaCoach(session,{...state,remainingSec:0},1)}}><Text style={styles.nextText}>{state.phase==='completed'?'پایان':'ادامه'}</Text></Pressable>
  </SafeAreaView>
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#F5F2EC',padding:20},center:{flex:1,alignItems:'center',justifyContent:'center'},top:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.7,color:'#756C61'},title:{fontSize:25,fontWeight:'900',color:'#1F1B17',marginTop:5},level:{backgroundColor:'#1F1B17',color:'#fff',paddingHorizontal:12,paddingVertical:8,borderRadius:16,fontSize:11,fontWeight:'800'},cameraStage:{flex:1,marginTop:18,borderRadius:28,backgroundColor:'#D9D2C7',overflow:'hidden',alignItems:'center',justifyContent:'center'},guide:{borderWidth:1,borderColor:'#8C8173',borderRadius:24,padding:30,alignItems:'center',margin:22},guideText:{fontSize:10,fontWeight:'900',letterSpacing:1.5,color:'#655A4E'},guidePose:{fontSize:30,fontWeight:'900',marginTop:12,textTransform:'capitalize',color:'#1F1B17'},guideHint:{fontSize:12,color:'#655A4E',textAlign:'center',marginTop:10,lineHeight:18},card:{backgroundColor:'#FFFDF9',borderRadius:24,padding:20,marginTop:16},poseTitle:{fontSize:22,fontWeight:'900',color:'#1F1B17',textTransform:'capitalize'},phase:{fontSize:11,color:'#8A7F73',fontWeight:'800',marginTop:4,textTransform:'uppercase'},timer:{fontSize:44,fontWeight:'900',color:'#1F1B17',marginTop:10},cue:{fontSize:16,lineHeight:24,color:'#4C4339',marginTop:10},nextButton:{marginTop:14,backgroundColor:'#1F1B17',borderRadius:18,minHeight:54,alignItems:'center',justifyContent:'center'},nextText:{color:'#fff',fontSize:15,fontWeight:'900'} });
