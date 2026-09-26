import { useColorScheme } from 'react-native';

/**
 * The system sans-serif everywhere (Roboto on most Android phones), like
 * Substack's `system-ui` stack. Nothing to load, so text never swaps fonts.
 */
export const weight = {
  regular: '400',
  bold: '700',
} as const;

export type Theme = {
  scheme: 'light' | 'dark';
  bg: string;
  surface: string;
  text: string;
  muted: string;
  faint: string;
  hairline: string;
};

// Strictly monochrome: no accent colour, emphasis comes from weight and contrast.
const light: Theme = {
  scheme: 'light',
  bg: '#FFFFFF',
  surface: '#F4F4F4',
  text: '#111111',
  muted: '#6B6B6B',
  faint: '#A6A6A6',
  hairline: '#EBEBEB',
};

const dark: Theme = {
  scheme: 'dark',
  bg: '#111111',
  surface: '#1C1C1C',
  text: '#EDEDED',
  muted: '#9A9A9A',
  faint: '#5F5F5F',
  hairline: '#262626',
};

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}
