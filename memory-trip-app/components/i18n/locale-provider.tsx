"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n/config";
import { createT, type TFunction } from "@/lib/i18n";

const LocaleContext = createContext<Locale>("th");

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Client-side translator for components that cannot receive strings as props. */
export function useT(): TFunction {
  const locale = useLocale();
  return useMemo(() => createT(locale), [locale]);
}
