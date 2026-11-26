import { z } from "zod";
import { idField, optionalNumber, optionalText, requiredText } from "@/features/common/form";

const base = z.object({
  name: requiredText(120),
  address: optionalText(300),
  note: optionalText(2000),
  latitude: optionalNumber(-90, 90),
  longitude: optionalNumber(-180, 180),
});

// A coordinate needs both numbers, or neither.
const bothOrNeither = (v: { latitude: number | null; longitude: number | null }, ctx: z.RefinementCtx) => {
  if ((v.latitude === null) !== (v.longitude === null)) {
    ctx.addIssue({
      code: "custom",
      path: [v.latitude === null ? "latitude" : "longitude"],
      message: "errors.required",
    });
  }
};

export const createPlaceSchema = base.extend({ tripId: idField }).superRefine(bothOrNeither);
export const updatePlaceSchema = base.extend({ id: idField }).superRefine(bothOrNeither);
export const deleteSchema = z.object({ id: idField });
