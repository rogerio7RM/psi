import fs from "node:fs";

const forbidden = [
  "public/data/trades.json",
  "public/data/trades-eb.json",
  "public/data/trades-dc.json",
  "public/estudos",
];

for (const path of forbidden) {
  if (fs.existsSync(path)) throw new Error(`Protected subscriber content must not be shipped as a public asset: ${path}`);
}

console.log("Subscriber privacy QA OK: Trades and Educational protected content are absent from public assets.");
