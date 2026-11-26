"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { idField, parseForm } from "@/features/common/form";
import type { FormState } from "@/features/common/types";
import { isDevLoginAllowed } from "./dev-login";
import { createSession, deleteSession } from "./session";

const loginSchema = z.object({ userId: idField });

/** Form field: `userId`. Dev-only; always rejected in production (see dev-login.ts). Redirects to "/" on success. */
export async function devLoginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Mock login must never exist in production (real login = LINE, milestone M7).
  if (!isDevLoginAllowed()) {
    return { ok: false, formError: "errors.invalid" };
  }
  const parsed = parseForm(loginSchema, formData);
  if (!parsed.ok) return parsed.state;

  const member = await db.coupleMember.findFirst({
    where: { userId: parsed.data.userId },
    select: { userId: true },
  });
  if (!member) return { ok: false, formError: "errors.notFound" };

  await createSession(member.userId);
  redirect("/");
}

/** <form action={logoutAction}>. Clears session, redirects to "/login". */
export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
