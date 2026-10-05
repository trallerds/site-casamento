/**
 * Teste real da ponte Apps Script -> Drive, pelo mesmo caminho que o
 * site usa em producao (appsScriptStorage).
 *
 * Precisa de GOOGLE_APPS_SCRIPT_URL e GOOGLE_APPS_SCRIPT_SECRET no
 * ambiente. Deixa UM arquivo de teste na pasta do casamento --
 * apague-o a mao depois (a ponte nao expoe delete por seguranca).
 */
import { readFile } from "node:fs/promises";
import { appsScriptStorage } from "../src/lib/storage/apps-script";

async function main() {
  if (!process.env.GOOGLE_APPS_SCRIPT_URL || !process.env.GOOGLE_APPS_SCRIPT_SECRET) {
    throw new Error("Falta GOOGLE_APPS_SCRIPT_URL ou GOOGLE_APPS_SCRIPT_SECRET no ambiente.");
  }

  console.log("1/4 health da ponte...");
  const health = await appsScriptStorage.health();
  console.log("    ", JSON.stringify(health));
  if (!health.ok) throw new Error("ponte indisponivel");

  console.log("2/4 save de uma foto real (public/logo.jpg)...");
  const buffer = await readFile("public/logo.jpg");
  const saved = await appsScriptStorage.save({
    buffer,
    mimeType: "image/jpeg",
    filename: "logo.jpg",
    publicId: "e2e-teste-drive",
  });
  console.log("     file id no Drive:", saved.key);

  console.log("3/4 read e comparacao byte a byte...");
  const read = await appsScriptStorage.read(saved.key);
  if (!read) throw new Error("read devolveu nulo");
  const intact = read.buffer.equals(buffer);
  console.log("     mime:", read.mimeType, "| bytes identicos:", intact);
  if (!intact) throw new Error("a foto voltou diferente da enviada");

  console.log("4/4 resultado:");
  console.log("     A foto chegou ao Drive. Confira o arquivo 'e2e-teste-drive.jpg'");
  console.log("     na pasta do casamento e apague-o depois do teste.");
}

main().catch((error) => {
  console.error("FALHOU:", error instanceof Error ? error.message : error);
  process.exit(1);
});
