import crypto from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error('Uso: node scripts/hash.mjs "sua senha forte"');
  process.exit(1);
}

if (password.length < 8) {
  console.error("Senha muito curta: use pelo menos 8 caracteres.");
  process.exit(1);
}

console.log(
  crypto
    .createHash("sha256")
    .update(password)
    .digest("hex"),
);