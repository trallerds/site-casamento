import { saveSettingsAction } from "@/app/admin/actions";
import { getSettings } from "@/lib/settings";
import { pixProviderHealth, pixProviderName } from "@/lib/pix";
import { photoStorageHealth } from "@/lib/storage";

export const dynamic = "force-dynamic";

function parseConfig(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ salvo?: string }>;
}) {
  const query = await searchParams;
  const [settings, pix, storage, pixMode] = await Promise.all([
    getSettings(),
    pixProviderHealth(),
    photoStorageHealth(),
    pixProviderName(),
  ]);
  const openpix = parseConfig(settings.pix_provider_config);
  const drive = parseConfig(settings.google_drive_config);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-navy-900">Configurações</h1>
      {query.salvo ? <p className="mt-2 text-sm text-gold-700">Configurações salvas.</p> : null}

      <form action={saveSettingsAction} className="mt-6 space-y-8">
        <Section title="Casamento">
          <TextField label="Nomes" name="wedding_names" defaultValue={settings.wedding_names} />
          <TextField
            label="Data"
            name="wedding_date"
            defaultValue={settings.wedding_date}
            type="date"
          />
          <TextField label="Horário" name="wedding_time" defaultValue={settings.wedding_time ?? "19:00"} type="time" />
          <TextField label="Local" name="wedding_venue" defaultValue={settings.wedding_venue} />
          <TextField label="Endereço" name="wedding_address" defaultValue={settings.wedding_address} />
          <TextField label="Link do Google Maps" name="wedding_maps_url" defaultValue={settings.wedding_maps_url ?? "https://share.google/D9bzAuECKilvEbU6t"} type="url" />
          <TextField label="Estacionamento / acesso" name="wedding_parking" defaultValue={settings.wedding_parking} />
          <TextField label="Link ou arquivo do convite" name="wedding_invitation_url" defaultValue={settings.wedding_invitation_url || "https://drive.google.com/file/d/1-0Xc7VTBQ14IW-3yRS46n5BB0X3AeaJ9/view?usp=sharing"} placeholder="https://…" type="url" />
          <TextField label="Dress code" name="wedding_dress_code" defaultValue={settings.wedding_dress_code ?? "Social"} />
          <TextField label="Frase da capa" name="hero_title" defaultValue={settings.hero_title} />
        </Section>

        <Section title="Pix">
          <SelectField
            label="Provedor"
            name="pix_provider"
            defaultValue={pixMode}
            options={[
              { value: "manual", label: "Chave Pix única (confirmação manual)" },
              { value: "openpix", label: "OpenPix (Pix dinâmico + webhook)" },
            ]}
          />
          <TextField
            label="Chave Pix (e-mail, telefone, CPF ou aleatória)"
            name="pix_key"
            defaultValue={settings.pix_key}
            placeholder="jessica.eeeeeeee@gmail.com"
          />
          <p className="text-xs leading-relaxed text-navy-800/55">
            Com a chave preenchida, o sistema monta um Pix Copia e Cola por presente já com o valor
            (<code>R$ 80,00</code>) e o identificador da cobrança. O convidado só cola e paga.
          </p>
          <TextField
            label="Cidade do recebedor (até 15 caracteres)"
            name="pix_recipient_city"
            defaultValue={settings.pix_recipient_city}
          />
          <TextField
            label="Chave Pix Copia e Cola completa (alternativa)"
            name="pix_key_payload"
            defaultValue={settings.pix_key_payload}
            textarea
            rows={3}
          />
          <TextField
            label="OpenPix API key"
            name="pix_provider_config[apiKey]"
            defaultValue={openpix.apiKey ?? ""}
            type="password"
            placeholder={openpix.apiKey ? "•••••••• (salva)" : "não configurada"}
          />
          <p className="text-xs leading-relaxed text-navy-800/55">
            O webhook do OpenPix precisa do mesmo valor configurado em{" "}
            <code>OPENPIX_WEBHOOK_TOKEN</code> no ambiente. Sem ele, a confirmação continua manual.
          </p>
        </Section>

        <Section title="Fotos">
          <p className="text-sm leading-relaxed text-navy-800/70">
            As fotos são guardadas no Google Drive das noivas. Se o Drive ficar indisponível, o envio
            será mantido temporariamente para uma nova tentativa.
          </p>
          <TextField
            label="ID da pasta no Drive"
            name="google_drive_folder_id"
            defaultValue={settings.google_drive_folder_id}
          />
          <TextField
            label="Google Client ID"
            name="google_drive_config[clientId]"
            defaultValue={drive.clientId ?? ""}
          />
          <TextField
            label="Google Client Secret"
            name="google_drive_config[clientSecret]"
            defaultValue={drive.clientSecret ?? ""}
            type="password"
          />
          <TextField
            label="Google Refresh Token"
            name="google_drive_config[refreshToken]"
            defaultValue={drive.refreshToken ?? ""}
            type="password"
          />
          <TextField
            label="ID da pasta (config do Drive)"
            name="google_drive_config[folderId]"
            defaultValue={drive.folderId ?? ""}
          />
        </Section>

        <Section title="Integrações (verificado agora)">
          <StatusRow
            title="Pix"
            ok={pix.ok}
            message={`${pix.provider}: ${pix.message}`}
          />
          <StatusRow title="Fotos" ok={storage.ok} message={storage.message} />
          <p className="text-xs leading-relaxed text-navy-800/55">
            A verificação usa as credenciais informadas acima: se aparecer o nome da pasta, a
            conta que autorizou tem permissão de escrita nela. Autorize com{" "}
            <code>npm run drive:auth</code> entrando na conta que é dona da pasta (ou que tem
            acesso de edição), não necessariamente no e-mail das noivas. Pasta compartilhada com
            outra conta funciona desde que a autorização seja feita por essa conta.
          </p>
        </Section>

        <button
          type="submit"
          className="rounded-full bg-navy-900 px-8 py-4 text-sm uppercase tracking-[0.2em] text-ivory"
        >
          Salvar configurações
        </button>
      </form>
    </div>
  );
}

function StatusRow({ title, ok, message }: { title: string; ok: boolean; message: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-navy-900/10 bg-ivory p-4">
      <div>
        <p className="text-[0.62rem] uppercase tracking-[0.2em] text-navy-800/55">{title}</p>
        <p className="mt-1 text-sm text-navy-800/80">{message}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[0.65rem] uppercase tracking-wider ${
          ok ? "bg-navy-100 text-navy-800" : "bg-blush text-navy-900"
        }`}
      >
        {ok ? "Operacional" : "Atenção"}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-navy-900/10 bg-white p-5 shadow-soft">
      <h2 className="font-display text-lg text-navy-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  textarea = false,
  rows = 3,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  textarea?: boolean;
  rows?: number;
  type?: string;
  placeholder?: string;
}) {
  const className =
    "mt-2 w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2.5 text-sm outline-none focus:border-gold-500";
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.16em] text-navy-800/60">{label}</span>
      {textarea ? (
        <textarea name={name} rows={rows} defaultValue={defaultValue} className={className} />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
          className={className}
        />
      )}
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-[0.16em] text-navy-800/60">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-lg border border-navy-900/15 bg-white px-3 py-2.5 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
