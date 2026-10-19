export const lightColors = {
  bg: '#EFE6D2',
  surface: '#F7F0DE',
  text: '#1B2A4A',
  muted: '#6C6A5E',
  line: '#C9BC9C',
  primary: '#1F3A6B',   // indigo (buttons)
  expense: '#C8352B',
  income: '#5C7F67',
  seal: '#B8432F',      // hanko button only
  food: '#C8352B',
  bills: '#1F3A6B',
  transport: '#5C7F67',
  fun: '#D9A441',
  other: '#8A6F9E',
};

export const darkColors: typeof lightColors = {
  bg: '#121A2E',
  surface: '#1A2540',
  text: '#EFE6D2',
  muted: '#A3A08F',
  line: '#2C3A5C',
  primary: '#6F8FD1',
  expense: '#E0584C',
  income: '#8DB39A',
  seal: '#C9503C',
  food: '#E0584C',
  bills: '#6F8FD1',
  transport: '#8DB39A',
  fun: '#E8BB5C',
  other: '#B79BCB',
};

export type Colors = typeof lightColors;