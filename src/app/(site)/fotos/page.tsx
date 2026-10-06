import type { Metadata } from "next";
import { CallLily } from "@/components/Botanical";
import { PhotoUploader } from "@/components/PhotoUploader";
import { maxPhotoBytes } from "@/lib/photos";

export const metadata: Metadata = {
  title: "Deixar uma foto",
  description: "Tire uma foto com a câmera do celular e envie para as noivas.",
};

export const dynamic = "force-dynamic";

export default function PhotosPage() {
  const maxMB = Math.round(maxPhotoBytes() / (1024 * 1024));

  return (
    <div className="mx-auto max-w-md pt-6">
      <header className="text-center">
        <CallLily className="mx-auto h-12 w-8 text-gold-500/60" />
        <h1 className="mt-4 font-display text-3xl text-navy-900 sm:text-4xl">
          Deixa uma foto com a gente
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-navy-800/75">
          Compartilhe uma lembrança com a gente. Você pode tirar uma foto ou escolher uma imagem do celular.
        </p>
      </header>

      <div className="mt-8 rounded-card border border-navy-900/10 bg-white p-6 shadow-soft md:p-8">
        <PhotoUploader />
      </div>

      <p className="mt-5 text-center text-xs text-navy-800/50">
        Envie JPG, PNG, WebP ou HEIC de até {maxMB} MB. Não precisa instalar um app nem criar cadastro.
      </p>
    </div>
  );
}
