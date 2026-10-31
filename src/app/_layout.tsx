import  {useEffect} from 'react';
import {Stack} from 'expo-router';
import {StatusBar} from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  ShipporiMincho_400Regular,
  ShipporiMincho_600SemiBold,
} from '@expo-google-fonts/shippori-mincho';
import {
  NotoSansJP_400Regular,
  NotoSansJP_500Medium,
} from '@expo-google-fonts/noto-sans-jp';
import {ThemeProvider,useTheme} from '@/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync();


function Root(){
  const {colors,isDark}=useTheme();
  return(
    <>
    <StatusBar style={isDark? 'light':'dark'}/>
    <Stack
    screenOptions={{
      headerShown:false,
      contentStyle:{
        backgroundColor:colors.bg
      }
    }}
    />
    </>
  )
}
function RootLayout(){
const  [loaded]=useFonts({
    ShipporiMincho_400Regular,
    ShipporiMincho_600SemiBold,
    NotoSansJP_400Regular,
    NotoSansJP_500Medium,
});
useEffect(()=>{
if (loaded) SplashScreen.hideAsync()
},[loaded]);
if(!loaded) return null;

return (
  <ThemeProvider>
    <Root/>
  </ThemeProvider>
)
}