# go-links

Self-hosted `go/` link shortener, built entirely on Bun: `Bun.serve` routes, `bun:sqlite`, HTML imports for the admin UI, `bun test`, `Bun.$` and `bun build --compile`.

## Run

```sh
bun install
cp .env.example .env   # set ADMIN_TOKEN
bun run dev            # http://localhost:3000/admin
```

- `/admin` — manage links (enter your `ADMIN_TOKEN`)
- `/:slug` — 302 redirect, counts hits
- `GET/POST /api/links`, `DELETE /api/links/:slug` — Bearer-token API

## Scripts

| Script | What it does |
| --- | --- |
| `bun run start` / `dev` | run the server (`dev` hot-reloads) |
| `bun test` | tests |
| `bun check` | typecheck |
| `bun run backup` | consistent SQLite snapshot into `backups/` |
| `bun run build` | single executable at `out/go-links` |

## Making `go/foo` work

- **This machine only:** add `127.0.0.1 go` to `/etc/hosts`, run with `PORT=80` (needs sudo).
- **All your devices:** run it on one machine and use Tailscale MagicDNS (name the machine `go`).
- **Public:** put it behind a Cloudflare Tunnel on your own domain.
