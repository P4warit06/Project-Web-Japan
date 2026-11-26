"use client";

import { useEffect } from "react";
import { useT } from "@/components/i18n/locale-provider";
import { buttonClass } from "@/components/ui/button";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useT();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section role="alert" className="py-10">
      <h1 className="voice mb-2 text-[1.75rem] leading-[1.35] font-semibold">{t("error.title")}</h1>
      <p className="mb-6 text-soft">{t("error.body")}</p>
      <button type="button" className={buttonClass("primary")} onClick={() => unstable_retry()}>
        {t("error.retry")}
      </button>
    </section>
  );
}
