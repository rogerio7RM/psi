import fs from "node:fs";
import { execFileSync } from "node:child_process";

const dbName = "primesphere-auth";
const bucketName = "primesphere-private";

function run(args, options = {}) {
  return execFileSync("npx", ["wrangler", ...args], {
    encoding: "utf8",
    stdio: options.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    env: process.env,
  });
}

function listDatabases() {
  const raw = run(["d1", "list", "--json"], { capture: true });
  return JSON.parse(raw);
}

let databases = listDatabases();
let database = databases.find((item) => item.name === dbName);
if (!database) {
  console.log("Creating D1 database:", dbName);
  run(["d1", "create", dbName]);
  databases = listDatabases();
  database = databases.find((item) => item.name === dbName);
}
if (!database) throw new Error("Unable to resolve D1 database after creation.");

const databaseId = database.uuid || database.id;
if (!databaseId) throw new Error("D1 database id missing.");

try {
  run(["r2", "bucket", "create", bucketName]);
} catch {
  console.log("R2 bucket already exists or creation returned a non-zero status:", bucketName);
}

const wranglerPath = "wrangler.json";
const config = JSON.parse(fs.readFileSync(wranglerPath, "utf8"));
config.d1_databases = [{
  binding: "AUTH_DB",
  database_name: dbName,
  database_id: databaseId,
}];
config.r2_buckets = Array.isArray(config.r2_buckets) ? config.r2_buckets : [];
if (!config.r2_buckets.some((item) => item.binding === "PRIVATE_CONTENT")) {
  config.r2_buckets.push({ binding: "PRIVATE_CONTENT", bucket_name: bucketName });
}
fs.writeFileSync(wranglerPath, JSON.stringify(config, null, 2) + "\n");

run(["d1", "execute", dbName, "--remote", "--yes", "--file", "migrations/0001_auth.sql"]);
console.log("Subscription infrastructure ready:", { dbName, databaseId, bucketName });
