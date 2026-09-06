import React, { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommandCenterScreen from './command-center-v2';
import { useAppLocale } from '../lib/i18n';

const copy = {
  en: {
    home:'Home', food:'Food', fitness:'Fitness', planning:'Plan', more:'More',
    menuTitle:'Everything in MYPA', close:'Close', assistant:'Assistant', daily:'Today', meals:'Meals', mealBuilder:'Build a meal', smartMeals:'Smart meals', recipes:'Recipe library', recipeMatch:'Recipe match',
    inventory:'Inventory', shopping:'Shopping', habits:'Habits', supplements:'Supplements', reminders:'Reminders', calendar:'Calendar', notifications:'Notifications', insights:'Insights', brain:'Personal brain', language:'Language', yoga:'Yoga coach', gym:'Gym', calisthenics:'Calisthenics',
  },
  fa: {
    home:'خانه', food:'غذا', fitness:'ورزش', planning:'برنامه', more:'بیشتر',
    menuTitle:'همه بخش‌های دستیار من', close:'بستن', assistant:'دستیار', daily:'امروز', meals:'غذاها', mealBuilder:'ساخت وعده', smartMeals:'غذای هوشمند', recipes:'کتابخانه رسپی', recipeMatch:'تطبیق رسپی',
    inventory:'موجودی خانه', shopping:'خرید', habits:'عادت‌ها', supplements:'مکمل‌ها', reminders:'یادآوری‌ها', calendar:'تقویم', notifications:'اعلان‌ها', insights:'تحلیل‌ها', brain:'مغز شخصی', language:'زبان', yoga:'مربی یوگا', gym:'جیم', calisthenics:'کالیستنیکس',
  },
} as const;

type Route = '/assistant' | '/daily' | '/meals' | '/meal-builder' | '/smart-meals' | '/recipe-library' | '/recipe-match' | '/inventory' | '/shopping' | '/habits' | '/supplements' | '/reminders' | '/calendar' | '/notifications' | '/insights' | '/brain-overview' | '/language' | '/fitness' | '/yoga' | '/gym' | '/calisthenics';
type Item = { label:string; route:Route; icon:string };

export default function HomeShell() {
  const locale = useAppLocale();
  const text = copy[locale];
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const go = (route: Route) => { setOpen(false); router.push(route); };
  const food: Item[] = [
    { label:text.meals, route:'/meals', icon:'🍽️' },
    { label:text.mealBuilder, route:'/meal-builder', icon:'➕' },
    { label:text.smartMeals, route:'/smart-meals', icon:'✨' },
    { label:text.recipes, route:'/recipe-library', icon:'🍲' },
    { label:text.recipeMatch, route:'/recipe-match', icon:'🧩' },
    { label:text.inventory, route:'/inventory', icon:'🏠' },
    { label:text.shopping, route:'/shopping', icon:'🛒' },
  ];
  const training: Item[] = [
    { label:text.fitness, route:'/fitness', icon:'🏋️' },
    { label:text.gym, route:'/gym', icon:'💪' },
    { label:text.calisthenics, route:'/calisthenics', icon:'🤸' },
    { label:text.yoga, route:'/yoga', icon:'🧘' },
  ];
  const planning: Item[] = [
    { label:text.daily, route:'/daily', icon:'📅' },
    { label:text.habits, route:'/habits', icon:'✅' },
    { label:text.supplements, route:'/supplements', icon:'💊' },
    { label:text.reminders, route:'/reminders', icon:'⏰' },
    { label:text.calendar, route:'/calendar', icon:'🗓️' },
    { label:text.notifications, route:'/notifications', icon:'🔔' },
  ];
  const extra: Item[] = [
    { label:text.assistant, route:'/assistant', icon:'🧠' },
    { label:text.insights, route:'/insights', icon:'📈' },
    { label:text.brain, route:'/brain-overview', icon:'🗺️' },
    { label:text.language, route:'/language', icon:'🌐' },
  ];
  return (
    <View style={styles.root}>
      <CommandCenterScreen />
      <View pointerEvents="box-none" style={[styles.dockLayer, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
        <View style={styles.dock}>
          <DockButton icon="⌂" label={text.home} onPress={() => undefined} active />
          <DockButton icon="🍽️" label={text.food} onPress={() => go('/meals')} />
          <DockButton icon="🏋️" label={text.fitness} onPress={() => go('/fitness')} />
          <DockButton icon="📅" label={text.planning} onPress={() => go('/daily')} />
          <DockButton icon="☰" label={text.more} onPress={() => setOpen(true)} />
        </View>
      </View>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalBackdrop}>
            <View style={styles.sheet}>
              <View style={styles.sheetHeader}>
                <View style={styles.sheetTitleWrap}><Text style={styles.sheetTitle}>{text.menuTitle}</Text><Text style={styles.sheetHint}>MYPA</Text></View>
                <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.closeButton}><Text style={styles.closeText}>✕</Text></Pressable>
              </View>
              <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
                <FeatureSection title={text.food} items={food} onSelect={go} />
                <FeatureSection title={text.fitness} items={training} onSelect={go} />
                <FeatureSection title={text.planning} items={planning} onSelect={go} />
                <FeatureSection title={text.more} items={extra} onSelect={go} />
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function DockButton({ icon, label, onPress, active }: { icon:string; label:string; onPress:()=>void; active?:boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.dockButton, active && styles.dockButtonActive, pressed && styles.pressed]}><Text style={styles.dockIcon}>{icon}</Text><Text style={[styles.dockLabel, active && styles.dockLabelActive]} numberOfLines={1}>{label}</Text></Pressable>;
}
function FeatureSection({ title, items, onSelect }: { title:string; items:Item[]; onSelect:(route:Route)=>void }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text><View style={styles.itemGrid}>{items.map(item=><Pressable key={item.route + item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => onSelect(item.route)} style={({pressed})=>[styles.item, pressed && styles.pressed]}><Text style={styles.itemIcon}>{item.icon}</Text><Text style={styles.itemLabel}>{item.label}</Text><Text style={styles.itemArrow}>→</Text></Pressable>)}</View></View>;
}
const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#F7F8FA'},
  dockLayer:{position:'absolute',left:0,right:0,bottom:0,alignItems:'center'},
  dock:{width:'94%',maxWidth:520,borderRadius:22,backgroundColor:'#111827',paddingHorizontal:8,paddingTop:8,flexDirection:'row',justifyContent:'space-around',shadowColor:'#000',shadowOpacity:0.18,shadowRadius:14,shadowOffset:{width:0,height:7},elevation:10},
  dockButton:{flex:1,alignItems:'center',justifyContent:'center',minHeight:54,borderRadius:16,paddingHorizontal:4},
  dockButtonActive:{backgroundColor:'#FFFFFF18'},
  dockIcon:{fontSize:18,color:'#FFFFFF'},
  dockLabel:{fontSize:9,fontWeight:'800',color:'#D1D5DB',marginTop:2},
  dockLabelActive:{color:'#FFFFFF'},
  pressed:{opacity:0.72,transform:[{scale:0.98}]},
  modalSafe:{flex:1,backgroundColor:'transparent'},
  modalBackdrop:{flex:1,backgroundColor:'#00000066',justifyContent:'flex-end'},
  sheet:{maxHeight:'86%',backgroundColor:'#F7F8FA',borderTopLeftRadius:30,borderTopRightRadius:30,paddingTop:16},
  sheetHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingBottom:10},
  sheetTitleWrap:{flex:1},
  sheetTitle:{fontSize:23,fontWeight:'900',color:'#111827'},
  sheetHint:{fontSize:9,fontWeight:'900',letterSpacing:1.5,color:'#9CA3AF',marginTop:3},
  closeButton:{width:38,height:38,borderRadius:12,backgroundColor:'#E5E7EB',alignItems:'center',justifyContent:'center'},
  closeText:{fontSize:17,fontWeight:'900',color:'#374151'},
  sheetContent:{padding:20,paddingBottom:40,gap:18},
  section:{gap:9},
  sectionTitle:{fontSize:12,fontWeight:'900',color:'#6B7280',textTransform:'uppercase',letterSpacing:1.2},
  itemGrid:{gap:8},
  item:{minHeight:54,borderRadius:16,backgroundColor:'#FFFFFF',paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderColor:'#E5E7EB'},
  itemIcon:{fontSize:18,width:28,textAlign:'center'},
  itemLabel:{flex:1,fontSize:14,fontWeight:'800',color:'#111827'},
  itemArrow:{fontSize:18,color:'#9CA3AF'},
});
