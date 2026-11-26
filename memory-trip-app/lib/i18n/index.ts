// Pure helpers: safe in Server AND Client Components (no cookies, no server-only).
import type { Locale } from "./config";
import { en, type MessageKey } from "./messages/en";
import { th } from "./messages/th";

export type { MessageKey };
export const messages: Record<Locale, Record<MessageKey, string>> = { th, en };

export type TFunction = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

export function createT(locale: Locale): TFunction {
  const dict = messages[locale];
  return (key, vars) => {
    const text = dict[key] ?? en[key] ?? key;
    return vars
      ? text.replace(/\{(\w+)\}/g, (m, name) => String(vars[name] ?? m))
      : text;
  };
}

/** Backend returns i18n keys as plain strings; this safely translates one. */
export function tryTranslate(t: TFunction, key: string | undefined): string {
  return key ? t(key as MessageKey) : "";
}
