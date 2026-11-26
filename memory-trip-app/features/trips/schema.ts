import { z } from "zod";
import { idField, optionalDate, optionalText, requiredText } from "@/features/common/form";

const base = z.object({
  title: requiredText(120),
  description: optionalText(2000),
  startDate: optionalDate,
  endDate: optionalDate,
});

const endAfterStart = (v: { startDate: Date | null; endDate: Date | null }, ctx: z.RefinementCtx) => {
  if (v.startDate && v.endDate && v.endDate < v.startDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "errors.invalid" });
  }
};

export const createTripSchema = base.superRefine(endAfterStart);
export const updateTripSchema = base.extend({ id: idField }).superRefine(endAfterStart);
export const deleteSchema = z.object({ id: idField });
