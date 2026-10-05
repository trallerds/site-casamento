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

CREATE TABLE IF NOT EXISTS rate_limit (
  bucket TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  hits INTEGER NOT NULL,
  PRIMARY KEY (bucket, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limit_window_idx ON rate_limit(window_start);
`;

type SeedGift = {
  slug: string;
  name: string;
  description: string;
  image_key: string;
  amount_cents: number;
  category: string;
  total_quantity?: number;
  display_order?: number;
};

const SEED_GIFTS: SeedGift[] = [
  {
    slug: "cobertor-da-razao",
    total_quantity: 5,
    display_order: 1,
    name: "Cobertor para a noiva que está sempre coberta de razão",
    description: "Para aquecer a noiva enquanto ela explica, pela 17ª vez, por que estava certa.",
    image_key: "default",
    amount_cents: 3000,
    category: "Sobrevivência do casamento",
  },
  {
    slug: "capacete-anti-cacetadas",
    total_quantity: 5,
    display_order: 2,
    name: "Capacete anti-cacetadas",
    description: "Para proteger as noivas das cacetadas da vida e das decisões duvidosas do casamento.",
    image_key: "default",
    amount_cents: 2500,
    category: "Sobrevivência do casamento",
  },
  {
    slug: "extintor-da-dr",
    total_quantity: 5,
    display_order: 3,
    name: "Extintor de incêndio matrimonial",
    description: "Para apagar pequenos incêndios antes que virem uma DR de três horas.",
    image_key: "default",
    amount_cents: 4000,
    category: "Sobrevivência do casamento",
  },
  {
    slug: "kit-primeiros-socorros-dr",
    total_quantity: 5,
    display_order: 4,
    name: "Kit primeiros socorros para DR",
    description: "Inclui paciência, água e a clássica frase: 'você tem razão'.",
    image_key: "default",
    amount_cents: 5000,
    category: "Sobrevivência do casamento",
  },
  {
    slug: "fone-sabedoria",
    total_quantity: 5,
    display_order: 5,
    name: "Fone de ouvido para momentos de sabedoria da esposa",
    description: "Uso recomendado quando a palestra começar.",
    image_key: "default",
    amount_cents: 3500,
    category: "Sobrevivência do casamento",
  },
  {
    slug: "memoria-ram",
    total_quantity: 3,
    display_order: 6,
    name: "Memória RAM para lembrar o que a esposa falou há 6 meses",
    description: "Porque aparentemente 'eu já te falei isso' é uma informação importantíssima.",
    image_key: "default",
    amount_cents: 6000,
    category: "Sobrevivência do casamento",
  },
  {
    slug: "manual-esposa-certa",
    total_quantity: 5,
    display_order: 7,
    name: "Manual 'Como sobreviver à esposa certa'",
    description: "Edição especial para duas noivas que eventualmente podem estar certas ao mesmo tempo.",
    image_key: "default",
    amount_cents: 4500,
    category: "Sobrevivência do casamento",
  },
  {
    slug: "vale-paz-conjugal",
    total_quantity: 10,
    display_order: 8,
    name: "Vale uma sessão de paz conjugal",
    description: "Porque às vezes o silêncio também é uma prova de amor.",
    image_key: "default",
    amount_cents: 2000,
    category: "Sobrevivência do casamento",
  },
  {
    slug: "pizza-pos-dr",
    total_quantity: 10,
    display_order: 9,
    name: "Pizza pós-DR",
    description: "Porque nenhuma discussão resiste a uma pizza quentinha.",
    image_key: "default",
    amount_cents: 5000,
    category: "Sobrevivência do casamento",
  },
  {
    slug: "cota-justica-lar",
    total_quantity: 3,
    display_order: 10,
    name: "Kit Justiça do Lar",
    description: "Para decidir quem está certa. Resultado previsto: provavelmente as duas.",
    image_key: "default",
    amount_cents: 7000,
    category: "Sobrevivência do casamento",
  },
  {
    slug: "conta-luz",
    total_quantity: 10,
    display_order: 11,
    name: "Cota da conta de luz",
    description: "Ajude a manter acesa a chama do amor. E as lâmpadas também.",
    image_key: "default",
    amount_cents: 3000,
    category: "Boletos do amor",
  },
  {
    slug: "conta-agua",
    total_quantity: 10,
    display_order: 12,
    name: "Cota do banho das recém-casadas",
    description: "Porque amor é lindo, mas água também custa dinheiro.",
    image_key: "default",
    amount_cents: 2500,
    category: "Boletos do amor",
  },
  {
    slug: "wifi-do-casal",
    total_quantity: 10,
    display_order: 13,
    name: "Cota do Wi-Fi",
    description: "Para que as noivas continuem pesquisando quem está certa durante as discussões.",
    image_key: "default",
    amount_cents: 4000,
    category: "Boletos do amor",
  },
  {
    slug: "mercado-do-mes",
    total_quantity: 10,
    display_order: 14,
    name: "Cota do mercado",
    description: "Para comprar tudo que estava na lista e mais 37 coisas que não estavam.",
    image_key: "default",
    amount_cents: 5000,
    category: "Boletos do amor",
  },
  {
    slug: "papel-higienico",
    total_quantity: 10,
    display_order: 15,
    name: "Cota do papel higiênico matrimonial",
    description: "Porque ninguém pensa nisso até acabar.",
    image_key: "default",
    amount_cents: 2000,
    category: "Boletos do amor",
  },
  {
    slug: "fatura-cartao",
    total_quantity: 10,
    display_order: 16,
    name: "Cota 'a fatura do cartão chegou'",
    description: "Contribua para que as noivas continuem fingindo surpresa todo mês.",
    image_key: "default",
    amount_cents: 10000,
    category: "Boletos do amor",
  },
  {
    slug: "so-mais-um-boleto",
    total_quantity: 20,
    display_order: 17,
    name: "Cota 'só mais um boleto'",
    description: "O casamento acaba. Os boletos, aparentemente, não.",
    image_key: "default",
    amount_cents: 3000,
    category: "Boletos do amor",
  },
  {
    slug: "aluguel-teto",
    total_quantity: 10,
    display_order: 18,
    name: "Cota do aluguel",
    description: "Para manter o teto sobre nossas cabeças e as DRs dentro de casa.",
    image_key: "default",
    amount_cents: 10000,
    category: "Boletos do amor",
  },
  {
    slug: "lavanderia",
    total_quantity: 10,
    display_order: 19,
    name: "Cota da lavanderia",
    description: "Porque roupa suja se lava em casa... ou se paga alguém para lavar.",
    image_key: "default",
    amount_cents: 5000,
    category: "Boletos do amor",
  },
  {
    slug: "fuga-de-casa",
    total_quantity: 10,
    display_order: 20,
    name: "Cota para tirar as noivas de casa",
    description: "Depois de tanto planejamento de casamento, precisamos fugir um pouquinho.",
    image_key: "default",
    amount_cents: 10000,
    category: "Lua de mel",
  },
  {
    slug: "noite-sem-boleto",
    total_quantity: 5,
    display_order: 21,
    name: "Uma noite sem pensar em boleto",
    description: "Patrocine algumas horas de irresponsabilidade financeira.",
    image_key: "default",
    amount_cents: 15000,
    category: "Lua de mel",
  },
  {
    slug: "jantar-romantico",
    total_quantity: 5,
    display_order: 22,
    name: "Jantar romântico",
    description: "Porque miojo não combina com lua de mel.",
    image_key: "default",
    amount_cents: 20000,
    category: "Lua de mel",
  },
  {
    slug: "dieta-amanha",
    total_quantity: 10,
    display_order: 23,
    name: "Cota 'a dieta começa amanhã'",
    description: "Investimento em felicidade, carboidratos e decisões que serão justificadas depois.",
    image_key: "default",
    amount_cents: 8000,
    category: "Lua de mel",
  },
  {
    slug: "fotos-na-viagem",
    total_quantity: 10,
    display_order: 24,
    name: "Cota para fotos que ninguém pediu",
    description: "Porque precisamos voltar da viagem com pelo menos 2.000 fotos.",
    image_key: "default",
    amount_cents: 5000,
    category: "Lua de mel",
  },
  {
    slug: "praia-zero-responsabilidades",
    total_quantity: 5,
    display_order: 25,
    name: "Praia e zero responsabilidades",
    description: "Contribua para alguns momentos sem 'tem que pagar isso'.",
    image_key: "default",
    amount_cents: 15000,
    category: "Lua de mel",
  },
  {
    slug: "gasolina-do-amor",
    total_quantity: 10,
    display_order: 26,
    name: "Cota gasolina",
    description: "Para o amor chegar ao destino.",
    image_key: "default",
    amount_cents: 5000,
    category: "Lua de mel",
  },
  {
    slug: "excesso-de-bagagem",
    total_quantity: 5,
    display_order: 27,
    name: "Cota do excesso de bagagem",
    description: "Porque aparentemente 15 looks para 5 dias são completamente necessários.",
    image_key: "default",
    amount_cents: 10000,
    category: "Lua de mel",
  },
  {
    slug: "so-uma-olhadinha",
    total_quantity: 5,
    display_order: 28,
    name: "Cota 'a gente só vai dar uma olhadinha'",
    description: "Spoiler: não vamos.",
    image_key: "default",
    amount_cents: 20000,
    category: "Lua de mel",
  },
  {
    slug: "brinde-recem-casadas",
    total_quantity: 10,
    display_order: 29,
    name: "Brinde das recém-casadas",
    description: "Porque sobreviver ao casamento merece uma comemoração.",
    image_key: "default",
    amount_cents: 10000,
    category: "Lua de mel",
  },
  {
    slug: "date-pos-casamento",
    total_quantity: 10,
    display_order: 30,
    name: "Cota de um date depois do casamento",
    description: "Porque agora precisamos voltar a namorar.",
    image_key: "default",
    amount_cents: 12000,
    category: "Amor",
  },
  {
    slug: "manha-sem-despertador",
    total_quantity: 10,
    display_order: 31,
    name: "Uma manhã sem despertador",
    description: "Luxo absoluto das recém-casadas.",
    image_key: "default",
    amount_cents: 7000,
    category: "Amor",
  },
  {
    slug: "cafe-da-manha-pos-briga",
    total_quantity: 10,
    display_order: 32,
    name: "Café da manhã pós-briga",
    description: "Porque alguém precisa fazer as pazes — de preferência com comida.",
    image_key: "default",
    amount_cents: 6000,
    category: "Amor",
  },
  {
    slug: "escolher-uma-a-outra",
    total_quantity: 20,
    display_order: 33,
    name: "Cota para continuar escolhendo uma à outra",
    description: "Esse presente não tem preço. Mas um Pix ajuda bastante.",
    image_key: "default",
    amount_cents: 5000,
    category: "Amor",
  },
  {
    slug: "felizes-para-sempre",
    total_quantity: 20,
    display_order: 34,
    name: "Cota 'felizes para sempre'",
    description: "Contribua para nosso final feliz — que, convenientemente, começa depois do Pix.",
    image_key: "default",
    amount_cents: 10000,
    category: "Amor",
  },
  {
    slug: "pix-sem-explicacao",
    total_quantity: 50,
    display_order: 35,
    name: "Cota do PIX sem explicação",
    description: "Você não sabe o que comprar? Nós também não sabemos o que você quer dar. Mande o Pix e todos saem felizes.",
    image_key: "default",
    amount_cents: 5000,
    category: "Pix livre",
  },
  {
    slug: "esqueci-o-presente",
    total_quantity: 20,
    display_order: 36,
    name: "Cota 'esqueci o presente'",
    description: "Para quem lembrou do casamento, mas não lembrou de comprar nada.",
    image_key: "default",
    amount_cents: 2000,
    category: "Pix livre",
  },
  {
    slug: "ajude-noiva-esquecer-errada",
    total_quantity: 20,
    display_order: 37,
    name: "Ajude uma noiva a esquecer que estava errada",
    description: "Uma pequena contribuição para a paz mundial — e matrimonial.",
    image_key: "default",
    amount_cents: 2000,
    category: "Pix livre",
  },
  {
    slug: "patrocine-reconciliacao",
    total_quantity: 20,
    display_order: 38,
    name: "Patrocine uma reconciliação",
    description: "Seu Pix pode transformar uma DR em um abraço. Talvez.",
    image_key: "default",
    amount_cents: 3000,
    category: "Pix livre",
  },
  {
    slug: "evite-uma-dr",
    total_quantity: 20,
    display_order: 39,
    name: "Evite uma DR",
    description: "Doe agora e ajude a manter duas noivas longe de uma discussão desnecessária.",
    image_key: "default",
    amount_cents: 5000,
    category: "Pix livre",
  },
  {
    slug: "patrocinador-master",
    total_quantity: 3,
    display_order: 40,
    name: "Patrocinador Master da nossa lua de mel",
    description: "Um investimento de alto impacto para duas recém-casadas e suas futuras histórias.",
    image_key: "default",
    amount_cents: 100000,
    category: "Pix livre",
  },
];

const SEED_SETTINGS: Record<string, string> = {
  wedding_names: process.env.WEDDING_NAMES || "Jéssica & Jennifer",
  wedding_date: process.env.WEDDING_DATE || "2026-10-29",
  hero_title: "Nosso dia fica ainda mais especial porque você está aqui.",
  story_title: "Nossa história",
  story_text:
    "A gente se conheceu num dia comum, num lugar comum, e nenhuma das duas fez a primeira escolha certa. A vida deu algumas voltas antes de colocar a gente exatamente onde deveria estar: uma com a outra.\n\nEste site não é uma lista de casamento. É um cantinho do nosso dia, feito para quem esteve aqui — ou fez parte da nossa história — deixar um pedacinho seu com a gente.\n\nPode ser um presente, uma foto, uma memória. No fim, a gente só queria guardar um pouco de tudo aquilo que fez esse dia ser nosso.",
  // Campo 59 do BR Code e o titular da chave Pix, nao o nome do casal:
  // "&" nem acento existem no alfabeto de EMV.
  pix_recipient_name: "JESSICA C GONCALVES",
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
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL ausente: defina a string de conexao do Neon (branch production) no ambiente.",
      );
    }
    scope.__deixaAquiPool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX) || 4,
      ssl: /neon\.tech/.test(connectionString) ? { rejectUnauthorized: false } : undefined,
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
        gift.display_order ?? (index + 1) * 10,
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
      await client.query(
        `DELETE FROM rate_limit WHERE window_start < now() - interval '2 days'`,
      );
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