import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CookieConsent } from "@/components/CookieConsent";
import { SITE_NAME, SITE_URL } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — instrukcije i instruktori u cijeloj Hrvatskoj`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Pronađite instruktora za matematiku, jezike, fiziku, kemiju i druge predmete — uživo, kod kuće ili online. Priprema za državnu maturu. Dogovor i plaćanje izravno s instruktorom.",
  openGraph: { siteName: SITE_NAME, locale: "hr_HR", type: "website" },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#12352d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hr" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
