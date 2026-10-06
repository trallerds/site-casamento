import Link from "next/link";
import { formatBRL } from "@/lib/format";
import { dashboardStats, giftPaymentTotals } from "@/lib/queries";
import { pixProviderHealth } from "@/lib/pix";
import { photoStorageHealth } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, totals, pix, storage] = await Promise.all([
    dashboardStats(),
    giftPaymentTotals(),
    pixProviderHealth(),
    photoStorageHealth(),
  ]);

  const cards = [
    { label: "Total recebido", value: formatBRL(stats.paid_cents), hint: `${stats.payments_paid} pagamentos confirmados` },
    { label: "Presentes patrocinados", value: String(stats.payments_paid), hint: `${stats.payments_pending} cobranças em aberto` },
    { label: "Fotos recebidas", value: String(stats.photos_total), hint: `${stats.photos_uploaded} guardadas no Drive` },
    {
      label: "Pagamentos a conferir",
      value: String(stats.payments_unreconciled),
      hint: "aguardando conferência no extrato",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-900">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-navy-900/10 bg-white p-5 shadow-soft"
          >
            <p className="text-[0.62rem] uppercase tracking-[0.2em] text-navy-800/55">{card.label}</p>
            <p className="mt-2 font-display text-2xl text-navy-900">{card.value}</p>
            <p className="mt-1 text-xs text-navy-800/50">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <HealthCard
          title="Pix"
          ok={pix.ok}
          message={pix.message}
          provider={pix.provider}
        />
        <HealthCard title="Fotos" ok={storage.ok} message={storage.message} />
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl text-navy-900">Presentes</h2>
        <div className="rule-gold mt-3 w-16" />
        <div className="mt-5 overflow-hidden rounded-xl border border-navy-900/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-900/10 bg-ivory text-[0.62rem] uppercase tracking-[0.16em] text-navy-800/55">
              <tr>
                <th className="px-4 py-3 font-medium">Presente</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Contribuições</th>
                <th className="px-4 py-3 font-medium">Recebido</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((gift) => (
                <tr key={gift.gift_id} className="border-b border-navy-900/5 last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/presentes?editar=${gift.slug}`}
                      className="text-navy-900 underline-offset-4 hover:underline"
                    >
                      {gift.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-800/75">{formatBRL(gift.amount_cents)}</td>
                  <td className="px-4 py-3 text-navy-800/75">{gift.contributions}</td>
                  <td className="px-4 py-3 text-navy-800/75">{formatBRL(gift.paid_cents)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-wider ${
                        gift.active ? "bg-navy-100 text-navy-800" : "bg-blush text-navy-800/70"
                      }`}
                    >
                      {gift.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HealthCard({
  title,
  ok,
  message,
  provider,
}: {
  title: string;
  ok: boolean;
  message: string;
  provider?: string;
}) {
  return (
    <div className="rounded-xl border border-navy-900/10 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-[0.62rem] uppercase tracking-[0.2em] text-navy-800/55">{title}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-wider ${
            ok ? "bg-navy-100 text-navy-800" : "bg-blush text-navy-900"
          }`}
        >
          {ok ? "Operacional" : "Atenção"}
        </span>
      </div>
      <p className="mt-2 text-sm text-navy-800/80">
        {provider ? `${provider}: ` : ""}
        {message}
      </p>
    </div>
  );
}
