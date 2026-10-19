import React ,{createContext,useContext,useMemo} from 'react';
import {useColorScheme} from 'react-native';
import {lightColors,darkColors,Colors} from './colors';
import {fonts,sizes,spacing,radius} from './typography';

type Theme = {
  colors: Colors;
  isDark: boolean;
  fonts: typeof fonts;
  sizes: typeof sizes;
  spacing: typeof spacing;
  radius: typeof radius;
};

const ThemeContext=createContext<Theme | null>(null);

export function ThemeProvider({children}:{children:React.ReactNode}){
    const scheme=useColorScheme();
    const isDark=scheme==='dark';

    const theme=useMemo<Theme>(
        ()=>({
            colors:isDark? darkColors : lightColors,
            isDark,
            fonts,
            sizes,
            spacing,
            radius,
        }),
        [isDark]
    );
    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
}

export function useTheme(){
    const ctx=useContext(ThemeContext);
    if(!ctx) throw new Error('usetheme must be used inside themeprovider');
    return ctx;
}