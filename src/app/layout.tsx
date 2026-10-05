import type { Metadata, Viewport } from "next";
import "./globals.css";
import { weddingDate, weddingNames } from "@/lib/settings";

export const dynamic = "force-dynamic";

const LOGO_WIDTH = 1008;
const LOGO_HEIGHT = 1063;

/**
 * URL canonica. Sem isso o Next assume localhost e a previa de link, o favicon
 * e o icone de iOS saem apontando para a maquina de quem buildou.
 */
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const metadataBase = new URL(SITE_URL);

export async function generateMetadata(): Promise<Metadata> {
  const names = await weddingNames();
  const year = (await weddingDate()).slice(0, 4) || String(new Date().getFullYear());
  const title = `${names} — Nosso Dia | ${year}`;
  const description =
    "Um cantinho do nosso dia para deixar um presente, uma foto ou uma memória com a gente.";
  // A logo e a unica identidade visual da marca: mesmo arquivo alimenta favicon,
  // icone de iOS e a previa de link. Sem moldura, sem versao redesenhada.
  const logo = new URL("/logo.jpg", metadataBase);

  return {
    metadataBase,
    title: {
      default: title,
      template: `%s · ${names}`,
    },
    description,
    icons: {
      icon: [{ url: logo, type: "image/jpeg" }],
      apple: [{ url: logo, type: "image/jpeg" }],
    },
    openGraph: {
      title,
      description,
      type: "website",
      siteName: title,
      images: [{ url: logo, width: LOGO_WIDTH, height: LOGO_HEIGHT, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [logo.toString()],
    },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#0b2545",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-ivory">{children}</body>
    </html>
  );
}