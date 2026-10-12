import { SQL } from "bun";
import { desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/bun-sql/sqlite";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const links = sqliteTable("links", {
  slug: text().primaryKey(),
  url: text().notNull(),
  hits: integer().notNull().default(0),
  created_at: integer()
    .notNull()
    .default(sql`(unixepoch())`),
});

export type Link = typeof links.$inferSelect;

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
  const client = new SQL({ adapter: "sqlite", filename: path });
  const db = drizzle({ client });
  await db.run(sql`PRAGMA journal_mode = WAL`);
  await db.run(sql`CREATE TABLE IF NOT EXISTS links (
    slug TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    hits INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`);

  return {
    db,
    list: (): Promise<Link[]> =>
      db.select().from(links).orderBy(desc(links.created_at), links.slug),
    upsert: async (slug: string, url: string) => {
      await db
        .insert(links)
        .values({ slug, url })
        .onConflictDoUpdate({ target: links.slug, set: { url } });
    },
    remove: async (slug: string) =>
      (await db.delete(links).where(eq(links.slug, slug)).returning()).length >
      0,
    /** Returns the target URL and bumps the hit counter, or null if unknown. */
    resolve: async (slug: string) => {
      const [row] = await db
        .update(links)
        .set({ hits: sql`${links.hits} + 1` })
        .where(eq(links.slug, slug))
        .returning({ url: links.url });
      return row?.url ?? null;
    },
  };
}

export type Store = Awaited<ReturnType<typeof createStore>>;
