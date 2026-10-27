import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { deleteItem, getItem, setItem } from '@/lib/storage';
import { colors, type Palette, type Scheme } from './tokens';

/** Follows the device until the user picks a theme (Profile), like the web. The pick is kept on the device. */
const KEY = 'theme';

/** `choice` is what the user picked; null means follow the device ("System"). */
type ThemeValue = { scheme: Scheme; choice: Scheme | null; colors: Palette; setScheme: (s: Scheme | null) => void };
const ThemeContext = createContext<ThemeValue | null>(null);

const isScheme = (v: unknown): v is Scheme => v === 'light' || v === 'dark';

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const device = useColorScheme();
  const [saved, setSaved] = useState<Scheme | null>(null);

  useEffect(() => {
    getItem(KEY).then((v) => isScheme(v) && setSaved(v));
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme: Scheme = saved ?? (device === 'light' ? 'light' : 'dark');
    const setScheme = (s: Scheme | null) => {
      setSaved(s);
      if (s) setItem(KEY, s);
      else deleteItem(KEY);
    };
    return { scheme, choice: saved, colors: colors[scheme], setScheme };
  }, [saved, device]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme outside ThemeProvider');
  return value;
}
