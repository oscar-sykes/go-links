import ui from "./ui.html";
import { validate, type Store } from "./db";

// The server only listens on loopback, but any webpage you visit can still send
// requests to it. Requiring a known Host (blocks DNS rebinding) and a same-origin
// Origin (blocks cross-site writes) keeps other sites from editing your links.
const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "go"]);

function trusted(req: Request): boolean {
  const host = req.headers.get("host") ?? "";
  if (!ALLOWED_HOSTS.has(host.split(":")[0]!)) return false;
  const origin = req.headers.get("origin");
  return !origin || new URL(origin).host === host;
}

export function createServer(store: Store, port: number, hostname = "127.0.0.1") {
  const guard = (fn: (req: any) => Response | Promise<Response>) => (req: Request) =>
    trusted(req) ? fn(req) : Response.json({ error: "forbidden" }, { status: 403 });

  return Bun.serve({
    port,
    hostname,
    routes: {
      "/": ui,
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
          store.remove(req.params.slug)
            ? new Response(null, { status: 204 })
            : Response.json({ error: "not found" }, { status: 404 }),
        ),
      },
      "/:slug": (req) => {
        const url = store.resolve(req.params.slug.toLowerCase());
        return url ? Response.redirect(url, 302) : new Response("No such link", { status: 404 });
      },
    },
  });
}
