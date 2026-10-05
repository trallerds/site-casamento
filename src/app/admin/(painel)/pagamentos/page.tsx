import { cancelPaymentAction, confirmPaymentAction } from "@/app/admin/actions";
import { formatBRL, formatDateTime } from "@/lib/format";
import { listPayments } from "@/lib/queries";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  expired: "Expirado",
  cancelled: "Cancelado",
  failed: "Falhou",
};

export default async function AdminPaymentsPage() {
  const payments = await listPayments();

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-900">Pagamentos</h1>
      <p className="mt-2 text-sm text-navy-800/65">
        Só o webhook do provedor marca um pagamento como pago. A confirmação manual serve para
        conciliação quando o banco já informou o Pix por fora.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-navy-900/10 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-navy-900/10 bg-ivory text-[0.62rem] uppercase tracking-[0.16em] text-navy-800/55">
            <tr>
              <th className="px-4 py-3 font-medium">Presente</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Criado</th>
              <th className="px-4 py-3 font-medium">Pago</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-navy-800/55">
                  Nenhuma cobrança aberta ainda.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="border-b border-navy-900/5 last:border-0">
                  <td className="px-4 py-3">
                    <a
                      href={`/presentes/${payment.gift_slug}`}
                      className="text-navy-900 underline-offset-4 hover:underline"
                    >
                      {payment.gift_name}
                    </a>
                    <p className="text-xs text-navy-800/45">{payment.public_id}</p>
                  </td>
                  <td className="px-4 py-3 text-navy-800/75">{formatBRL(payment.amount_cents)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-navy-100 px-2.5 py-1 text-[0.65rem] uppercase tracking-wider text-navy-800">
                      {STATUS_LABEL[payment.status] ?? payment.status}
                    </span>
                    {payment.claimed_at && payment.status !== "paid" ? (
                      <p className="mt-1 text-[0.65rem] text-gold-700">Convidado disse que pagou</p>
                    ) : null}
                    {payment.error ? (
                      <p className="mt-1 text-[0.65rem] font-medium text-gold-700">
                        {payment.error}
                      </p>
                    ) : null}
                    {payment.oversold === 1 ? (
                      <p className="mt-1 text-[0.65rem] font-medium text-navy-900">
                        Pago depois das cotas acabarem — definir com o convidado
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-navy-800/60">{formatDateTime(payment.created_at)}</td>
                  <td className="px-4 py-3 text-xs text-navy-800/60">{formatDateTime(payment.paid_at)}</td>
                  <td className="px-4 py-3">
                    {payment.status === "paid" ? (
                      <span className="text-xs text-navy-800/45">
                        {payment.confirmed_by_admin ? "conciliado" : "via webhook"}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        <form action={confirmPaymentAction}>
                          <input type="hidden" name="id" value={payment.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-navy-900/15 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-navy-800/70"
                          >
                            Conciliar
                          </button>
                        </form>
                        <form action={cancelPaymentAction}>
                          <input type="hidden" name="id" value={payment.id} />
                          <button
                            type="submit"
                            className="rounded-full border border-navy-900/15 px-3 py-1 text-[0.65rem] uppercase tracking-wider text-navy-800/50"
                          >
                            Cancelar
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}