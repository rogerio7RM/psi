import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import {
  constants,
  createDecipheriv,
  createHash,
  privateDecrypt,
} from "node:crypto";

const [privateKeyPath, manifestPath, outputDir] = process.argv.slice(2);
if (!privateKeyPath || !manifestPath || !outputDir) {
  throw new Error("Usage: node decrypt-trades-sync.mjs <private.pem> <manifest.json> <outputDir>");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!/^[a-zA-Z0-9_-]{16,80}$/.test(manifest.requestId || "")) {
  throw new Error("Invalid requestId");
}

const accounts = ["rm", "eb", "dc"];
const allowedRowKeys = new Set([
  "sourceRow", "date", "asset", "strike", "quantity", "strategy", "rawAmount", "status",
]);
const privateKey = fs.readFileSync(privateKeyPath, "utf8");
fs.mkdirSync(outputDir, { recursive: true });

for (const account of accounts) {
  const envelopePath = path.join(path.dirname(manifestPath), account + ".json");
  const envelope = JSON.parse(fs.readFileSync(envelopePath, "utf8"));
  if (envelope.requestId !== manifest.requestId || envelope.account !== account) {
    throw new Error("Envelope identity mismatch for " + account);
  }
  if (!["RSA-OAEP-SHA256+AES-256-GCM", "RSA-OAEP-SHA256+AES-256-GCM+GZIP"].includes(envelope.algorithm)) {
    throw new Error("Unsupported envelope algorithm");
  }

  const key = privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(envelope.wrappedKey, "base64"),
  );
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(envelope.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64")),
    decipher.final(),
  ]);
  const plaintext = envelope.algorithm.endsWith("+GZIP") ? gunzipSync(decrypted) : decrypted;

  const hash = createHash("sha256").update(plaintext).digest("hex");
  console.log(account.toUpperCase() + " computed sha256=" + hash);
  if (hash !== manifest.hashes?.[account]) {
    throw new Error("Hash mismatch for " + account);
  }

  const snapshot = JSON.parse(plaintext.toString("utf8"));
  if (!Array.isArray(snapshot.rows)) throw new Error("Invalid rows for " + account);
  if (String(snapshot.account || "").toLowerCase() !== account) {
    throw new Error("Snapshot account mismatch for " + account);
  }

  for (const row of snapshot.rows) {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error("Invalid trade row");
    for (const keyName of Object.keys(row)) {
      if (!allowedRowKeys.has(keyName)) throw new Error("Forbidden row field: " + keyName);
    }
    if (!["closed", "open"].includes(row.status)) throw new Error("Invalid trade status");
    if (!Number.isFinite(row.rawAmount) || !Number.isFinite(row.sourceRow)) throw new Error("Invalid numeric trade fields");
  }

  fs.writeFileSync(path.join(outputDir, account + ".json"), plaintext);
  console.log(account.toUpperCase() + ": " + snapshot.rows.length + " rows, sha256=" + hash);
}
