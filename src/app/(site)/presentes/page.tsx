import type { Metadata } from "next";
import { GiftBrowser } from "@/components/GiftBrowser";
import { CallLily } from "@/components/Botanical";
import { listGiftsGrouped } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Presentes",
  description: "Escolha um presente simbólico para as noivas e pague via Pix.",
};

export const dynamic = "force-dynamic";

export default async function GiftsPage() {
  const groups = await listGiftsGrouped();

  return (
    <>
      <header className="pt-6 text-center">
        <CallLily className="mx-auto h-12 w-8 text-gold-500/60" />
        <h1 className="mt-4 font-display text-3xl text-navy-900 sm:text-4xl">Lista de presentes</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy-800/75">
          Escolha um gesto, copie o Pix e finalize no aplicativo do seu banco. Sem cadastro, sem
          formulário, sem complicação.
        </p>
      </header>

      <div className="mt-10">
        {groups.length === 0 ? (
          <p className="py-16 text-center text-sm text-navy-800/60">
            Estamos preparando a lista de presentes. Volte daqui a pouquinho.
          </p>
        ) : (
          <GiftBrowser groups={groups} />
        )}
      </div>
    </>
  );
}
