import { useColorScheme } from 'react-native';

export const fonts = {
  serif: 'Newsreader_500Medium',
  serifBold: 'Newsreader_600SemiBold',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansBold: 'Inter_600SemiBold',
};

export type Theme = {
  scheme: 'light' | 'dark';
  bg: string;
  surface: string;
  text: string;
  muted: string;
  faint: string;
  hairline: string;
  accent: string;
  onAccent: string;
};

const light: Theme = {
  scheme: 'light',
  bg: '#FBFAF7',
  surface: '#F3F1EC',
  text: '#1B1A18',
  muted: '#77726A',
  faint: '#A8A399',
  hairline: '#E7E3DB',
  accent: '#B4532A',
  onAccent: '#FFFFFF',
};

const dark: Theme = {
  scheme: 'dark',
  bg: '#131312',
  surface: '#1E1D1B',
  text: '#ECE9E3',
  muted: '#9A958C',
  faint: '#6A665F',
  hairline: '#2A2927',
  accent: '#E08A5E',
  onAccent: '#131312',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
