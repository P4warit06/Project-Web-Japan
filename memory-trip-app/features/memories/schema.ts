import { z } from "zod";
import { idField, requiredDate, requiredText } from "@/features/common/form";
import { normalizeTags } from "./core";
import { MOODS, type Mood } from "./types";

const base = z.object({
  title: requiredText(120),
  content: requiredText(10_000),
  happenedAt: requiredDate,
  mood: z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      if (!(MOODS as readonly string[]).includes(v)) {
        ctx.addIssue({ code: "custom", message: "errors.invalid" });
        return null;
      }
      return v as Mood;
    }),
  tags: z
    .string()
    .max(1000)
    .optional()
    .transform((v, ctx) => {
      const tags = normalizeTags(v ?? "");
      if (!tags) {
        ctx.addIssue({ code: "custom", message: "errors.tooLong" });
        return [];
      }
      return tags;
    }),
});

export const createMemorySchema = base.extend({ tripId: idField });
export const updateMemorySchema = base.extend({ id: idField });
export const deleteSchema = z.object({ id: idField });
