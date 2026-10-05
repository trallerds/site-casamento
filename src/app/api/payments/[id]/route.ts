import { findPaymentByPublicId } from "@/lib/queries";
import { toIso } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payment = await findPaymentByPublicId(id);
  if (!payment) return Response.json({ error: "Cobrança não encontrada." }, { status: 404 });

  return Response.json(
    {
      status: payment.status,
      claimed: Boolean(payment.claimed_at),
      createdAt: toIso(payment.created_at),
      paidAt: toIso(payment.paid_at),
      // A validade real so existe no provedor com webhook: o Pix
      // manual nunca expira no banco, entao nao mostramos prazo.
      expiresAt:
        payment.provider === "openpix" ? toIso(payment.expires_at) : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
