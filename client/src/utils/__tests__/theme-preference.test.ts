import '../../test/setup';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { getCurrentColorMode, listenSystemMode, readThemeMode, setThemeMode } from '../darkModeUtils';

describe('Persistent theme preference', () => {
  const oldMedia = window.matchMedia;
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldEvent = globalThis.Event;
  const values = new Map<string, string>();
  const listeners: (() => void)[] = [];
  let systemDark = false;
  beforeAll(() => {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    } });
    globalThis.Event = window.Event;
    window.matchMedia = (() => ({ get matches() { return systemDark; }, addEventListener: (_: string, fn: () => void) => listeners.push(fn) })) as unknown as typeof window.matchMedia;
  });
  afterAll(() => {
    window.matchMedia = oldMedia;
    globalThis.Event = oldEvent;
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  });
  it('restores the same theme on reinitialization and responds to system changes only in system mode', () => {
    values.set('theme', 'dark');
    listenSystemMode();
    expect(getCurrentColorMode()).toBe('dark');
    setThemeMode('light');
    systemDark = true;
    listeners.forEach(fn => fn());
    expect(getCurrentColorMode()).toBe('light');
    listenSystemMode(); // A route/bootstrap call must not reset the saved preference.
    expect(readThemeMode()).toBe('light');
    expect(listeners).toHaveLength(1);
    setThemeMode('system');
    expect(getCurrentColorMode()).toBe('dark');
    systemDark = false;
    listeners.forEach(fn => fn());
    expect(getCurrentColorMode()).toBe('light');
    expect(readThemeMode()).toBe('system');
    values.set('theme', 'invalid');
    expect(readThemeMode()).toBe('system');
  });
});
