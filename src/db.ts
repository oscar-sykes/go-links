import { SQL } from "bun";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export type Link = {
  slug: string;
  url: string;
  hits: number;
  created_at: number;
};

export const RESERVED = new Set(["api", "favicon.ico"]);
const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;

export function validate(slug: string, url: string): string | null {
  if (!SLUG_RE.test(slug)) return "slug must be 1-64 chars: a-z, 0-9, _ or -";
  if (RESERVED.has(slug)) return `"${slug}" is reserved`;
  try {
    const { protocol } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:")
      return "url must be http(s)";
  } catch {
    return "url is not valid";
  }
  return null;
}

export async function createStore(path = ":memory:") {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const db = new SQL({ adapter: "sqlite", filename: path });
  await db`PRAGMA journal_mode = WAL`;
  await db`CREATE TABLE IF NOT EXISTS links (
    slug TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    hits INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`;

  return {
    db,
    list: (): Promise<Link[]> =>
      db`SELECT * FROM links ORDER BY created_at DESC, slug`,
    upsert: async (slug: string, url: string) => {
      await db`INSERT INTO links (slug, url) VALUES (${slug}, ${url})
        ON CONFLICT(slug) DO UPDATE SET url = excluded.url`;
    },
    remove: async (slug: string) =>
      (await db`DELETE FROM links WHERE slug = ${slug} RETURNING slug`).length >
      0,
    /** Returns the target URL and bumps the hit counter, or null if unknown. */
    resolve: async (slug: string) => {
      const [row] = await db`UPDATE links SET hits = hits + 1
        WHERE slug = ${slug} RETURNING url`;
      return (row?.url as string | undefined) ?? null;
    },
  };
}

export type Store = Awaited<ReturnType<typeof createStore>>;
