# go-links

Personal `go/` link shortener that runs only on your machine. Built entirely on Bun: `Bun.serve` routes, `bun:sqlite`, HTML imports for the admin UI, `bun test`, `Bun.$` and `bun build --compile`.

The server listens on `127.0.0.1` only, so nothing else on the network can reach it. API requests must also come from a known host (`localhost`, `127.0.0.1`, `go`) and the same origin, so other websites can't edit your links.

## Run

```sh
bun install
bun run dev    # http://localhost:3000/admin
```

- `/admin` — add and delete links
- `/:slug` — 302 redirect, counts hits

## Scripts

| Script | What it does |
| --- | --- |
| `bun run start` / `dev` | run the server (`dev` hot-reloads) |
| `bun test` | tests |
| `bun check` | typecheck |
| `bun run backup` | consistent SQLite snapshot into `backups/` |
| `bun run build` | single executable at `out/go-links` |

Config (optional, via `.env`): `PORT` (default 3000), `DB_PATH` (default `data/links.db`).

## Making `go/foo` work

```sh
echo "127.0.0.1 go" | sudo tee -a /etc/hosts
PORT=80 sudo bun run start
```
