import Link from "next/link";
import { formatDateTime, lineStyle } from "@/components/format";
import { PhotoGrid } from "@/components/media/photo";
import { PhotoUploader } from "@/components/media/photo-uploader";
import { BackLink } from "@/components/ui/back-link";
import { LinkButton, buttonClass } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { MemoryForm } from "@/components/memory/memory-form";
import { MemoryStops } from "@/components/memory/memory-stops";
import { createMemoryAction, deleteMemoryAction, updateMemoryAction } from "../actions";
import { getMemory, listMemories, listTrips } from "../data";
import { useLocation } from "../router";
import { NotFound, useTitle, useView } from "../view";

export function MemoriesPage() {
  const { t, locale, s } = useView();
  useTitle(t("nav.memories"));
  const memories = listMemories(s);
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
      {memories.length === 0 ? (
        <EmptyState
          title={t("memories.empty.title")}
          body={t("memories.empty.body")}
          action={{ href: "/memories/new", label: t("memories.new") }}
        />
      ) : (
        <MemoryStops memories={memories} t={t} locale={locale} showTrip tone="neutral" groupByMonth />
      )}
    </>
  );
}

export function NewMemoryPage() {
  const { t, s } = useView();
  const { query } = useLocation();
  useTitle(t("memories.new"));
  const preselected = query.get("trip") ?? undefined;
  const options = listTrips(s).map((trip) => ({ value: trip.id, label: trip.title }));

  if (options.length === 0) {
    return (
      <>
        <PageHeader title={t("memories.new")} back={{ href: "/memories", label: t("nav.memories") }} />
        <EmptyState
          title={t("memories.needTrip.title")}
          body={t("memories.needTrip.body")}
          action={{ href: "/trips/new", label: t("trips.new") }}
        />
      </>
    );
  }
  const tripId = options.some((o) => o.value === preselected) ? preselected! : options[0].value;
  return (
    <>
      <PageHeader title={t("memories.new")} back={{ href: "/memories", label: t("nav.memories") }} />
      <MemoryForm action={createMemoryAction} tripId={tripId} tripOptions={options} cancelHref={`/trips/${tripId}`} />
    </>
  );
}

export function EditMemoryPage({ memoryId }: { memoryId: string }) {
  const { t, s } = useView();
  useTitle(t("memories.edit"));
  const memory = getMemory(s, memoryId);
  if (!memory) return <NotFound />;
  return (
    <>
      <PageHeader title={t("memories.edit")} back={{ href: `/memories/${memory.id}`, label: memory.title }} />
      <MemoryForm action={updateMemoryAction} memory={memory} tripId={memory.tripId} cancelHref={`/memories/${memory.id}`} />
    </>
  );
}

export function MemoryPage({ memoryId }: { memoryId: string }) {
  const { t, locale, s } = useView();
  const memory = getMemory(s, memoryId);
  useTitle(memory?.title);
  if (!memory) return <NotFound />;
  return (
    <article>
      <BackLink href={`/trips/${memory.tripId}`} label={memory.tripTitle} />
      <div className="route route-single" style={lineStyle(memory.tripId)}>
        <span className="route-ring route-ring-start" aria-hidden="true" />
        <time dateTime={memory.happenedAt} className="block text-[0.9375rem] text-soft">
          {formatDateTime(memory.happenedAt, locale)}
        </time>
        <h1 className="voice text-[1.75rem] leading-[1.35] font-semibold [overflow-wrap:anywhere]">{memory.title}</h1>
      </div>
      <p className="voice user-text mt-5 text-[1.0625rem]" style={{ lineHeight: 1.95 }}>
        {memory.content}
      </p>
      {(memory.mood || memory.tags.length > 0) && (
        <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.9375rem]">
          {memory.mood && <span className="rounded-[var(--radius-control)] border border-rule px-2.5 py-0.5">{t(`mood.${memory.mood}`)}</span>}
          {memory.tags.map((tag) => (
            <span key={tag} className="text-soft [overflow-wrap:anywhere]">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <section aria-labelledby="memory-photos" className="mt-10">
        <h2 id="memory-photos" className="mb-3 text-lg font-semibold">
          {t("media.title")}
        </h2>
        <PhotoUploader tripId={memory.tripId} memoryId={memory.id} />
        {memory.media.length > 0 ? (
          <div className="mt-4">
            <PhotoGrid items={memory.media} t={t} altTitle={memory.title} />
          </div>
        ) : (
          <p className="mt-3 text-soft">{t("media.memoryEmpty")}</p>
        )}
      </section>
      <div className="mt-10 flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row">
        <Link href={`/memories/${memory.id}/edit`} className={buttonClass("secondary")}>
          {t("memories.edit")}
        </Link>
        <ConfirmDelete
          action={deleteMemoryAction}
          id={memory.id}
          triggerLabel={t("memories.delete")}
          title={t("memories.delete.title")}
          body={t("memories.delete.body", { title: memory.title })}
          confirmLabel={t("memories.delete.confirm")}
          pendingLabel={t("common.deleting")}
          cancelLabel={t("common.cancel")}
        />
      </div>
    </article>
  );
}
