import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { PersonalInsightsResponse, getPersonalInsights, hasAuthSession } from '../lib/api';
import { colors, radius, spacing, typography } from '../lib/design-system';
import { MotionPress } from '../lib/motion-components';

const CATEGORY_META: Record<string, { glyph: string; label: string }> = {
  nutrition: { glyph: 'N', label: 'Nutrition' },
  hydration: { glyph: 'H', label: 'Hydration' },
  fitness: { glyph: 'F', label: 'Fitness' },
  consistency: { glyph: 'C', label: 'Consistency' },
};

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const y = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, delay, tension: 72, friction: 10, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [delay, opacity, y]);
  return <Animated.View style={{ opacity, transform: [{ translateY: y }] }}>{children}</Animated.View>;
}

function scoreLabel(score: number) {
  if (score >= 8) return 'Worth your attention';
  if (score >= 5) return 'Worth a look';
  return 'Gentle signal';
}

export default function InsightsPremiumScreen() {
  const [data, setData] = useState<PersonalInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setError(null); setData(await getPersonalInsights()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to load your insights.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void hasAuthSession().then((ok) => { if (ok) void load(); else setLoading(false); }); }, [load]);

  const topInsight = useMemo(() => data?.insights?.slice().sort((a, b) => b.score - a.score)[0] ?? null, [data]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.ink} /></View>;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}>
        <Reveal>
          <View style={styles.topBar}>
            <Link href="/" asChild><MotionPress style={styles.back}><Text style={styles.backText}>Home</Text></MotionPress></Link>
            <View style={styles.links}>
              <Link href="/brain-overview" asChild><MotionPress style={styles.smallLink}><Text style={styles.smallLinkText}>Brain</Text></MotionPress></Link>
              <Link href="/daily" asChild><MotionPress style={styles.smallLink}><Text style={styles.smallLinkText}>Today</Text></MotionPress></Link>
            </View>
          </View>
        </Reveal>

        <Reveal delay={60}>
          <View style={styles.hero}>
            <View style={styles.heroOrb}><Text style={styles.heroGlyph}>◌</Text></View>
            <Text style={styles.eyebrow}>PERSONAL SIGNALS</Text>
            <Text style={styles.title}>A quieter view of how you're doing.</Text>
            <Text style={styles.subtitle}>{data?.summary ?? 'I’m still learning your rhythm.'}</Text>
          </View>
        </Reveal>

        {error ? <Reveal delay={110}><View style={styles.error}><Text style={styles.errorTitle}>Insights are taking a breath.</Text><Text style={styles.errorText}>{error}</Text><MotionPress onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>Try again</Text></MotionPress></View></Reveal> : null}

        {topInsight ? <Reveal delay={130}><View style={styles.featured}>
          <View style={styles.featuredTop}><Text style={styles.featuredEyebrow}>MOST RELEVANT RIGHT NOW</Text><Text style={styles.score}>{topInsight.score}/10</Text></View>
          <Text style={styles.featuredTitle}>{topInsight.title}</Text>
          <Text style={styles.featuredDescription}>{topInsight.description}</Text>
          <Text style={styles.featuredFooter}>{scoreLabel(topInsight.score)}</Text>
        </View></Reveal> : null}

        <Reveal delay={190}><Text style={styles.sectionTitle}>What MYPA is noticing</Text></Reveal>

        {data?.insights?.map((insight, index) => {
          const meta = CATEGORY_META[insight.category] ?? { glyph: '•', label: insight.category };
          return <Reveal key={insight.key} delay={220 + index * 70}>
            <View style={styles.insightCard}>
              <View style={styles.cardTop}>
                <View style={styles.glyphBubble}><Text style={styles.glyph}>{meta.glyph}</Text></View>
                <View style={styles.cardTitleWrap}><Text style={styles.cardTitle}>{insight.title}</Text><Text style={styles.cardMeta}>{meta.label} · {insight.score}/10</Text></View>
              </View>
              <Text style={styles.cardDescription}>{insight.description}</Text>
            </View>
          </Reveal>;
        })}

        {!data?.insights?.length ? <Reveal delay={220}><View style={styles.empty}>
          <Text style={styles.emptyMark}>✦</Text>
          <Text style={styles.emptyTitle}>Nothing needs your attention yet.</Text>
          <Text style={styles.emptyText}>Keep using MYPA naturally. More signal means better, more personal guidance.</Text>
        </View></Reveal> : null}

        <Reveal delay={Math.min(700, 280 + (data?.insights?.length ?? 0) * 70)}>
          <View style={styles.note}><Text style={styles.noteText}>Built from your recent activity · bounded, explainable signals</Text></View>
        </Reveal>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:'#0C1110'},
  content:{padding:spacing.xl,paddingBottom:40,gap:14},
  center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#0C1110'},
  topBar:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  back:{paddingVertical:8},
  backText:{color:'#E9F4EF',fontWeight:'800'},
  links:{flexDirection:'row',gap:8},
  smallLink:{paddingHorizontal:10,paddingVertical:8,backgroundColor:'#15201C',borderRadius:radius.sm},
  smallLinkText:{color:'#B7CCC3',fontSize:11,fontWeight:'800'},
  hero:{paddingTop:8,paddingBottom:8},
  heroOrb:{width:56,height:56,borderRadius:28,backgroundColor:'#13211C',alignItems:'center',justifyContent:'center',marginBottom:14,borderWidth:1,borderColor:'#28463A'},
  heroGlyph:{fontSize:30,color:'#67E0B0'},
  eyebrow:{color:'#66D7AA',...typography.eyebrow},
  title:{color:'#F6FBF8',fontSize:30,fontWeight:'900',lineHeight:36,marginTop:6},
  subtitle:{color:'#AABDB5',fontSize:13,lineHeight:20,marginTop:8,maxWidth:340},
  error:{backgroundColor:'#211817',borderWidth:1,borderColor:'#4A2E2B',borderRadius:20,padding:16},
  errorTitle:{color:'#FFF0EE',fontSize:15,fontWeight:'900'},
  errorText:{color:'#CDB9B5',fontSize:12,lineHeight:18,marginTop:5},
  retry:{alignSelf:'flex-start',marginTop:11,backgroundColor:'#EAF8F1',paddingHorizontal:14,paddingVertical:9,borderRadius:10},
  retryText:{color:'#17382C',fontWeight:'900'},
  featured:{backgroundColor:'#102019',borderRadius:26,padding:20,borderWidth:1,borderColor:'#203A31'},
  featuredTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  featuredEyebrow:{color:'#74DDB6',fontSize:10,fontWeight:'900',letterSpacing:1.3},
  score:{color:'#DFF8ED',fontWeight:'900',fontSize:14},
  featuredTitle:{color:'#FFFFFF',fontSize:23,fontWeight:'900',lineHeight:28,marginTop:14},
  featuredDescription:{color:'#BFD1C9',fontSize:13,lineHeight:20,marginTop:7},
  featuredFooter:{color:'#70D8B0',fontSize:11,fontWeight:'800',marginTop:16},
  sectionTitle:{color:'#EEF7F3',fontSize:18,fontWeight:'900',marginTop:6},
  insightCard:{backgroundColor:'#121A17',borderRadius:20,padding:17,borderWidth:1,borderColor:'#1E2A26'},
  cardTop:{flexDirection:'row',alignItems:'center'},
  glyphBubble:{width:42,height:42,borderRadius:21,backgroundColor:'#173026',alignItems:'center',justifyContent:'center',marginRight:11},
  glyph:{color:'#68D9AC',fontSize:16,fontWeight:'900'},
  cardTitleWrap:{flex:1},
  cardTitle:{color:'#F3F8F5',fontSize:15,fontWeight:'900'},
  cardMeta:{color:'#8CA29A',fontSize:10,fontWeight:'800',marginTop:4},
  cardDescription:{color:'#B7C9C1',fontSize:12,lineHeight:19,marginTop:12},
  empty:{backgroundColor:'#111916',borderRadius:22,padding:26,alignItems:'center',borderWidth:1,borderColor:'#1E2A26'},
  emptyMark:{color:'#6CDEB3',fontSize:28},
  emptyTitle:{color:'#F1F8F4',fontSize:18,fontWeight:'900',textAlign:'center',marginTop:8},
  emptyText:{color:'#98AAA3',fontSize:12,lineHeight:18,textAlign:'center',marginTop:6},
  note:{alignItems:'center',paddingTop:6},
  noteText:{color:'#667771',fontSize:10},
});
