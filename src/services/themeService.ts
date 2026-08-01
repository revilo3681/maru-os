import type { AppSettings } from '../types';

export type ResolvedTheme = 'light' | 'dark';

/** Map AppSettings.themeMode → light | dark (auto follows system). */
export function resolveThemeMode(mode: AppSettings['themeMode']): ResolvedTheme {
  if (mode === 'day') return 'light';
  if (mode === 'night') return 'dark';
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

/** Persist-ready apply: sets data-theme on <html> for --maru-* tokens. */
export function applyThemeMode(mode: AppSettings['themeMode']): ResolvedTheme {
  const resolved = resolveThemeMode(mode);
  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  root.style.colorScheme = resolved;
  return resolved;
}
