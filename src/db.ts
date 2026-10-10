import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type Link = { slug: string; url: string; hits: number; created_at: number };

export const RESERVED = new Set(["api", "favicon.ico"]);
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function validate(slug: string, url: string): string | null {
  if (!SLUG_RE.test(slug)) return "slug must be 1-64 chars: a-z, 0-9, _ or -";
  if (RESERVED.has(slug)) return `"${slug}" is reserved`;
  try {
    const { protocol } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return "url must be http(s)";
  } catch {
    return "url is not valid";
  }
  return null;
}

export function createStore(path = ":memory:") {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path, { create: true });
  db.run("PRAGMA journal_mode = WAL");
  db.run(`CREATE TABLE IF NOT EXISTS links (
    slug TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    hits INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  const list = db.query<Link, []>("SELECT * FROM links ORDER BY created_at DESC, slug");
  const upsert = db.query(
    "INSERT INTO links (slug, url) VALUES ($slug, $url) ON CONFLICT(slug) DO UPDATE SET url = excluded.url",
  );
  const remove = db.query("DELETE FROM links WHERE slug = $slug");
  const hit = db.query<{ url: string }, { $slug: string }>(
    "UPDATE links SET hits = hits + 1 WHERE slug = $slug RETURNING url",
  );

  return {
    db,
    list: () => list.all(),
    upsert: (slug: string, url: string) => void upsert.run({ $slug: slug, $url: url }),
    remove: (slug: string) => remove.run({ $slug: slug }).changes > 0,
    /** Returns the target URL and bumps the hit counter, or null if unknown. */
    resolve: (slug: string) => hit.get({ $slug: slug })?.url ?? null,
  };
}

export type Store = ReturnType<typeof createStore>;
