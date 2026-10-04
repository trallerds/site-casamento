/**
 * Ponte do Casamento J&J -> Google Drive
 *
 * Como publicar:
 *   1. script.google.com -> New project
 *   2. colar este arquivo em Code.gs (e o FOLDER_ID em Config.gs)
 *   3. Deploy -> New deployment -> Web app
 *      Execute as: Me (a conta dona da pasta)
 *      Who has access: Anyone
 *   4. copiar a URL /exec e botar em GOOGLE_APPS_SCRIPT_URL no Vercel
 *
 * O convidado nao precisa de acesso a pasta: quem executa e a conta dona.
 */

var FOLDER_ID = "1BxFLKSC8o0MezlAuuewodhnto1EMSz_o";
var MAX_BYTES = 20 * 1024 * 1024;

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

function doPost(e) {
  var body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

  try {
    if (body.action === "health") {
      var folder = folder_();
      var files = folder.getFiles();
      return json_({ ok: true, count: files.length, folder: folder.getName() });
    }

    if (body.action === "save") {
      var target = folder_();
      var bytes = Utilities.base64Decode(String(body.bytes || ""));
      if (!bytes.length) throw new Error("arquivo vazio");
      if (bytes.length > MAX_BYTES) {
        throw new Error("arquivo maior que o limite de " + MAX_BYTES + " bytes");
      }

      var blob = Utilities.newBlob(bytes, String(body.mimeType || "image/jpeg"), String(body.name));
      var file = target.createFile(blob);
      file.setDescription("Foto enviada pelo convidado via Deixa Aqui");

      return json_({ ok: true, id: file.getId(), name: file.getName(), size: bytes.length });
    }

    if (body.action === "read") {
      var toRead = DriveApp.getFileById(String(body.id));
      var readBlob = toRead.getBlob();
      return json_({
        ok: true,
        id: String(body.id),
        mimeType: readBlob.getContentType(),
        bytes: Utilities.base64Encode(readBlob.getBytes()),
      });
    }

    if (body.action === "delete") {
      DriveApp.getFileById(String(body.id)).setTrashed(true);
      return json_({ ok: true });
    }

    return json_({ ok: false, message: "acao desconhecida" });
  } catch (err) {
    return json_({ ok: false, message: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  return json_({ ok: true, message: "ponte do Deixa Aqui no ar" });
}