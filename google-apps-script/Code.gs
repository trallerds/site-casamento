/**
 * Ponte do Casamento J&J -> Google Drive
 *
 * Publicar:
 *   1. script.google.com -> New project, colar este arquivo
 *   2. Project Settings -> Script Properties:
 *        GOOGLE_APPS_SCRIPT_SECRET = <a string longa e aleatoria>
 *      (ela fica no codigo? nao. e o que o Vercel manda no campo "secret")
 *   3. Deploy -> New deployment -> Web app
 *        Execute as: Me (a conta dona da pasta)
 *        Who has access: Anyone   <- obrigatorio: o fetch do Vercel e anonimo
 *   4. URL /exec vai para GOOGLE_APPS_SCRIPT_URL no Vercel
 *
 * O endpoint e de uma capability so: gravar foto na pasta. Nao expoe create,
 * move, trash nem escolha de pasta. Quem descobre a URL sem o secret nao faz nada.
 */

var FOLDER_ID = "1BxFLKSC8o0MezlAuuewodhnto1EMSz_o";
var MAX_BYTES = 15 * 1024 * 1024;
var ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function folder_() {
  var folder = DriveApp.getFolderById(FOLDER_ID);
  if (!folder) throw new Error("Pasta do Drive nao encontrada: " + FOLDER_ID);
  return folder;
}

/**
 * Autorizacao: o Web App e "Anyone", entao a unica coisa que separa o nosso
 * backend de qualquer pessoa que ache a URL e o segredo compartilhado.
 */
function authorized_(body) {
  var expected = PropertiesService.getScriptProperties().getProperty("GOOGLE_APPS_SCRIPT_SECRET");
  if (!expected) return false;
  var given = String((body && body.secret) || "");
  return given.length > 0 && given === expected;
}

/** Trava de pasta: so mexe em arquivo que esteja dentro da pasta do casamento. */
function fileInFolder_(id) {
  var file = DriveApp.getFileById(String(id));
  var parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === FOLDER_ID) return file;
  }
  throw new Error("arquivo fora da pasta do casamento");
}

function doPost(e) {
  var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

  if (!authorized_(body)) {
    return json_({ ok: false, message: "nao autorizado" });
  }

  try {
    if (body.action === "health") {
      var folder = folder_();
      return json_({ ok: true, count: folder.getFiles().length, folder: folder.getName() });
    }

    if (body.action === "save") {
      var mimeType = String(body.mimeType || "");
      if (ALLOWED_MIME.indexOf(mimeType) === -1) throw new Error("tipo nao permitido: " + mimeType);

      var bytes = Utilities.base64Decode(String(body.bytes || ""));
      if (!bytes.length) throw new Error("arquivo vazio");
      if (bytes.length > MAX_BYTES) throw new Error("arquivo maior que o limite");

      // O nome vem do servidor (publicId) e a pasta e fixa: nada do request escolhe destino.
      var blob = Utilities.newBlob(bytes, mimeType, String(body.name || "foto.jpg"));
      var file = folder_().createFile(blob);
      file.setDescription("Foto enviada pelo convidado via Deixa Aqui");

      return json_({ ok: true, id: file.getId(), name: file.getName(), size: bytes.length });
    }

    if (body.action === "read") {
      var readFile = fileInFolder_(body.id);
      var readBlob = readFile.getBlob();
      if (readBlob.getBytes().length > MAX_BYTES) throw new Error("arquivo grande demais para leitura");
      return json_({
        ok: true,
        id: String(body.id),
        mimeType: readBlob.getContentType(),
        bytes: Utilities.base64Encode(readBlob.getBytes()),
      });
    }

    return json_({ ok: false, message: "acao desconhecida" });
  } catch (err) {
    return json_({ ok: false, message: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  return json_({ ok: false, message: "use POST" });
}