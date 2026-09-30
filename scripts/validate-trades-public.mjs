import fs from "node:fs";

const file = "public/data/trades.json";
const data = JSON.parse(fs.readFileSync(file, "utf8"));

if (!Array.isArray(data.rows)) {
  throw new Error("trades.json: rows must be an array");
}

const forbiddenKeys = new Set(["secretflag", "secret flag", "secret_flag"]);
for (const [index, row] of data.rows.entries()) {
  if (!row || typeof row !== "object" || Array.isArray(row)) {
    throw new Error(`trades.json: invalid row at index ${index}`);
  }

  for (const [key, value] of Object.entries(row)) {
    const normalizedKey = key.trim().toLowerCase();
    if (forbiddenKeys.has(normalizedKey)) {
      throw new Error(`trades.json: forbidden privacy field "${key}" found at sourceRow ${row.sourceRow ?? index + 2}`);
    }

    if (normalizedKey.includes("secret") && String(value ?? "").trim().toUpperCase() === "Y") {
      throw new Error(`trades.json: secret-marked row detected at sourceRow ${row.sourceRow ?? index + 2}`);
    }
  }
}

console.log(`Trades privacy QA OK: ${data.rows.length} public rows; no Secret Flag field exposed.`);
