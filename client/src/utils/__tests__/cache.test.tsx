import "../../test/setup";
import { beforeEach, afterEach, expect, it } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { Cache } from "../cache";

const previousStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
beforeEach(() => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, String(value)); },
    removeItem: (key: string) => { values.delete(key); },
    clear: () => values.clear(),
  } });
});
afterEach(() => {
  cleanup();
  if (previousStorage) Object.defineProperty(globalThis, "localStorage", previousStorage);
  else Reflect.deleteProperty(globalThis, "localStorage");
});

it("restores private and unlisted flags as booleans after remount", () => {
  const first = renderHook(() => Cache.with(901).useCache("draft", false));
  act(() => first.result.current[1](true));
  first.unmount();
  const restored = renderHook(() => Cache.with(901).useCache("draft", false));
  expect(restored.result.current[0]).toBe(true);
  act(() => restored.result.current[1](false));
  restored.unmount();
  const publicAgain = renderHook(() => Cache.with(901).useCache("draft", true));
  expect(publicAgain.result.current[0]).toBe(false);
});

it("keeps draft settings isolated between articles and clears saved settings", () => {
  const first = renderHook(() => Cache.with(901).useCache("listed", true));
  act(() => first.result.current[1](false));
  expect(renderHook(() => Cache.with(902).useCache("listed", true)).result.current[0]).toBe(true);
  Cache.with(901).clear();
  expect(renderHook(() => Cache.with(901).useCache("listed", true)).result.current[0]).toBe(true);
});
