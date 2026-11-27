import { getT } from "@/lib/i18n/server";

export default async function Loading() {
  const { t } = await getT();
  return (
    <div role="status" aria-live="polite" className="skeleton">
      <span className="sr-only">{t("common.loading")}</span>
      <div aria-hidden="true" className="mb-8 h-9 w-2/3 rounded bg-surface-2" />
      <ul aria-hidden="true" className="rail rail-neutral">
        {[0, 1, 2].map((i) => (
          <li key={i} className="stop" style={{ "--line": "var(--rule)" } as React.CSSProperties}>
            <div className="mb-2 h-4 w-1/3 rounded bg-surface-2" />
            <div className="mb-2 h-6 w-4/5 rounded bg-surface-2" />
            <div className="h-4 w-full rounded bg-surface-2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
