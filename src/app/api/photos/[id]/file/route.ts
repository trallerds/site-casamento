import { getDb, type PhotoUpload } from "@/lib/db";
import { isAuthenticated, unauthorized } from "@/lib/auth";
import { getPhotoStorage, isUnsafeStorageKey } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthenticated())) return unauthorized();

  const { id } = await params;
  const photo = getDb()
    .prepare<[string], PhotoUpload>(`SELECT * FROM photo_uploads WHERE public_id = ?`)
    .get(id);

  if (!photo || !photo.storage_key) {
    return Response.json({ error: "Arquivo não disponível." }, { status: 404 });
  }

  if (photo.storage_provider === "local" && isUnsafeStorageKey(photo.storage_key)) {
    return Response.json({ error: "Caminho inválido." }, { status: 400 });
  }

  const file = await getPhotoStorage().read(photo.storage_key);
  if (!file) {
    return Response.json({ error: "Arquivo não encontrado no armazenamento." }, { status: 404 });
  }

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${photo.public_id}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}