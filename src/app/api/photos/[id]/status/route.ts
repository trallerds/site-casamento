import { getDb } from "@/lib/db";
import { retryFailedPhoto } from "@/lib/photos";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const photo = await getDb()
    .prepare<[string], { status: string; error: string | null }>(
      `SELECT status, error FROM photo_uploads WHERE public_id = ?`,
    )
    .get(id);

  if (!photo) return Response.json({ error: "Foto não encontrada." }, { status: 404 });

  let retried: boolean | null = null;
  if (photo.status === "failed" && (await isAuthenticated())) {
    retried = (await retryFailedPhoto(id)).ok;
  }

  return Response.json(
    { status: photo.status, error: photo.error, retried },
    { headers: { "Cache-Control": "no-store" } },
  );
}