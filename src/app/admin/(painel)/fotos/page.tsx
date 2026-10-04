import { hidePhotoAction, retryPhotoAction } from "@/app/admin/actions";
import { formatBytes, formatDateTime } from "@/lib/format";
import { listPhotos } from "@/lib/queries";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  received: "Recebida",
  uploading: "Enviando",
  uploaded: "Guardada",
  failed: "Falhou",
};

export default async function AdminPhotosPage() {
  const photos = await listPhotos();

  return (
    <div>
      <h1 className="font-display text-2xl text-navy-900">Fotos</h1>
      <p className="mt-2 text-sm text-navy-800/65">
        As fotos ficam privadas. "Ocultar" remove a foto da lista do painel; o arquivo continua no
        Drive até ser apagado por lá.
      </p>

      {photos.length === 0 ? (
        <p className="mt-10 rounded-xl border border-navy-900/10 bg-white p-8 text-center text-sm text-navy-800/55">
          Nenhuma foto recebida ainda.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="overflow-hidden rounded-xl border border-navy-900/10 bg-white">
              <img
                src={`/api/photos/${photo.public_id}/file`}
                alt={`Foto enviada ${photo.public_id}`}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="rounded-full bg-navy-100 px-2.5 py-1 uppercase tracking-wider text-navy-800">
                    {STATUS_LABEL[photo.status] ?? photo.status}
                  </span>
                  <span className="text-navy-800/55">{formatBytes(photo.size_bytes)}</span>
                </div>
                <p className="text-xs text-navy-800/60">{formatDateTime(photo.created_at)}</p>
                {photo.status === "failed" ? (
                  <p className="rounded-lg bg-gold-100/70 p-2 text-xs text-navy-900">
                    {photo.error ?? "Falha ao guardar."}
                  </p>
                ) : null}
                <div className="flex gap-2 pt-1">
                  {photo.status === "failed" && photo.staging_key ? (
                    <form action={retryPhotoAction}>
                      <input type="hidden" name="public_id" value={photo.public_id} />
                      <button
                        type="submit"
                        className="rounded-full border border-navy-900/15 px-3 py-1.5 text-[0.65rem] uppercase tracking-wider text-navy-800/70"
                      >
                        Tentar de novo
                      </button>
                    </form>
                  ) : null}
                  <form action={hidePhotoAction}>
                    <input type="hidden" name="public_id" value={photo.public_id} />
                    <button
                      type="submit"
                      className="rounded-full border border-navy-900/15 px-3 py-1.5 text-[0.65rem] uppercase tracking-wider text-navy-800/50"
                    >
                      Ocultar
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}