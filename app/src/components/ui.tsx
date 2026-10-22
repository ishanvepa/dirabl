import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PropsWithChildren } from 'react';
export const colors = { paper: '#FBF7EF', ink: '#292C26', muted: '#63665C', accent: '#37654C', border: '#D8D8C9' };
export function Screen({ children }: PropsWithChildren) { return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.screen}>{children}</ScrollView>; }
export function Heading({children}: PropsWithChildren) { return <Text style={styles.heading}>{children}</Text>; }
export function Body({children}: PropsWithChildren) { return <Text style={styles.body}>{children}</Text>; }
export function Notice({children}: PropsWithChildren) { return <View accessibilityLiveRegion="polite" style={styles.notice}><Body>{children}</Body></View>; }
export function Busy() { return <ActivityIndicator accessibilityLabel="Loading" color={colors.accent}/>; }
export function Button({title,onPress,disabled=false}: {title: string; onPress: () => void; disabled?: boolean}) {
  return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={[styles.button,disabled && {opacity:0.45}]}><Text style={styles.buttonText}>{title}</Text></Pressable>;
}
export const styles = StyleSheet.create({
  screen:{flexGrow:1,backgroundColor:colors.paper,padding:24,gap:16,paddingBottom:48},
  heading:{fontSize:30,fontWeight:'600',color:colors.ink},body:{fontSize:17,lineHeight:26,color:colors.ink},
  muted:{fontSize:14,color:colors.muted,lineHeight:21},notice:{padding:16,backgroundColor:'#EFEFE3',borderRadius:12},
  button:{backgroundColor:colors.accent,padding:16,borderRadius:12,minHeight:50,alignItems:'center'},
  buttonText:{color:'#FFFFFF',fontSize:17,fontWeight:'600'},
  input:{color:colors.ink,backgroundColor:'#FFFFFF',borderColor:colors.border,borderWidth:1,borderRadius:12,padding:16,fontSize:18,lineHeight:28,minHeight:240,textAlignVertical:'top'},
  card:{padding:18,backgroundColor:'#FFFFFF',borderWidth:1,borderColor:colors.border,borderRadius:14,gap:8},
});
