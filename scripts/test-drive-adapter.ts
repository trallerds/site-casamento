import { googleDriveStorage, isDriveConfigured } from "../src/lib/storage/drive";

const FOLDER = "1BxFLKSC8o0MezlAuuewodhnto1EMSz_o";

const calls: {
  url: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
}[] = [];

Object.assign(process.env, {
  GOOGLE_CLIENT_ID: "fake-client-id",
  GOOGLE_CLIENT_SECRET: "fake-client-secret",
  GOOGLE_REFRESH_TOKEN: "fake-refresh-token",
  GOOGLE_DRIVE_FOLDER_ID: FOLDER,
});

const originalFetch = globalThis.fetch;

globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input.toString();
  const method = init?.method ?? "GET";
  calls.push({
    url,
    method,
    headers: Object.fromEntries(
      Object.entries((init?.headers as Record<string, string>) ?? {}).map(([key, value]) => [
        key.toLowerCase(),
        value,
      ]),
    ),
    body: init?.body ? String(init.body) : undefined,
  });

  if (url.includes("oauth2.googleapis.com/token")) {
    return new Response(JSON.stringify({ access_token: "access-123", expires_in: 3600 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (url.includes("/upload/drive/v3/files")) {
    return new Response(JSON.stringify({ id: "file-abc", name: "foto.jpg" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (url.includes("alt=media")) {
    return new Response(Buffer.from("conteudo-foto"), {
      status: 200,
      headers: { "Content-Type": "image/jpeg" },
    });
  }
  if (method === "DELETE") return new Response("", { status: 204 });
  if (url.includes("drive/v3/files/")) {
    return new Response(JSON.stringify({ id: FOLDER, name: "Casamento J&J" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response("{}", { status: 404 });
}) as unknown as typeof fetch;

async function run() {
  console.log("--- configurado:", isDriveConfigured());

  const saved = await googleDriveStorage.save({
    buffer: Buffer.from("bytes-da-foto"),
    mimeType: "image/jpeg",
    filename: "minha-foto.jpg",
    publicId: "abc123def456",
  });
  console.log("--- save:", JSON.stringify(saved));

  const upload = calls.find((call) => call.url.includes("/upload/drive/v3/files"));
  const contentType = upload?.headers?.["content-type"] ?? "";
  const boundary = contentType.replace("multipart/related; boundary=", "");
  const body = upload?.body ?? "";

  console.log("--- content-type:", contentType.slice(0, 55));
  console.log("--- boundary bate com o corpo:", body.includes(`--${boundary}`));
  console.log("--- pai enviado e a pasta:", body.includes('name="parents"') && body.includes(FOLDER));
  console.log("--- nome do arquivo:", body.includes("abc123def456.jpg"));
  console.log("--- mime do arquivo:", body.includes("Content-Type: image/jpeg"));
  console.log("--- bytes da foto no corpo:", body.includes("bytes-da-foto"));
  console.log("--- multipart fechado:", body.endsWith(`--${boundary}--\r\n`));
  console.log("--- authorization:", upload?.headers?.["authorization"] === "Bearer access-123");

  const read = await googleDriveStorage.read(saved.key);
  console.log("--- read:", read?.mimeType, JSON.stringify(read?.buffer.toString()));

  const health = await googleDriveStorage.health();
  console.log("--- health:", JSON.stringify(health));

  await googleDriveStorage.delete({ key: saved.key, externalId: saved.externalId });
  console.log("--- delete enviado:", calls.some((call) => call.method === "DELETE"));

  globalThis.fetch = originalFetch;
}

run();