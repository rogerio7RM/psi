import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const bucket = "primesphere-private";

function contentType(file) {
  if (file.endsWith(".json")) return "application/json";
  if (file.endsWith(".pdf")) return "application/pdf";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".png")) return "image/png";
  if (/\.jpe?g$/i.test(file)) return "image/jpeg";
  return "application/octet-stream";
}

function upload(local, key) {
  if (!fs.existsSync(local)) return;
  execFileSync("npx", [
    "wrangler", "r2", "object", "put", bucket + "/" + key,
    "--remote", "--file", local, "--content-type", contentType(local),
  ], { stdio: "inherit", env: process.env });
}

const tradeFiles = [
  ["public/data/trades.json", "trades/rm.json"],
  ["public/data/trades-eb.json", "trades/eb.json"],
  ["public/data/trades-dc.json", "trades/dc.json"],
];
for (const [local, key] of tradeFiles) upload(local, key);

const educationRoot = "public/estudos";
if (fs.existsSync(educationRoot)) {
  const stack = [educationRoot];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else {
        const relative = path.relative(educationRoot, full).split(path.sep).join("/");
        upload(full, "education/" + relative);
      }
    }
  }
}

console.log("Private subscription content synchronized to R2.");
