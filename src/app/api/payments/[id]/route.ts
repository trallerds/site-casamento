import { findPaymentByPublicId } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const payment = findPaymentByPublicId(id);
  if (!payment) return Response.json({ error: "Cobrança não encontrada." }, { status: 404 });

  return Response.json(
    {
      status: payment.status,
      claimed: Boolean(payment.claimed_at),
      createdAt: payment.created_at,
      paidAt: payment.paid_at,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}