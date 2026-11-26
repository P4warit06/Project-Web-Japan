import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { createT, type TFunction } from "./index";

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Server Components: `const { t, locale } = await getT();` */
export async function getT(): Promise<{ t: TFunction; locale: Locale }> {
  const locale = await getLocale();
  return { t: createT(locale), locale };
}
