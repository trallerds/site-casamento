/**
 * Ponte do Casamento J&J -> Google Drive
 *
 * Publicar:
 *   1. script.google.com -> New project, colar este arquivo em Code.gs
 *   2. Project Settings -> Script Properties -> Add:
 *        GOOGLE_APPS_SCRIPT_SECRET = string longa e aleatoria (openssl rand -hex 32)
 *      O mesmo valor vai no Vercel como GOOGLE_APPS_SCRIPT_SECRET.
 *   3. Primeira publicação: Deploy -> New deployment -> Web app
 *        Execute as: Me
 *        Who has access: Anyone      <- obrigatorio (o fetch do Vercel e anonimo)
 *   4. A URL /exec vai no Vercel como GOOGLE_APPS_SCRIPT_URL
 *   5. Depois de alterar o codigo: Manage deployments -> Edit -> New version -> Deploy
 *
 * Superficie: save, read, health e appendRsvp (Google Doc por Script Property).
 * Nada de create, move, trash ou escolha de pasta para os arquivos.
 * Tudo que entra precisa do segredo compartilhado, e toda leitura e escrita e
 * presa a FOLDER_ID -- nenhum campo do request escolhe o destino.
 */

var FOLDER_ID = "1BxFLKSC8o0MezlAuuewodhnto1EMSz_o";
var MAX_BYTES = 15 * 1024 * 1024;
var ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

function prop_(name) {
  return PropertiesService.getScriptProperties().getProperty(name);
}

function authorizeRsvp() {
  var documentId = prop_("RSVP_DOC_ID");
  if (!documentId) throw new Error("Configure RSVP_DOC_ID antes de autorizar o Google Docs.");
  var document = DocumentApp.openById(documentId);
  Logger.log("Acesso autorizado ao documento de RSVP: " + document.getName());
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Pasta de destino. A Script Property sobrescreve o valor do codigo, para dar
 * conta de trocar a pasta no Vercel sem precisar republicar o script. save e
 * read tem que consultar a MESMA pasta, entao ambos usam esta funcao.
 */
function folderId_() {
  return prop_("GOOGLE_DRIVE_FOLDER_ID") || FOLDER_ID;
}

function folder_() {
  var id = folderId_();
  try {
    return DriveApp.getFolderById(id);
  } catch (err) {
    throw new Error("Pasta do Drive nao encontrada: " + id);
  }
}

/**
 * O Web App e "Anyone", entao a unica coisa que separa o nosso backend de
 * qualquer pessoa que ache a URL /exec e o segredo. Sem ele, 403.
 */
function authorized_(body) {
  var expected = prop_("GOOGLE_APPS_SCRIPT_SECRET");
  if (!expected) return false;
  var given = String((body && body.secret) || "");
  return given.length > 0 && given === expected;
}

/** Trava de pasta: so mexe em arquivo que esteja dentro da pasta do casamento. */
function fileInFolder_(id) {
  var file = DriveApp.getFileById(String(id));
  var folderId = folderId_();
  var parents = file.getParents();
  while (parents.hasNext()) {
    if (parents.next().getId() === folderId) return file;
  }
  throw new Error("arquivo fora da pasta do casamento");
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return json_({ ok: false, message: "corpo nao e JSON" });
  }

  if (!authorized_(body)) return json_({ ok: false, message: "nao autorizado" });

  try {
    if (body.action === "health") {
      var folder = folder_();
      return json_({ ok: true, folder: folder.getName() });
    }

    if (body.action === "appendRsvp") {
      var documentId = prop_("RSVP_DOC_ID");
      if (!documentId) throw new Error("RSVP_DOC_ID nao configurado");
      var guestName = String(body.name || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
      var guests = Array.isArray(body.companions) ? body.companions : [];
      var companions = guests.map(function(name) {
        return String(name || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
      }).filter(Boolean);
      if (guestName.split(/\s+/).length < 2 || guestName.length > 100 || companions.length > 5 || companions.some(function(name) { return name.length > 100; })) {
        throw new Error("informe nome completo e ate cinco acompanhantes");
      }
      var lock = LockService.getScriptLock();
      lock.waitLock(10000);
      try {
        var document = DocumentApp.openById(documentId);
        var documentBody = document.getBody();
        documentBody.appendParagraph("CONFIRMAÇÃO DE PRESENÇA").setHeading(DocumentApp.ParagraphHeading.HEADING2);
        documentBody.appendParagraph(String(body.couple || "Jéssica & Jennifer"));
        documentBody.appendParagraph(Utilities.formatDate(new Date(), "America/Sao_Paulo", "dd/MM/yyyy · HH:mm"));
        documentBody.appendParagraph(guestName);
        companions.forEach(function(name) {
          documentBody.appendParagraph(name);
        });
        documentBody.appendParagraph("");
        document.saveAndClose();
      } finally {
        lock.releaseLock();
      }
      return json_({ ok: true });
    }

    if (body.action === "save") {
      var mimeType = String(body.mimeType || "");
      if (ALLOWED_MIME.indexOf(mimeType) === -1) throw new Error("tipo nao permitido: " + mimeType);

      var bytes = Utilities.base64Decode(String(body.bytes || ""));
      if (!bytes.length) throw new Error("arquivo vazio");
      if (bytes.length > MAX_BYTES) throw new Error("arquivo maior que o limite");

      // O nome vem do servidor (publicId) e a pasta e fixa: nada do request
      // escolhe o destino, nem um folderId junto.
      var blob = Utilities.newBlob(bytes, mimeType, String(body.name || "foto.jpg"));
      var file = folder_().createFile(blob);
      file.setDescription("Foto enviada pelo convidado via Deixa Aqui");

      return json_({ ok: true, id: file.getId(), name: file.getName(), size: bytes.length });
    }

    if (body.action === "read") {
      var target = fileInFolder_(body.id);
      var blob = target.getBlob();
      var size = blob.getBytes().length;
      if (size > MAX_BYTES) throw new Error("arquivo grande demais para leitura");

      return json_({
        ok: true,
        id: String(body.id),
        mimeType: blob.getContentType(),
        bytes: Utilities.base64Encode(blob.getBytes()),
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
