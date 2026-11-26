"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { UploadResponse } from "@/features/media/types";
import { tryTranslate } from "@/lib/i18n";
import { useT } from "@/components/i18n/locale-provider";
import { PlusIcon } from "@/components/ui/icons";
import { shrinkPhoto } from "./resize";

type Status = "queued" | "resizing" | "uploading" | "done" | "failed";
type Item = { id: number; name: string; status: Status; error?: string };

const CONCURRENCY = 2;
/** Trying the same file again cannot fix these. */
const NOT_RETRYABLE = new Set(["errors.unsupportedImage", "errors.fileTooLarge"]);

function errorKeyForStatus(status: number): string {
  if (status === 413) return "errors.fileTooLarge";
  if (status === 415) return "errors.unsupportedImage";
  if (status === 429) return "errors.tooManyRequests";
  return "errors.uploadFailed";
}

async function upload(blob: Blob, tripId: string, memoryId?: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const body = new FormData();
  body.append("file", blob, "photo.jpg"); // generic name: original file names never leave the phone
  body.append("tripId", tripId);
  if (memoryId) body.append("memoryId", memoryId);
  try {
    const res = await fetch("/api/media", { method: "POST", body });
    let json: UploadResponse | null = null;
    try {
      json = (await res.json()) as UploadResponse;
    } catch {
      // non-JSON body (e.g. a platform-level 413)
    }
    if (json && json.ok) return { ok: true };
    if (json && !json.ok && json.error) return { ok: false, error: json.error };
    return { ok: false, error: errorKeyForStatus(res.status) };
  } catch {
    return { ok: false, error: "errors.uploadFailed" };
  }
}

/** Multi-select photo picker: shrinks every photo in the browser, then uploads at most
 *  two at a time, showing per-file progress. Refreshes the page when a batch finishes. */
export function PhotoUploader({ tripId, memoryId }: { tripId: string; memoryId?: string }) {
  const t = useT();
  const router = useRouter();
  const files = useRef(new Map<number, File>());
  const nextId = useRef(1);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  const patch = useCallback((id: number, change: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...change } : it)));
  }, []);

  const processOne = useCallback(
    async (id: number) => {
      const file = files.current.get(id);
      if (!file) return;
      patch(id, { status: "resizing", error: undefined });
      const shrunk = await shrinkPhoto(file);
      if (!shrunk.ok) {
        patch(id, { status: "failed", error: shrunk.error });
        return;
      }
      patch(id, { status: "uploading" });
      const result = await upload(shrunk.blob, tripId, memoryId);
      if (result.ok) {
        files.current.delete(id);
        patch(id, { status: "done" });
      } else {
        patch(id, { status: "failed", error: result.error });
      }
    },
    [patch, tripId, memoryId],
  );

  const run = useCallback(
    async (ids: number[]) => {
      setBusy(true);
      const queue = [...ids];
      let succeeded = 0;
      const worker = async () => {
        for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
          await processOne(id);
          if (!files.current.has(id)) succeeded += 1;
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, ids.length) }, worker));
      setBusy(false);
      if (succeeded > 0) router.refresh();
    },
    [processOne, router],
  );

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow picking the same photo again
    if (picked.length === 0) return;
    const fresh: Item[] = picked.map((f) => {
      const id = nextId.current++;
      files.current.set(id, f);
      return { id, name: f.name, status: "queued" };
    });
    // Keep only unresolved rows from earlier batches; finished ones are summarised below.
    setItems((prev) => [...prev.filter((it) => it.status === "failed"), ...fresh]);
    void run(fresh.map((f) => f.id));
  };

  const retry = (id: number) => {
    patch(id, { status: "queued", error: undefined });
    void run([id]);
  };

  const dismiss = (id: number) => {
    files.current.delete(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const failed = items.filter((i) => i.status === "failed");
  const inFlight = items.filter((i) => i.status !== "done" && i.status !== "failed").length;

  let summary = "";
  if (busy && total > 0) summary = t("media.progress", { done, total });
  else if (done > 0 && inFlight === 0) summary = t(done === 1 ? "media.added.one" : "media.added.other", { count: done });

  return (
    <div className="flex flex-col gap-3">
      <label className="pick btn btn-secondary cursor-pointer self-start" aria-disabled={busy}>
        <PlusIcon className="h-5 w-5" />
        {t("media.add")}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy}
          onChange={onPick}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-progress"
        />
      </label>
      <p className="text-sm text-soft">{t("media.hint")}</p>

      <div role="status" aria-live="polite" className="text-[0.9375rem] font-medium">
        {summary}
      </div>

      {(inFlight > 0 || failed.length > 0) && (
        <ul className="flex flex-col gap-2">
          {items
            .filter((it) => it.status !== "done")
            .map((it) => (
              <li
                key={it.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-[var(--radius-control)] border border-rule bg-surface px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem]">{it.name}</p>
                  <p
                    className={`text-sm ${it.status === "failed" ? "font-medium text-danger" : "text-soft"}`}
                    role={it.status === "failed" ? "alert" : undefined}
                  >
                    {it.status === "failed"
                      ? tryTranslate(t, it.error)
                      : it.status === "resizing"
                        ? t("media.status.resizing")
                        : it.status === "uploading"
                          ? t("media.status.uploading")
                          : t("media.status.queued")}
                  </p>
                </div>
                {it.status === "failed" && (
                  <div className="flex shrink-0 gap-1">
                    {!NOT_RETRYABLE.has(it.error ?? "") && (
                      <button type="button" className="btn btn-ghost !min-h-11" onClick={() => retry(it.id)} disabled={busy}>
                        {t("media.retry")}
                      </button>
                    )}
                    <button type="button" className="btn btn-ghost !min-h-11 !text-soft" onClick={() => dismiss(it.id)}>
                      {t("media.dismiss")}
                    </button>
                  </div>
                )}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
