import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Área das noivas",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-ivory">{children}</div>;
}