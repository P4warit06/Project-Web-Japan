import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMemoryAction } from "@/features/memories/actions";
import { getMemory } from "@/features/memories/service";
import { getT } from "@/lib/i18n/server";
import { formatDateTime, lineStyle } from "@/components/format";
import { PhotoGrid } from "@/components/media/photo";
import { PhotoUploader } from "@/components/media/photo-uploader";
import { BackLink } from "@/components/ui/back-link";
import { buttonClass } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";

type Props = { params: Promise<{ memoryId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { memoryId } = await params;
  const memory = await getMemory(memoryId);
  return { title: memory?.title ?? undefined };
}

export default async function MemoryPage({ params }: Props) {
  const { memoryId } = await params;
  const [{ t, locale }, memory] = await Promise.all([getT(), getMemory(memoryId)]);
  if (!memory) notFound();
  return (
    <article>
      <BackLink href={`/trips/${memory.tripId}`} label={memory.tripTitle} />
      <div className="route route-single" style={lineStyle(memory.tripId)}>
        <span className="route-ring route-ring-start" aria-hidden="true" />
        <time dateTime={memory.happenedAt} className="block text-[0.9375rem] text-soft">
          {formatDateTime(memory.happenedAt, locale)}
        </time>
        <h1 className="voice text-[1.75rem] leading-[1.35] font-semibold [overflow-wrap:anywhere]">
          {memory.title}
        </h1>
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
