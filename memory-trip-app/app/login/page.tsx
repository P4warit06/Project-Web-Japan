import type { Metadata } from "next";
import { devLoginAction } from "@/features/auth/actions";
import { listDevUsers } from "@/features/auth/dal";
import { getT } from "@/lib/i18n/server";
import { LoginForm } from "@/components/shell/login-form";
import { BrandMark } from "@/components/ui/icons";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("login.title") };
}

export default async function LoginPage() {
  const { t } = await getT();
  const users = await listDevUsers();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[26rem] flex-col justify-center px-[max(1.25rem,env(safe-area-inset-left))] py-[max(2.5rem,env(safe-area-inset-top))]">
      <BrandMark className="mb-5 h-10 w-auto text-accent" />
      <h1 className="voice mb-2 text-[2rem] leading-[1.3] font-semibold">{t("app.name")}</h1>
      <p className="mb-8 text-soft">{t("login.tagline")}</p>
      <p className="note mb-6">
        {t("login.devNotice")}
      </p>
      {users.length > 0 ? (
        <LoginForm action={devLoginAction} users={users} />
      ) : (
        <p role="status" className="font-medium">
          {t("login.noUsers")}
        </p>
      )}
    </main>
  );
}
