import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/button";

export default async function NotFound() {
  const { t } = await getT();
  return (
    <section className="py-10">
      <h1 className="voice mb-2 text-[1.75rem] leading-[1.35] font-semibold">{t("notFound.title")}</h1>
      <p className="mb-6 text-soft">{t("notFound.body")}</p>
      <LinkButton href="/">{t("notFound.home")}</LinkButton>
    </section>
  );
}
