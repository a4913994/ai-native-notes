import { useState, useEffect } from "react";

export type ThemeMode = 'light' | 'dark' | 'system';
export function readThemeMode(): ThemeMode {
  const value = localStorage.getItem('theme');
  return value === 'light' || value === 'dark' ? value : 'system';
}
export function resolveTheme(mode: ThemeMode, systemDark: boolean): 'light' | 'dark' {
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
}
function applyTheme() {
  const color = resolveTheme(readThemeMode(), window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-color-mode', color);
  window.dispatchEvent(new Event('colorSchemeChange'));
}
export function setThemeMode(mode: ThemeMode) {
  localStorage.setItem('theme', mode);
  applyTheme();
}
let listening = false;
export function listenSystemMode() {
  applyTheme();
  if (listening) return;
  listening = true;
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (readThemeMode() === 'system') applyTheme();
  });
  window.addEventListener('storage', event => {
    if (event.key === 'theme' || event.key === null) applyTheme();
  });
}
export function getCurrentColorMode(): 'light' | 'dark' {
  return document.documentElement.getAttribute('data-color-mode') === 'dark' ? 'dark' : 'light';
}
export function useColorMode() {
  const [color, setColor] = useState(getCurrentColorMode);
  useEffect(() => {
    const update = () => setColor(getCurrentColorMode());
    window.addEventListener('colorSchemeChange', update);
    return () => window.removeEventListener('colorSchemeChange', update);
  }, []);
  return color;
}
export function useThemeMode() {
  const [mode, setMode] = useState(readThemeMode);
  useEffect(() => {
    const update = () => setMode(readThemeMode());
    window.addEventListener('colorSchemeChange', update);
    return () => window.removeEventListener('colorSchemeChange', update);
  }, []);
  return [mode, setThemeMode] as const;
}
