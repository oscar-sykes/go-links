import { timingSafeEqual } from "node:crypto";
import admin from "./admin.html";
import { validate, type Store } from "./db";

function authorized(req: Request, token: string): boolean {
  const given = Buffer.from(req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "");
  const want = Buffer.from(token);
  return given.length === want.length && timingSafeEqual(given, want);
}

export function createServer(store: Store, token: string, port: number) {
  const guard = (fn: (req: any) => Response | Promise<Response>) => (req: Request) =>
    authorized(req, token) ? fn(req) : Response.json({ error: "unauthorized" }, { status: 401 });

  return Bun.serve({
    port,
    routes: {
      "/": Response.redirect("/admin"),
      "/admin": admin,
      "/api/links": {
        GET: guard(() => Response.json(store.list())),
        POST: guard(async (req) => {
          const body = (await req.json().catch(() => ({}))) as { slug?: string; url?: string };
          const slug = (body.slug ?? "").trim().toLowerCase();
          const url = (body.url ?? "").trim();
          const err = validate(slug, url);
          if (err) return Response.json({ error: err }, { status: 400 });
          store.upsert(slug, url);
          return Response.json({ slug, url }, { status: 201 });
        }),
      },
      "/api/links/:slug": {
        DELETE: guard((req) =>
          store.remove(req.params.slug) ? new Response(null, { status: 204 }) : Response.json({ error: "not found" }, { status: 404 }),
        ),
      },
      "/:slug": (req) => {
        const url = store.resolve(req.params.slug.toLowerCase());
        return url ? Response.redirect(url, 302) : new Response("No such link", { status: 404 });
      },
    },
  });
}
