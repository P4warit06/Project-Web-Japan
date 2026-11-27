import Link from "next/link";
import type { MemoryDTO } from "@/features/memories/types";
import type { TFunction } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { Photo } from "@/components/media/photo";
import { formatDateTime, formatMonth, lineStyle, monthKey } from "@/components/format";

type StopStyle = React.CSSProperties & { "--i"?: number };

function Stop({
  memory,
  index,
  t,
  locale,
  showTrip,
  clamp,
  tone,
}: {
  memory: MemoryDTO;
  index: number;
  t: TFunction;
  locale: Locale;
  showTrip: boolean;
  clamp: boolean;
  tone: "trip" | "neutral";
}) {
  const style: StopStyle = { ...lineStyle(memory.tripId), "--i": Math.min(index, 12) };
  return (
    <li className="stop" style={style} data-tone={tone}>
      <time dateTime={memory.happenedAt} className="block text-[0.9375rem] text-soft">
        {formatDateTime(memory.happenedAt, locale)}
      </time>
      <h3 className="voice text-lg leading-[1.4] font-semibold [overflow-wrap:anywhere]">
        <Link
          href={`/memories/${memory.id}`}
          className="after:absolute after:inset-0 after:content-['']"
        >
          {memory.title}
        </Link>
      </h3>
      <p
        className={`voice user-text mt-1 ${clamp ? "line-clamp-4" : ""}`}
        style={{ lineHeight: 1.85 }}
      >
        {memory.content}
      </p>
      {memory.media.length > 0 && (
        <ul className="relative z-10 mt-2 flex gap-1.5">
          {memory.media.slice(0, 3).map((m, i) => {
            const rest = memory.media.length - 3;
            const last = i === 2 && rest > 0;
            return (
              <li key={m.id} className="print relative h-[4.75rem] w-[4.75rem] !p-[0.25rem]">
                <Link href={last ? `/memories/${memory.id}` : `/gallery/${m.id}`} className="print-frame block h-full w-full">
                  <Photo media={m} alt={t("media.alt", { title: memory.title, n: i + 1 })} />
                  {last && (
                    <span
                      className="absolute inset-0 flex items-center justify-center bg-ink/60 font-semibold text-paper"
                      aria-label={t("media.moreLabel", { count: rest })}
                    >
                      +{rest}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {(memory.mood || memory.tags.length > 0 || showTrip) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.9375rem]">
          {memory.mood && (
            <span className="rounded-[var(--radius-control)] border border-rule px-2.5 py-0.5">{t(`mood.${memory.mood}`)}</span>
          )}
          {memory.tags.map((tag) => (
            <span key={tag} className="text-soft [overflow-wrap:anywhere]">
              #{tag}
            </span>
          ))}
          {showTrip && (
            <Link
              href={`/trips/${memory.tripId}`}
              className="relative z-10 inline-flex min-h-11 items-center leading-snug text-accent underline underline-offset-2"
            >
              {memory.tripTitle}
            </Link>
          )}
        </div>
      )}
    </li>
  );
}

/** Memories as stops on a line. On a trip page the line takes the trip's colour;
 *  across trips the line stays neutral and each ring keeps its own trip's colour. */
export function MemoryStops({
  memories,
  t,
  locale,
  showTrip = false,
  clamp = true,
  groupByMonth = false,
  tone = "trip",
  draw = false,
}: {
  memories: MemoryDTO[];
  t: TFunction;
  locale: Locale;
  showTrip?: boolean;
  clamp?: boolean;
  groupByMonth?: boolean;
  tone?: "trip" | "neutral";
  draw?: boolean;
}) {
  const items: React.ReactNode[] = [];
  let prevMonth = "";
  memories.forEach((m, i) => {
    if (groupByMonth) {
      const key = monthKey(m.happenedAt);
      if (key !== prevMonth) {
        prevMonth = key;
        items.push(
          <li key={`m-${key}`} className="stop-month">
            <h2 className="text-[0.9375rem] font-semibold text-soft">{formatMonth(m.happenedAt, locale)}</h2>
          </li>,
        );
      }
    }
    items.push(
      <Stop
        key={m.id}
        memory={m}
        index={i}
        t={t}
        locale={locale}
        showTrip={showTrip}
        clamp={clamp}
        tone={tone}
      />,
    );
  });
  return (
    <ol className={`rail ${tone === "neutral" ? "rail-neutral" : ""} ${draw ? "draw" : ""}`}>{items}</ol>
  );
}
