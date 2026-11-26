import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Maitree } from "next/font/google";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getT } from "@/lib/i18n/server";
import "./globals.css";

// Both families carry real Thai AND Latin glyphs (Geist has no Thai).
// Plex Sans Thai = interface. Maitree (serif) = the couple's own words.
const ui = IBM_Plex_Sans_Thai({
  variable: "--font-ui",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const voice = Maitree({
  variable: "--font-voice",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: { default: t("app.name"), template: `%s | ${t("app.name")}` },
    description: t("app.description"),
    applicationName: t("app.name"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f3f8" },
    { media: "(prefers-color-scheme: dark)", color: "#10142a" },
  ],
  colorScheme: "light dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await getT();
  return (
    <html lang={locale} className={`${ui.variable} ${voice.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
