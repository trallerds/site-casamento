import { saveGiftAction, toggleGiftAction } from "@/app/admin/actions";
import { formatBRL } from "@/lib/format";
import { giftPaymentTotals, listAllGifts } from "@/lib/queries";

export const dynamic = "force-dynamic";

const IMAGE_KEYS = ["chopp", "brinde", "sobremesa", "openbar", "terapia", "combustivel", "aviso", "lua", "curitiba"];

export default async function AdminGiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ editar?: string; erro?: string; salvo?: string }>;
}) {
  const query = await searchParams;
  const gifts = listAllGifts();
  const totals = giftPaymentTotals();
  const totalById = new Map(totals.map((row) => [row.gift_id, row]));
  const editing = query.editar ? gifts.find((gift) => gift.slug === query.editar) : null;

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-900">Presentes</h1>
      {query.salvo ? (
        <p className="mt-2 text-sm text-gold-700">Alterações salvas.</p>
      ) : null}
      {query.erro ? (
        <p className="mt-2 text-sm text-gold-700">Informe nome e valor antes de salvar.</p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="overflow-hidden rounded-xl border border-navy-900/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-900/10 bg-ivory text-[0.62rem] uppercase tracking-[0.16em] text-navy-800/55">
              <tr>
                <th className="px-4 py-3 font-medium">Presente</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Recebido</th>
                <th className="px-4 py-3 font-medium">Disponíveis</th>
                <th className="px-4 py-3 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((gift) => {
                const total = totalById.get(gift.id);
                return (
                  <tr key={gift.id} className="border-b border-navy-900/5 last:border-0">
                    <td className="px-4 py-3">
                      <a href={`/admin/presentes?editar=${gift.slug}`} className="text-navy-900 hover:underline">
                        {gift.name}
                      </a>
                      <p className="text-xs text-navy-800/50">{gift.category}</p>
                    </td>
                    <td className="px-4 py-3 text-navy-800/75">{formatBRL(gift.amount_cents)}</td>
                    <td className="px-4 py-3 text-navy-800/75">{formatBRL(total?.paid_cents ?? 0)}</td>
                    <td className="px-4 py-3 text-navy-800/75">
                      {gift.total_quantity - gift.sold_quantity}/{gift.total_quantity}
                      {gift.total_quantity - gift.sold_quantity <= 0 ? (
                        <p className="text-[0.65rem] uppercase tracking-wider text-gold-700">Adquirido</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <form action={toggleGiftAction}>
                          <input type="hidden" name="id" value={gift.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-navy-900/15 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-navy-800/70"
                          >
                            {gift.active ? "Desativar" : "Ativar"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <form action={saveGiftAction} className="space-y-4 rounded-xl border border-navy-900/10 bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg text-navy-900">
            {editing ? `Editar: ${editing.name}` : "Novo presente"}
          </h2>
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

          <Field label="Nome" name="name" defaultValue={editing?.name} />
          <Field label="Descrição" name="description" defaultValue={editing?.description} textarea />
          <Field label="Valor (R$)" name="amount" defaultValue={editing ? (editing.amount_cents / 100).toFixed(2) : ""} />
          <Field label="Categoria" name="category" defaultValue={editing?.category} />

          <label className="block">
            <span className="block text-xs uppercase tracking-[0.16em] text-navy-800/60">Arte</span>
            <select
              name="image_key"
              defaultValue={editing?.image_key ?? "default"}
              className="mt-2 w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2.5 text-sm"
            >
              {["default", ...IMAGE_KEYS].map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </label>

          <Field label="Ordem" name="display_order" defaultValue={String(editing?.display_order ?? 0)} />
          <Field
            label="Total de cotas"
            name="total_quantity"
            defaultValue={String(editing?.total_quantity ?? 1)}
          />
          {editing ? (
            <p className="text-xs leading-relaxed text-navy-800/55">
              {editing.sold_quantity} cota(s) já vendidas. O presente some da lista pública quando
              todas as cotas acabam.
            </p>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-navy-800/80">
            <input
              type="checkbox"
              name="active"
              defaultChecked={editing ? editing.active === 1 : true}
              className="h-4 w-4 rounded border-navy-900/20"
            />
            Visível no site
          </label>

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 rounded-full bg-navy-900 px-5 py-3 text-xs uppercase tracking-[0.18em] text-ivory"
            >
              Salvar
            </button>
            {editing ? (
              <a
                href="/admin/presentes"
                className="rounded-full border border-navy-900/20 px-5 py-3 text-xs uppercase tracking-[0.18em] text-navy-800/70"
              >
                Cancelar
              </a>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  textarea = false,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  textarea?: boolean;
}) {
  const className =
    "mt-2 w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-500";
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.16em] text-navy-800/60">{label}</span>
      {textarea ? (
        <textarea name={name} rows={3} defaultValue={defaultValue} className={className} />
      ) : (
        <input name={name} defaultValue={defaultValue} className={className} />
      )}
    </label>
  );
}