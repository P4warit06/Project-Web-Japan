import { LOCALES } from "@/lib/i18n/config";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { PageHeader } from "@/components/ui/page-header";
import { resetDemoAction } from "../actions";
import { localeStore } from "../store";
import { demoText } from "../strings";
import { useTitle, useView } from "../view";

export function SettingsPage() {
  const { t, locale } = useView();
  useTitle(t("nav.settings"));
  const d = demoText[locale];
  return (
    <>
      <PageHeader title={t("nav.settings")} />
      <div className="flex flex-col gap-10">
        <section aria-labelledby="set-lang">
          <h2 id="set-lang" className="mb-1 text-lg font-semibold">
            {t("settings.language")}
          </h2>
          <p className="mb-3 text-soft">{t("settings.languageHint")}</p>
          <div className="flex flex-wrap gap-2">
            {LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                lang={code}
                className="chip"
                aria-current={code === locale ? "true" : undefined}
                onClick={() => localeStore.set(code)}
              >
                {t(`settings.lang.${code}`)}
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="set-demo">
          <h2 id="set-demo" className="mb-1 text-lg font-semibold">
            {d.demoAccount}
          </h2>
          <p className="mb-2 text-soft">{d.demoAccountBody}</p>
          <p className="mb-3 text-soft">{d.storageNote}</p>
          <ConfirmDelete
            action={resetDemoAction}
            id="demo-reset"
            triggerLabel={d.resetTrigger}
            title={d.resetTitle}
            body={d.resetBody}
            confirmLabel={d.resetConfirm}
            pendingLabel={t("common.deleting")}
            cancelLabel={t("common.cancel")}
            triggerClassName="btn btn-secondary"
          />
        </section>
      </div>
    </>
  );
}
