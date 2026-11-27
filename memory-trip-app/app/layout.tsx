import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai_Looped, Taviraj } from "next/font/google";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { getT } from "@/lib/i18n/server";
import "@fontsource/dseg7-classic/latin-400.css"; // the orange date imprint on photo prints
import "./globals.css";

// Both families carry real Thai AND Latin glyphs (Geist has no Thai).
// Noto Sans Thai Looped = interface: the looped (traditional) Thai style reads easily at small sizes.
// Taviraj (serif) = the couple's own words, like the printed captions of a photo album.
const ui = Noto_Sans_Thai_Looped({
  variable: "--font-ui",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const voice = Taviraj({
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
