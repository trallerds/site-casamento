import type { Metadata, Viewport } from "next";
import "./globals.css";
import { weddingNames } from "@/lib/settings";

export async function generateMetadata(): Promise<Metadata> {
  const names = await weddingNames();
  return {
    title: {
      default: `${names} · Deixa Aqui`,
      template: `%s · ${names}`,
    },
    description:
      "Presenteie as noivas com um gesto simbólico e deixe uma foto do nosso dia. Sem cadastro, direto do celular.",
    openGraph: {
      title: `${names} · Deixa Aqui`,
      description: "Um presente e uma foto para o nosso dia.",
      type: "website",
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