import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth/dal";
import { getT } from "@/lib/i18n/server";
import { TabBar } from "@/components/shell/tab-bar";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const [{ t }, user] = await Promise.all([getT(), getCurrentUser()]);
  if (!user) redirect("/login");
  return (
    <div className="md:pl-[232px]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold"
      >
        {t("a11y.skip")}
      </a>
      <TabBar
        brand={t("app.name")}
        navLabel={t("nav.label")}
        labels={{
          home: t("nav.home"),
          trips: t("nav.trips"),
          memories: t("nav.memories"),
          gallery: t("nav.gallery"),
          places: t("nav.places"),
          settings: t("nav.settings"),
        }}
      />
      <main
        id="main"
        className="mx-auto w-full max-w-[42rem] pt-[calc(1.5rem+env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(6.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:px-10 md:pt-12 md:pb-20"
      >
        {children}
      </main>
    </div>
  );
}
