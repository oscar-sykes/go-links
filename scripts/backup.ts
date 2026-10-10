// Usage: bun run backup  — writes a consistent snapshot of the DB to backups/.
import { Database } from "bun:sqlite";
import { $ } from "bun";

const src = Bun.env.DB_PATH ?? "data/links.db";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = `backups/links-${stamp}.db`;

await $`mkdir -p backups`;
const db = new Database(src, { readonly: true });
db.run(`VACUUM INTO '${dest}'`);
console.log(`Backed up ${src} -> ${dest}`);
