// The demo's storage: one JSON document in this browser's localStorage. Nothing is ever
// sent anywhere. If storage is blocked or full, the demo keeps working in memory only.
import { useSyncExternalStore } from "react";
import { LOCALES, DEFAULT_LOCALE, isLocale, type Locale } from "@/lib/i18n/config";
import { parseState, type DemoState } from "./data";
import { createSeed } from "./seed";

const STATE_KEY = "memory-trip-demo:v1";
const LOCALE_KEY = "memory-trip-demo:locale";

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null; // private mode or blocked storage
  }
}

function write(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false; // storage full or blocked
  }
}

function load(): DemoState {
  const raw = read(STATE_KEY);
  if (raw) {
    try {
      const parsed = parseState(JSON.parse(raw));
      if (parsed) return parsed;
    } catch {
      // corrupted: fall through to the sample data
    }
  }
  return createSeed();
}

let state: DemoState = load();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const demoStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Saves first, then updates the screen. Returns false (nothing changed) if the browser
   *  refuses to store it, for example because photos filled the ~5 MB of storage. */
  commit(next: DemoState): boolean {
    if (!write(STATE_KEY, JSON.stringify(next))) return false;
    state = next;
    emit();
    return true;
  },
  /** Back to the sample data. */
  reset() {
    state = createSeed();
    write(STATE_KEY, JSON.stringify(state));
    emit();
  },
};

export function useDemoState(): DemoState {
  return useSyncExternalStore(demoStore.subscribe, demoStore.get, demoStore.get);
}

// ---- language ---------------------------------------------------------------

function loadLocale(): Locale {
  const saved = read(LOCALE_KEY);
  if (isLocale(saved)) return saved;
  // First visit: follow the browser language, Thai otherwise (the app's default).
  const prefersEnglish = typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("en");
  return prefersEnglish ? "en" : DEFAULT_LOCALE;
}

let locale: Locale = loadLocale();
const localeListeners = new Set<() => void>();

export const localeStore = {
  get: () => locale,
  subscribe(listener: () => void) {
    localeListeners.add(listener);
    return () => localeListeners.delete(listener);
  },
  set(next: Locale) {
    if (!(LOCALES as readonly string[]).includes(next)) return;
    locale = next;
    write(LOCALE_KEY, next);
    localeListeners.forEach((l) => l());
  },
};

export function useDemoLocale(): Locale {
  return useSyncExternalStore(localeStore.subscribe, localeStore.get, localeStore.get);
}
