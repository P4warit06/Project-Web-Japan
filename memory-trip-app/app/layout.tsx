import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai_Looped, Shippori_Mincho, Taviraj, Zen_Kaku_Gothic_New } from "next/font/google";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { MotionProvider } from "@/components/motion/motion-provider";
import { getT } from "@/lib/i18n/server";
import "@fontsource/dseg7-classic/latin-400.css"; // the orange date imprint on photo prints
import "./globals.css";

// Both families carry real Thai AND Latin glyphs (Geist has no Thai).
// Noto Sans Thai Looped = interface: the looped (traditional) Thai style reads easily at small sizes.
// Taviraj (serif) = the couple's own words, like the printed captions of a photo album.
const uiThai = Noto_Sans_Thai_Looped({
  variable: "--font-ui-thai",
  subsets: ["thai"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// Latin letters of the interface: Zen Kaku Gothic New, a Japanese-designed gothic (fits a Japan trip book).
// Thai glyphs fall back to the looped face above.
const uiLatin = Zen_Kaku_Gothic_New({
  variable: "--font-ui-latin",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// Big headlines (Latin): Shippori Mincho, a mincho (the serif of Japanese print), like a book title.
// Thai headlines fall back to Taviraj.
const display = Shippori_Mincho({
  variable: "--font-display-latin",
  subsets: ["latin"],
  weight: "600",
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
    <html lang={locale} className={`${uiThai.variable} ${uiLatin.variable} ${display.variable} ${voice.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <LocaleProvider locale={locale}>
          <MotionProvider>{children}</MotionProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
