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
| Banco         | Postgres (Neon) + `pg`         | serverless-safe; sem disco, funiona na Vercel         |
| Pix           | adapter (manual \| OpenPix)    | trocar provedor sem tocar nas rotas                    |
| Fotos         | adapter (local \| Google Drive)| trocar destino sem tocar nas rotas                     |
| Admin         | sessão própria + server actions| sem dependência externa de autenticação                |

## Rodando local

```bash
npm install
cp .env.example .env.local
npm run dev
```

O schema é criado e populado com 11 presentes de exemplo no primeiro acesso. Defina `DATABASE_URL`
no `.env.local` ( Neon Postgres ) antes de rodar.

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

Duas opções, sem misturar.

**A. Ponte por Apps Script (recomendado).** Não precisa de Google Cloud Console, e o convidado
nunca precisa de acesso à pasta.

1. Em https://script.google.com, crie um projeto e cole `google-apps-script/Code.gs`.
2. Confira o `FOLDER_ID` no topo do arquivo com a pasta de destino.
3. Em **Project Settings → Script Properties**, crie `GOOGLE_APPS_SCRIPT_SECRET` com uma string
   longa e aleatória (ex.: `openssl rand -hex 32`).
4. **Deploy → New deployment → Web app**, com *Execute as: **Me*** e *Who has access: **Anyone***.
5. Copie a URL `/exec` para `GOOGLE_APPS_SCRIPT_URL` e o mesmo segredo para
   `GOOGLE_APPS_SCRIPT_SECRET` no ambiente, e reinicie.

O Web App executa como a conta dona do script, então a autorização do Drive fica na conta das
noivas. Quem envia a foto é o backend, nunca o convidado.

*Who has access* precisa ser **Anyone**: o `fetch` do Vercel não tem sessão Google, então "Anyone
with Google account" rejeitaria o backend. Por isso o `GOOGLE_APPS_SCRIPT_SECRET` é obrigatório —
é ele que impede qualquer pessoa que descubra a URL `/exec` de escrever no Drive. Para girar o
segredo, troque a Script Property e a variável do Vercel.

O endpoint tem uma capacidade só: gravar foto na pasta fixa. Não expõe criação, mover, apagar nem
escolha de pasta, e a leitura só alcança arquivos que estejam dentro da pasta do casamento.

Limite conhecido: Web App do Apps Script consome a cota diária do script (90 min em conta
`@gmail.com`) e aceita ~30 execuções simultâneas. Na prática aguenta a fotos da festa; se faltar,
o destino alternativo é um bucket próprio.

**B. OAuth direto.** Exige um projeto no Google Cloud Console com a Drive API habilitada. Use só
se a opção A não servir — o código existe em `src/lib/storage/drive.ts` e é escolhido
automaticamente quando `GOOGLE_APPS_SCRIPT_URL` está vazio.

Pasta de destino: `1BxFLKSC8o0MezlAuuewodhnto1EMSz_o`.

Nas duas opções a pasta pode (e deve) ficar **privada**. O sistema não usa permissão pública de
link como mecanismo de autorização.

## Publicar

A Vercel está configurada e o app roda lá. O banco é Postgres (Neon) justamente por isso: o
filesystem da função é somente leitura e descartado a cada deploy, então nada de estado em disco.

O que ainda exige atenção no ambiente serverless:

- `DATABASE_URL` (string de conexão do Neon) é obrigatório nas variáveis da Vercel;
- `PHOTO_STORAGE=drive` e as credenciais do Drive: **não há disco**, então as fotos obrigatoriamente
  precisam ir para o Google Drive;
- `PIX_PROVIDER=openpix` + `OPENPIX_WEBHOOK_TOKEN` se quiser confirmação automática;
- `NEXT_PUBLIC_SITE_URL` com o domínio real (usado nas URLs de confirmação);
- **HTTPS é obrigatório**: a câmera do navegador não funciona em contexto inseguro.

Se um dia a hospedagem voltar a ter disco persistente (Render, Railway, Fly.io, VPS), o código atual
sobe sem mudança nenhuma.

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
    db.ts                        pool, schema, seed, sql/run/tx
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
npm run db:reset       # apaga data/uploads e recomeça
```
