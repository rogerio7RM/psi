import fs from "node:fs";

const files = [
  ["RM", "public/data/trades.json"],
  ["EB", "public/data/trades-eb.json"],
  ["DC", "public/data/trades-dc.json"],
];
const allowedKeys = new Set(["sourceRow", "date", "asset", "strike", "quantity", "strategy", "rawAmount", "status"]);

for (const [account, file] of files) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(data.rows)) throw new Error(`${file}: rows must be an array`);
  if (data.account !== account) throw new Error(`${file}: expected account ${account}`);
  for (const [index, row] of data.rows.entries()) {
    if (!row || typeof row !== "object" || Array.isArray(row)) throw new Error(`${file}: invalid row at index ${index}`);
    for (const key of Object.keys(row)) {
      if (!allowedKeys.has(key)) throw new Error(`${file}: forbidden field "${key}" at sourceRow ${row.sourceRow ?? index + 2}`);
    }
    if (!["closed", "open"].includes(row.status)) throw new Error(`${file}: invalid status at sourceRow ${row.sourceRow ?? index + 2}`);
  }
  console.log(`Trades QA OK: ${account} = ${data.rows.length} rows; Secret/account markers not exposed in rows.`);
}
