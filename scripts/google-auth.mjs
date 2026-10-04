import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const SCOPES = ["https://www.googleapis.com/auth/drive"];
const PORT = Number(process.env.AUTH_PORT || 8787);
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;
const ENV_FILE = path.resolve(process.cwd(), ".env.local");

if (!CLIENT_ID) {
  console.error("Defina GOOGLE_CLIENT_ID no ambiente antes de rodar este script.");
  console.error("Crie as credenciais em https://console.cloud.google.com/apis/credentials");
  process.exit(1);
}

const consentUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
consentUrl.searchParams.set("client_id", CLIENT_ID);
consentUrl.searchParams.set("redirect_uri", REDIRECT_URI);
consentUrl.searchParams.set("response_type", "code");
consentUrl.searchParams.set("scope", SCOPES.join(" "));
consentUrl.searchParams.set("access_type", "offline");
consentUrl.searchParams.set("prompt", "consent");
consentUrl.searchParams.set("include_granted_scopes", "true");

console.log("\nAbra este link, aprove o acesso e volte aqui:\n");
console.log(consentUrl.toString());
console.log("\n(Aguardando o navegador…)\n");

const code = await new Promise((resolve, reject) => {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", REDIRECT_URI);
    if (url.pathname !== "/oauth2callback") {
      response.writeHead(404).end("not found");
      return;
    }
    const error = url.searchParams.get("error");
    if (error) {
      response.writeHead(400).end("Falha na autorização.");
      reject(new Error(`Google recusou: ${error}`));
      return;
    }
    response
      .writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
      .end("<p style='font-family:sans-serif'>Autorizado. Pode fechar esta aba e voltar ao terminal.</p>");
    resolve(url.searchParams.get("code") ?? "");
    setTimeout(() => server.close(), 500);
  });
  server.on("error", (error) => reject(error));
  server.listen(PORT, () => {
    const opener =
      process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    spawn(opener, [consentUrl.toString()], { stdio: "ignore", detached: true }).unref();
  });
});

if (!code) {
  console.error("Nenhum código recebido.");
  process.exit(1);
}

const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
if (!clientSecret) {
  console.error("Defina GOOGLE_CLIENT_SECRET no ambiente.");
  process.exit(1);
}

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  }),
});

const tokens = await tokenResponse.json();

if (!tokens.refresh_token) {
  console.error("Sem refresh_token:", JSON.stringify(tokens).slice(0, 400));
  process.exit(1);
}

const updateEnv = (key, value) => {
  const current = fs.existsSync(ENV_FILE) ? fs.readFileSync(ENV_FILE, "utf8") : "";
  const line = `${key}=${JSON.stringify(value)}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  fs.writeFileSync(
    ENV_FILE,
    pattern.test(current) ? current.replace(pattern, line) : `${current.trimEnd()}\n${line}\n`,
  );
};

updateEnv("GOOGLE_CLIENT_ID", CLIENT_ID);
updateEnv("GOOGLE_CLIENT_SECRET", clientSecret);
updateEnv("GOOGLE_REFRESH_TOKEN", tokens.refresh_token);

console.log("Credenciais salvas em .env.local: client id, client secret e refresh token.");
console.log("Rode npm run dev e confira a saúde da integração em /admin → Dashboard.");