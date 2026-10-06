import { sql, type PhotoUpload } from "@/lib/db";
import { randomId } from "@/lib/format";
import {
  createPhotoRecord,
  maxPhotoBytes,
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
  const guard = await rateLimit(`photos:${clientIp(request)}`, hourlyLimit(), 60 * 60 * 1000);
  if (!guard.allowed) return tooManyRequests(guard.retryAfterSeconds);

  // Rejeita antes de bufferizar: sem isso um corpo gigante
  // ocupa memoria ate o formData() terminar.
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declared) && declared > maxPhotoBytes() + 1024 * 1024) {
    return Response.json(
      { error: "Esta foto ultrapassa o limite. Escolha uma imagem menor." },
      { status: 413 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Não conseguimos abrir esse arquivo. Escolha a foto novamente." }, { status: 400 });
  }

  const file = form.get("photo");
  if (!(file instanceof File)) {
    return Response.json({ error: "Escolha uma foto antes de enviar." }, { status: 400 });
  }

  let validated: { buffer: Buffer; mimeType: string };
  try {
    validated = await readAndValidatePhoto(file);
  } catch (error) {
    if (error instanceof PhotoValidationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "Não conseguimos abrir essa imagem. Escolha outra foto." }, { status: 400 });
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
    return Response.json({ error: "Não conseguimos receber sua foto agora. Tente novamente." }, { status: 500 });
  }

  const result = await pushToStorage(photo, validated.buffer);
  if (!result.uploaded && !result.recoverable) {
    return Response.json(
      { error: "Não conseguimos guardar sua foto agora. Ela continua no seu aparelho; tente novamente." },
      { status: 503 },
    );
  }

  return Response.json(
    {
      publicId,
      status: result.uploaded ? "uploaded" : "failed",
      message: result.uploaded
        ? "Sua foto já está guardada no Drive. Obrigada por compartilhar esse momento."
        : "Recebemos sua foto. Ela ficou guardada temporariamente e as noivas poderão tentar enviá-la ao Drive novamente; não precisa reenviar.",
    },
    { status: result.uploaded ? 201 : 202 },
  );
}
