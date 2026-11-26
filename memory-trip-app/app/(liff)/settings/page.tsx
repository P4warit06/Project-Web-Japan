import type { Metadata } from "next";
import { logoutAction } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/dal";
import { setLocaleAction } from "@/lib/i18n/actions";
import { LOCALES } from "@/lib/i18n/config";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("nav.settings") };
}

export default async function SettingsPage() {
  const [{ t, locale }, user] = await Promise.all([getT(), getCurrentUser()]);
  return (
    <>
      <PageHeader title={t("nav.settings")} />
      <div className="flex flex-col gap-10">
        <section aria-labelledby="set-lang">
          <h2 id="set-lang" className="mb-1 text-lg font-semibold">
            {t("settings.language")}
          </h2>
          <p className="mb-3 text-soft">{t("settings.languageHint")}</p>
          <form action={setLocaleAction} className="flex flex-wrap gap-2">
            {LOCALES.map((code) => (
              <button
                key={code}
                type="submit"
                name="locale"
                value={code}
                lang={code}
                className="chip"
                aria-current={code === locale ? "true" : undefined}
              >
                {t(`settings.lang.${code}`)}
              </button>
            ))}
          </form>
        </section>

        <section aria-labelledby="set-account">
          <h2 id="set-account" className="mb-1 text-lg font-semibold">
            {t("settings.account")}
          </h2>
          <p className="mb-3 text-soft">
            {t("settings.signedInAs")} <strong className="voice font-semibold text-ink">{user?.displayName}</strong>
          </p>
          <form action={logoutAction}>
            <SubmitButton label={t("settings.logout")} pendingLabel={t("settings.loggingOut")} variant="secondary" />
          </form>
        </section>
      </div>
    </>
  );
}
