import { View, ScrollView,ViewStyle,StyleSheet} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import {SafeAreaView,Edge} from 'react-native-safe-area-context';
import {Colors} from '@/constants/theme';

interface ScreenProps{
    children:React.ReactNode;
    scrollable?:boolean;
    style?:ViewStyle;
    contentContainerStyle?:ViewStyle;
    edges?:Edge[];
}
const Main = (
{children,
    scrollable=true,
    style,
    contentContainerStyle,
    edges=['top','bottom']
}:ScreenProps) => {
  return (
    <SafeAreaView style={[styles.safeArea,style]} edges={edges}>
<StatusBar style="dark" />
{scrollable? (
<ScrollView
style={styles.flex}
contentContainerStyle={[styles.container,contentContainerStyle]}
showsVerticalScrollIndicator={false}
>
{children}
</ScrollView>
):(
  <View style={[styles.flex, styles.container, contentContainerStyle]}>
    {children}
</View>
)}
    </SafeAreaView>
  )
}

export default Main
export { Main }

const styles=StyleSheet.create({
    safeArea:{
        flex:1,
        backgroundColor:Colors.background
    },
    flex:{
        flex:1
    },
    container:{
        paddingHorizontal:18,
        paddingTop:12,
        paddingBottom:24,
        gap:14
    }
})