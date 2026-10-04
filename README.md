# Deixa Aqui — Jéssica & Jennifer

Plataforma web do casamento: presentes simbólicos pagos via Pix e galeria colaborativa de fotos
enviadas direto do celular para o Google Drive das noivas. Mobile first, sem cadastro para convidados.

## O que já funciona

- Home, lista de presentes por categoria, detalhe do presente
- Cobrança Pix com **Pix Copia e Cola** (copiar com um toque) e QR Code no desktop
- Confirmação automática de pagamento quando há provedor com webhook (OpenPix)
- Botão “Já fiz meu Pix” que **não** vira pagamento confirmado — só registra a intenção para conciliação
- Câmera no navegador com fallback para escolher foto da galeria, preview e barra de progresso
- Upload validado por magic bytes (JPG, PNG, WebP, HEIC/HEIF), limite de 15 MB, rate limit por IP
- Armazenamento em arquivo local ou Google Drive, com cópia em staging e reprocessamento se o Drive falhar
- Área das noivas: dashboard, CRUD de presentes, conciliação de pagamentos, gestão de fotos, configurações
- Sessão administrativa com senha em hash, cookie `httpOnly` e expiração de 7 dias
- Idempotência de webhook (o mesmo evento nunca conta duas vezes)
- Política de privacidade e nenhuma coleta de dados pessoais de convidados

## Stack

| Camada        | Escolha                        | Por quê                                              |
| ------------- | ------------------------------ | ---------------------------------------------------- |
| Frontend      | Next.js 15 (App Router) + TS   | rotas server, câmera, deploy simples                  |
| Estilo        | Tailwind CSS v4                | mobile first e tokens de cor da identidade             |
| Banco         | SQLite (`better-sqlite3`)      | zero configuração; espelha as tabelas da spec         |
| Pix           | adapter (manual \| OpenPix)    | trocar provedor sem tocar nas rotas                    |
| Fotos         | adapter (local \| Google Drive)| trocar destino sem tocar nas rotas                     |
| Admin         | sessão própria + server actions| sem dependência externa de autenticação                |

## Rodando local

```bash
npm install
cp .env.example .env.local
npm run dev
```

O banco é criado e populado com 11 presentes de exemplo no primeiro acesso (`data/deixa-aqui.db`).

### 1. Ativar a área das noivas

```bash
npm run admin:password -- "senha que voce escolher"
```

Cole o hash gerado em `ADMIN_PASSWORD_HASH` no `.env.local` e reinicie o servidor.
Acesse `http://localhost:3000/admin`.

### 2. Configurar o Pix

Duas opções, trocáveis em **Configurações**:

- **Chave Pix (padrão, recomendado)** — cole a chave em `PIX_KEY` (e-mail, telefone, CPF ou chave
  aleatória). O sistema monta o **Pix Copia e Cola de cada presente já com o valor preenchido** e um
  identificador (`txid`) igual ao ID da cobrança, então o convidado só cola e paga. Esse `txid` aparece
  no extrato do banco de vocês e dá para casar pagamento por pagamento na aba Pagamentos.
- **OpenPix** — troque o provedor para OpenPix e cole a API key. Defina `OPENPIX_WEBHOOK_TOKEN` no
  ambiente e aponte o webhook para `https://SEU-DOMINIO/api/webhooks/pix`. Aí o pagamento vira `paid`
  sozinho, sem conciliação manual.

Detalhe importante: com chave única **não dá** para o sistema saber sozinho que o pagamento caiu — o
Pix chega na conta de vocês como uma transferência comum. Quem marca `paid` é o webhook (OpenPix) ou
a conciliação manual no painel, que mostra também quantos convidados já disseram que pagaram.

O código BR Code é gerado localmente com CRC16-CCITT e segue o layout EMV do Pix
(`00`, `26` com GUI e chave, `52`, `53`, `54` valor, `58`, `59`, `60`, `62` txid, `63` CRC).
O nome do recebedor é normalizado para ASCII e limitado a 25 caracteres, como pede o padrão.

### 3. Configurar o Google Drive

Pasta de destino já apontada: `1BxFLKSC8o0MezlAuuewodhnto1EMSz_o`.

1. Em https://console.cloud.google.com, crie um projeto e ative a **Google Drive API**.
2. Crie credenciais **OAuth client ID** do tipo *Web application* e registre
   `http://localhost:8787/oauth2callback` como URI de redirecionamento autorizado.
3. Na tela de consentimento, adicione o e-mail da conta proprietária da pasta como usuário de teste.
4. Exporte `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` e rode:

```bash
npm run drive:auth
```

O script abre o navegador, troca o código por um refresh token e grava as três credenciais em
`.env.local`. Depois vá em **Configurações → Fotos**, troque “Onde guardar” para *Google Drive* e
confirme em **Dashboard** que a integração está operacional.

Escopo usado: `https://www.googleapis.com/auth/drive`, porque o app precisa escrever dentro de uma
pasta que já existe na conta de vocês. Conta pessoal `@gmail.com` não cria Shared Drive, então o
caminho suportado é OAuth da conta humana proprietária da pasta.

## Publicar

### Atenção: Vercel não serve para esta versão

O banco atual é **SQLite em arquivo** (`data/deixa-aqui.db`) e o armazenamento local de fotos usa
`data/uploads`. Na Vercel o sistema de arquivos da função é somente leitura e descartado a cada
deploy: o site subiria, mas **todo presente, pagamento e foto seria perdido** a cada build, e o
`mkdir` de `data/` quebraria as requisições.

Duas saídas:

**A. Migrar o banco para Postgres (permite Vercel).** Supabase, Neon ou qualquer Postgres
gerenciado. Envolve trocar o driver e a camada de acesso; o resto do site (rotas, componentes,
adapters de Pix e Drive) continua igual. É o caminho se a hospedagem definite for Vercel.

**B. Hospedar com disco persistente.** Render, Railway, Fly.io ou uma VPS: o código atual sobe sem
nenhuma mudança, com `data/` em disco persistente. `npm run build` gera `.next-build`, e `npm start`
seta a mesma variável, então o deploy precisa de:

```
NODE_VERSION=20
# npm run build && npm start
```

### Em qualquer hospedagem

- `ADMIN_PASSWORD_HASH` obrigatório;
- `PHOTO_STORAGE=drive` e as credenciais do Drive: em hospedagem serverless **não há disco**, então
  as fotos obrigatoriamente precisam ir para o Google Drive;
- `PIX_PROVIDER=openpix` + `OPENPIX_WEBHOOK_TOKEN` se quiser confirmação automática;
- `NEXT_PUBLIC_SITE_URL` com o domínio real (usado nas URLs de confirmação);
- **HTTPS é obrigatório**: a câmera do navegador não funciona em contexto inseguro.

## Estrutura

```
src/
  app/
    page.tsx                     home
    presentes/                   lista, detalhe, pix, confirmacao
    fotos/                       camera + upload
    politica-de-privacidade/
    admin/                       login, dashboard, presentes, pagamentos, fotos, configuracoes
    api/                         payments, photos, webhooks/pix
  components/                    UI, camera, copia do Pix, QR
  lib/
    db.ts                        schema + seed
    queries.ts                   leituras
    payments.ts                  criacao de cobranca e idempotencia
    photos.ts                    validacao e upload com staging/retry
    pix/                         adapter manual | openpix
    storage/                     adapter local | drive
    auth.ts, rate-limit.ts
scripts/
  hash.mjs                       hash da senha do admin
  google-auth.mjs                OAuth do Drive
```

## Limites e cuidados

- Rate limit: 20 fotos/hora e 40 cobranças/hora por IP. Em degradado, ajusto os valores no ambiente.
- Nenhum arquivo do convidado vira nome de arquivo no Drive: o nome é gerado pelo servidor.
- A pasta de destino é configuração do backend; o convidado nunca escolhe o destino do upload.
- `pix_code` fica no banco e nunca é devolvido pelo endpoint público de status.
- Galeria pública está fora do MVP: as fotos ficam privadas até as noivas decidirem o que publicar.

## Scripts

```bash
npm run dev            # servidor local
npm run build          # build de produção
npm run lint           # ESLint
npm run typecheck      # TypeScript
npm run admin:password -- "senha"
npm run drive:auth     # OAuth do Google Drive
npm run db:reset       # apaga o banco e recomeça
```# site-casamento
