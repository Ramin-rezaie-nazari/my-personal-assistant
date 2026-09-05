import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BRAND } from '../lib/branding';
import { useAppLocale } from '../lib/i18n';

export function AppErrorState({
  title,
  message,
  retryLabel,
  onRetry,
}: {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
}) {
  const isFa = useAppLocale() === 'fa';
  const resolvedTitle = title ?? (isFa ? 'خطایی پیش آمد' : 'Something went wrong');
  const resolvedRetry = retryLabel ?? (isFa ? 'تلاش دوباره' : 'Retry');
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container} accessibilityRole="alert">
        <View style={styles.icon} accessible accessibilityLabel={isFa ? 'خطا' : 'Error'}>
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text style={[styles.title, isFa && styles.rtl]}>{resolvedTitle}</Text>
        {message ? <Text style={[styles.message, isFa && styles.rtl]}>{message}</Text> : null}
        {onRetry ? (
          <Pressable accessibilityRole="button" accessibilityLabel={resolvedRetry} onPress={onRetry} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>{resolvedRetry}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:BRAND.colors.canvas},container:{flex:1,alignItems:'center',justifyContent:'center',padding:28},icon:{width:56,height:56,borderRadius:28,alignItems:'center',justifyContent:'center',backgroundColor:BRAND.colors.primarySoft,marginBottom:18},iconText:{color:BRAND.colors.primaryStrong,fontSize:28,fontWeight:'800'},title:{color:BRAND.colors.ink,fontSize:20,fontWeight:'800',textAlign:'center'},message:{marginTop:10,maxWidth:320,color:BRAND.colors.muted,fontSize:14,lineHeight:21,textAlign:'center'},button:{marginTop:20,minHeight:48,paddingHorizontal:22,borderRadius:BRAND.radius.control,alignItems:'center',justifyContent:'center',backgroundColor:BRAND.colors.primaryStrong},buttonText:{color:BRAND.colors.white,fontSize:14,fontWeight:'800'},pressed:{opacity:.84,transform:[{scale:.98}]},rtl:{direction:'rtl',textAlign:'right'},
});
