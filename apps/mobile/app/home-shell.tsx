import React, { useState } from 'react';
import { Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CommandCenterScreen from './command-center-v2';
import { useAppLocale } from '../lib/i18n';
import { useVisualTheme } from '../lib/visual-theme-context';

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
  const { theme } = useVisualTheme();
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
  const themedStyles = createThemedStyles(theme.colors);
  return (
    <View style={themedStyles.root}>
      <CommandCenterScreen />
      <View pointerEvents="box-none" style={[themedStyles.dockLayer, { paddingBottom: Math.max(insets.bottom, 10) + 8 }]}>
        <View style={themedStyles.dock}>
          <DockButton icon="⌂" label={text.home} onPress={() => undefined} active colors={theme.colors} />
          <DockButton icon="🍽️" label={text.food} onPress={() => go('/meals')} colors={theme.colors} />
          <DockButton icon="🏋️" label={text.fitness} onPress={() => go('/fitness')} colors={theme.colors} />
          <DockButton icon="📅" label={text.planning} onPress={() => go('/daily')} colors={theme.colors} />
          <DockButton icon="☰" label={text.more} onPress={() => setOpen(true)} colors={theme.colors} />
        </View>
      </View>
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={themedStyles.modalSafe}>
          <View style={themedStyles.modalBackdrop}>
            <View style={themedStyles.sheet}>
              <View style={themedStyles.sheetHeader}>
                <View style={themedStyles.sheetTitleWrap}><Text style={themedStyles.sheetTitle}>{text.menuTitle}</Text><Text style={themedStyles.sheetHint}>MYPA</Text></View>
                <Pressable accessibilityRole="button" accessibilityLabel={text.close} onPress={() => setOpen(false)} style={themedStyles.closeButton}><Text style={themedStyles.closeText}>✕</Text></Pressable>
              </View>
              <ScrollView contentContainerStyle={themedStyles.sheetContent} showsVerticalScrollIndicator={false}>
                <FeatureSection title={text.food} items={food} onSelect={go} colors={theme.colors} />
                <FeatureSection title={text.fitness} items={training} onSelect={go} colors={theme.colors} />
                <FeatureSection title={text.planning} items={planning} onSelect={go} colors={theme.colors} />
                <FeatureSection title={text.more} items={extra} onSelect={go} colors={theme.colors} />
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

type ThemeColors = ReturnType<typeof useVisualTheme>['theme']['colors'];

function DockButton({ icon, label, onPress, active, colors }: { icon:string; label:string; onPress:()=>void; active?:boolean; colors:ThemeColors }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.dockButton, active && { backgroundColor: colors.primaryStrong }, pressed && styles.pressed]}><Text style={styles.dockIcon}>{icon}</Text><Text style={[styles.dockLabel, active && styles.dockLabelActive]} numberOfLines={1}>{label}</Text></Pressable>;
}
function FeatureSection({ title, items, onSelect, colors }: { title:string; items:Item[]; onSelect:(route:Route)=>void; colors:ThemeColors }) {
  return <View style={styles.section}><Text style={[styles.sectionTitle, { color: colors.muted }]}>{title}</Text><View style={styles.itemGrid}>{items.map(item=><Pressable key={item.route + item.label} accessibilityRole="button" accessibilityLabel={item.label} onPress={() => onSelect(item.route)} style={({pressed})=>[styles.item,{backgroundColor:colors.surface,borderColor:colors.border},pressed&&styles.pressed]}><Text style={styles.itemIcon}>{item.icon}</Text><Text style={[styles.itemLabel,{color:colors.ink}]}>{item.label}</Text><Text style={[styles.itemArrow,{color:colors.muted}]}>→</Text></Pressable>)}</View></View>;
}
function createThemedStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root:{flex:1,backgroundColor:colors.canvas},
    dockLayer:{position:'absolute',left:0,right:0,bottom:0,alignItems:'center'},
    dock:{width:'94%',maxWidth:520,borderRadius:22,backgroundColor:colors.ink,paddingHorizontal:8,paddingTop:8,flexDirection:'row',justifyContent:'space-around',shadowColor:'#000',shadowOpacity:0.18,shadowRadius:14,shadowOffset:{width:0,height:7},elevation:10},
    modalSafe:{flex:1,backgroundColor:'transparent'},
    modalBackdrop:{flex:1,backgroundColor:'#00000066',justifyContent:'flex-end'},
    sheet:{maxHeight:'86%',backgroundColor:colors.canvas,borderTopLeftRadius:30,borderTopRightRadius:30,paddingTop:16},
    sheetHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20,paddingBottom:10},
    sheetTitleWrap:{flex:1},
    sheetTitle:{fontSize:23,fontWeight:'900',color:colors.ink},
    sheetHint:{fontSize:9,fontWeight:'900',letterSpacing:1.5,color:colors.muted,marginTop:3},
    closeButton:{width:38,height:38,borderRadius:12,backgroundColor:colors.border,alignItems:'center',justifyContent:'center'},
    closeText:{fontSize:17,fontWeight:'900',color:colors.inkSoft},
    sheetContent:{padding:20,paddingBottom:40,gap:18},
  });
}

const styles = StyleSheet.create({
  dockButton:{flex:1,alignItems:'center',justifyContent:'center',minHeight:54,borderRadius:16,paddingHorizontal:4},
  dockIcon:{fontSize:18,color:'#FFFFFF'},
  dockLabel:{fontSize:9,fontWeight:'800',color:'#D1D5DB',marginTop:2},
  dockLabelActive:{color:'#FFFFFF'},
  pressed:{opacity:0.72,transform:[{scale:0.98}]},
  section:{gap:9},
  sectionTitle:{fontSize:12,fontWeight:'900',textTransform:'uppercase',letterSpacing:1.2},
  itemGrid:{gap:8},
  item:{minHeight:54,borderRadius:16,paddingHorizontal:13,flexDirection:'row',alignItems:'center',gap:10,borderWidth:1},
  itemIcon:{fontSize:18,width:28,textAlign:'center'},
  itemLabel:{flex:1,fontSize:14,fontWeight:'800'},
  itemArrow:{fontSize:18},
});