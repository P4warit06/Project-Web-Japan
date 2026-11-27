// Shared bits for the demo screens: the translator + data in one hook, a title hook,
// and the "not found" screen.
import { useEffect, useMemo } from "react";
import { createT, type TFunction } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { LinkButton } from "@/components/ui/button";
import type { DemoState } from "./data";
import { useDemoLocale, useDemoState } from "./store";

export const DEMO_USER_NAME = "Alex";

export function useView(): { t: TFunction; locale: Locale; s: DemoState } {
  const locale = useDemoLocale();
  const s = useDemoState();
  const t = useMemo(() => createT(locale), [locale]);
  return { t, locale, s };
}

export function useTitle(title: string | undefined) {
  const { t } = useView();
  useEffect(() => {
    document.title = title ? `${title} | ${t("app.name")}` : t("app.name");
  }, [title, t]);
}

export function NotFound() {
  const { t } = useView();
  useTitle(t("notFound.title"));
  return (
    <section className="py-10">
      <h1 className="voice mb-2 text-[1.75rem] leading-[1.35] font-semibold">{t("notFound.title")}</h1>
      <p className="mb-6 text-soft">{t("notFound.body")}</p>
      <LinkButton href="/">{t("notFound.home")}</LinkButton>
    </section>
  );
}
