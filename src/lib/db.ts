import { Pool, types, type PoolClient, type QueryResultRow } from "pg";

// node-postgres devolve int8 (COUNT/SUM) como string e timestamptz como Date.
// O app inteiro assume number e string ISO, entao os dois tipos sao fixados aqui.
types.setTypeParser(20, (value) => Number(value));
types.setTypeParser(1114, (value) => value);
types.setTypeParser(1184, (value) => value);

export type Gift = {
  id: number;
  slug: string;
  name: string;
  description: string;
  image_key: string;
  amount_cents: number;
  total_quantity: number;
  sold_quantity: number;
  category: string;
  display_order: number;
  active: number;
  created_at: string;
  updated_at: string;
};

export type PaymentStatus = "pending" | "paid" | "expired" | "cancelled" | "failed";

export type Payment = {
  id: number;
  public_id: string;
  gift_id: number;
  provider: string;
  provider_charge_id: string | null;
  amount_cents: number;
  status: PaymentStatus;
  pix_code: string | null;
  error: string | null;
  expires_at: string | null;
  paid_at: string | null;
  claimed_at: string | null;
  confirmed_by_admin: number;
  oversold: number;
  created_at: string;
  updated_at: string;
};

export type PhotoStatus = "received" | "uploading" | "uploaded" | "failed";

export type PhotoUpload = {
  id: number;
  public_id: string;
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  storage_provider: string;
  storage_key: string | null;
  staging_key: string | null;
  external_id: string | null;
  status: PhotoStatus;
  error: string | null;
  hidden: number;
  created_at: string;
  uploaded_at: string | null;
};

export type AdminSession = {
  id: number;
  token_hash: string;
  created_at: string;
  expires_at: string;
};

const SCHEMA = `
CREATE TABLE IF NOT EXISTS gifts (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_key TEXT NOT NULL DEFAULT 'default',
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  total_quantity INTEGER NOT NULL DEFAULT 1 CHECK (total_quantity >= 0),
  sold_quantity INTEGER NOT NULL DEFAULT 0 CHECK (sold_quantity >= 0),
  category TEXT NOT NULL DEFAULT 'Momentos da festa',
  display_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  gift_id INTEGER NOT NULL REFERENCES gifts(id),
  provider TEXT NOT NULL,
  provider_charge_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  status TEXT NOT NULL DEFAULT 'pending',
  pix_code TEXT,
  error TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ,
  confirmed_by_admin INTEGER NOT NULL DEFAULT 0,
  oversold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payments_gift_idx ON payments(gift_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);

CREATE TABLE IF NOT EXISTS payment_events (
  id BIGSERIAL PRIMARY KEY,
  payment_id INTEGER REFERENCES payments(id),
  provider_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS photo_uploads (
  id BIGSERIAL PRIMARY KEY,
  public_id TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  storage_provider TEXT NOT NULL DEFAULT 'local',
  storage_key TEXT,
  staging_key TEXT,
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT,
  hidden INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  uploaded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id BIGSERIAL PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

type SeedGift = {
  slug: string;
  name: string;
  description: string;
  image_key: string;
  amount_cents: number;
  category: string;
  total_quantity?: number;
};

const SEED_GIFTS: SeedGift[] = [
  {
    slug: "primeiro-chopp-da-noiva",
    total_quantity: 3,
    name: "Primeiro Chop da Noiva",
    description: "Porque todo grande momento merece um primeiro brinde.",
    image_key: "chopp",
    amount_cents: 8000,
    category: "Momentos da festa",
  },
  {
    slug: "ultimo-chopp-das-noivas",
    total_quantity: 2,
    name: "Último Chop das Noivas",
    description: "O brinde que encerra a noite. Ninguém precisa lembrar disso depois.",
    image_key: "chopp",
    amount_cents: 9000,
    category: "Momentos da festa",
  },
  {
    slug: "brinde-que-ninguem-deveria-tomar",
    total_quantity: 3,
    name: "Aquele Brinde que Ninguém Deveria Tomar",
    description: "Já sabemos como termina. Mesmo assim, ninguém recusa.",
    image_key: "brinde",
    amount_cents: 6000,
    category: "Momentos da festa",
  },
  {
    slug: "sobremesa-das-noivas",
    total_quantity: 2,
    name: "Sobremesa das Noivas",
    description: "A parte mais doce da noite, dividida com você.",
    image_key: "sobremesa",
    amount_cents: 7000,
    category: "Momentos da festa",
  },
  {
    slug: "fundo-emergencial-do-open-bar",
    total_quantity: 2,
    name: "Fundo Emergencial do Open Bar",
    description: "Segurança para o balcão não fechar antes da valsa.",
    image_key: "openbar",
    amount_cents: 25000,
    category: "Presentes perigosamente específicos",
  },
  {
    slug: "terapia-pos-casamento",
    total_quantity: 2,
    name: "Terapia Pós-Casamento",
    description: "Um investimento bem bureaucraticamente correto para o ano que vem.",
    image_key: "terapia",
    amount_cents: 15000,
    category: "Presentes perigosamente específicos",
  },
  {
    slug: "combustivel-para-a-volta",
    total_quantity: 2,
    name: "Combustível para a Volta",
    description: "Para a noite não acabar antes de vocês chegarem em casa.",
    image_key: "combustivel",
    amount_cents: 20000,
    category: "Presentes perigosamente específicos",
  },
  {
    slug: "eu-avisei-que-ia-gastar",
    total_quantity: 2,
    name: "Eu Avisei que Ia Gastar",
    description: "Você avisou. A gente anotou. Agora é sua vez de repassar a conta.",
    image_key: "aviso",
    amount_cents: 10000,
    category: "Presentes perigosamente específicos",
  },
  {
    slug: "brinde-as-noivas",
    total_quantity: 5,
    name: "Um Brinde às Noivas",
    description: "Para o jogo de transformar uma noite em memória.",
    image_key: "brinde",
    amount_cents: 5000,
    category: "Nossa história",
  },
  {
    slug: "pedacinho-da-lua-de-mel",
    total_quantity: 2,
    name: "Um Pedacinho da Nossa Lua de Mel",
    description: "Ajuda a comprar a lua de mel que a gente vai contar pra todo mundo.",
    image_key: "lua",
    amount_cents: 30000,
    category: "Nossa história",
  },
  {
    slug: "experiencia-em-curitiba",
    total_quantity: 1,
    name: "Uma Experiência em Curitiba",
    description: "Um passeio a três, do jeito que a gente sempre quis fazer.",
    image_key: "curitiba",
    amount_cents: 25000,
    category: "Nossa história",
  },
];

const SEED_SETTINGS: Record<string, string> = {
  wedding_names: process.env.WEDDING_NAMES || "Jéssica & Jennifer",
  wedding_date: process.env.WEDDING_DATE || "2026-10-29",
  hero_title: "Nosso dia fica ainda mais especial porque você está aqui.",
  story_title: "Nossa história",
  story_text:
    "A gente se conheceu num dia comum, num lugar comum, e nenhuma das duas fez a primeira escolha certa. A vida deu algumas voltas antes de colocar a gente exatamente onde deveria estar: uma com a outra.\n\nEste site não é uma lista de casamento. É um cantinho do nosso dia, feito para quem esteve aqui — ou fez parte da nossa história — deixar um pedacinho seu com a gente.\n\nPode ser um presente, uma foto, uma memória. No fim, a gente só queria guardar um pouco de tudo aquilo que fez esse dia ser nosso.",
  pix_recipient_name: process.env.WEDDING_NAMES || "Jéssica & Jennifer",
  pix_key: process.env.PIX_KEY || "",
  pix_recipient_city: process.env.PIX_RECIPIENT_CITY || "SAO PAULO",
  site_active: "1",
  photo_storage: process.env.PHOTO_STORAGE || "local",
  pix_provider: process.env.PIX_PROVIDER || "manual",
  google_drive_folder_id:
    process.env.GOOGLE_DRIVE_FOLDER_ID || "1BxFLKSC8o0MezlAuuewodhnto1EMSz_o",
};

type GlobalWithPool = typeof globalThis & { __deixaAquiPool?: Pool };

export function pool(): Pool {
  const scope = globalThis as GlobalWithPool;
  if (!scope.__deixaAquiPool) {
    scope.__deixaAquiPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.DATABASE_POOL_MAX) || 4,
      ssl: /neon\.tech/.test(process.env.DATABASE_URL ?? "") ? { rejectUnauthorized: false } : undefined,
    });
  }
  return scope.__deixaAquiPool;
}

async function seed(client: PoolClient) {
  for (const [index, gift] of SEED_GIFTS.entries()) {
    await client.query(
      `INSERT INTO gifts
         (slug, name, description, image_key, amount_cents, category, display_order, total_quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (slug) DO NOTHING`,
      [
        gift.slug,
        gift.name,
        gift.description,
        gift.image_key,
        gift.amount_cents,
        gift.category,
        (index + 1) * 10,
        gift.total_quantity ?? 1,
      ],
    );
  }
  for (const [key, value] of Object.entries(SEED_SETTINGS)) {
    await client.query(
      `INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`,
      [key, value],
    );
  }
}

let ready: Promise<void> | undefined;

function ensureSchema() {
  ready ??= (async () => {
    const client = await pool().connect();
    try {
      await client.query(SCHEMA);
      await seed(client);
    } finally {
      client.release();
    }
  })();
  return ready;
}

export async function sql<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  await ensureSchema();
  return (await pool().query<T>(text, params)).rows;
}

export async function run(text: string, params: unknown[] = []): Promise<number> {
  await ensureSchema();
  return (await pool().query(text, params)).rowCount ?? 0;
}

export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  await ensureSchema();
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const value = await fn(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}