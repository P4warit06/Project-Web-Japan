import type { Metadata } from "next";
import { listMemories } from "@/features/memories/service";
import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { Pager } from "@/components/ui/pager";
import { MemoryStops } from "@/components/memory/memory-stops";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("nav.memories") };
}

export default async function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { cursor: raw } = await searchParams;
  const cursor = typeof raw === "string" && raw ? raw : undefined;
  const [{ t, locale }, page] = await Promise.all([getT(), listMemories({ cursor })]);
  return (
    <>
      <PageHeader
        title={t("nav.memories")}
        actions={
          <LinkButton href="/memories/new">
            <PlusIcon className="h-5 w-5" />
            {t("memories.new")}
          </LinkButton>
        }
      />
      {page.items.length === 0 ? (
        <EmptyState
          title={t("memories.empty.title")}
          body={t("memories.empty.body")}
          action={{ href: "/memories/new", label: t("memories.new") }}
        />
      ) : (
        <MemoryStops memories={page.items} t={t} locale={locale} showTrip tone="neutral" groupByMonth />
      )}
      <Pager
        basePath="/memories"
        nextCursor={page.nextCursor}
        hasCursor={Boolean(cursor)}
        moreLabel={t("common.loadMore")}
        firstLabel={t("common.backToNewest")}
      />
    </>
  );
}
