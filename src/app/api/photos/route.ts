import { sql, type PhotoUpload } from "@/lib/db";
import { randomId } from "@/lib/format";
import {
  createPhotoRecord,
  PhotoValidationError,
  pushToStorage,
  readAndValidatePhoto,
} from "@/lib/photos";
import { photoStorageName } from "@/lib/storage";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function hourlyLimit() {
  const parsed = Number(process.env.RATE_LIMIT_PHOTOS_PER_HOUR);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}

export async function POST(request: Request) {
  const guard = rateLimit(`photos:${clientIp(request)}`, hourlyLimit(), 60 * 60 * 1000);
  if (!guard.allowed) return tooManyRequests(guard.retryAfterSeconds);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Não conseguimos ler o arquivo enviado." }, { status: 400 });
  }

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return Response.json({ error: "Selecione uma foto para enviar." }, { status: 400 });
  }

  let validated: { buffer: Buffer; mimeType: string };
  try {
    validated = await readAndValidatePhoto(file);
  } catch (error) {
    if (error instanceof PhotoValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  const publicId = randomId(14);
  const recordId = await createPhotoRecord({
    publicId,
    filename: file.name || "foto.jpg",
    mimeType: validated.mimeType,
    sizeBytes: validated.buffer.byteLength,
    storageProvider: await photoStorageName(),
  });

  const [photo] = await sql<PhotoUpload>(`SELECT * FROM photo_uploads WHERE id = $1`, [recordId]);

  if (!photo) {
    return Response.json({ error: "Falha ao registrar a foto." }, { status: 500 });
  }

  const stored = await pushToStorage(photo, validated.buffer);

  return Response.json(
    {
      publicId,
      status: stored ? "uploaded" : "failed",
      message: stored
        ? "Foto recebida."
        : "Recebemos sua foto e vamos tentar guardar assim que o armazenamento voltar.",
    },
    { status: stored ? 201 : 202 },
  );
}