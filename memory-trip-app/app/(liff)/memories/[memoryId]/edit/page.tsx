import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateMemoryAction } from "@/features/memories/actions";
import { getMemory } from "@/features/memories/service";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { MemoryForm } from "@/components/memory/memory-form";

type Props = { params: Promise<{ memoryId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("memories.edit") };
}

export default async function EditMemoryPage({ params }: Props) {
  const { memoryId } = await params;
  const [{ t }, memory] = await Promise.all([getT(), getMemory(memoryId)]);
  if (!memory) notFound();
  return (
    <>
      <PageHeader title={t("memories.edit")} back={{ href: `/memories/${memory.id}`, label: memory.title }} />
      <MemoryForm
        action={updateMemoryAction}
        memory={memory}
        tripId={memory.tripId}
        cancelHref={`/memories/${memory.id}`}
      />
    </>
  );
}
