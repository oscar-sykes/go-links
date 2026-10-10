# go-links

Personal `go/` link shortener that runs only on your machine. Built entirely on Bun: `Bun.serve` routes, `bun:sqlite`, HTML imports for the admin UI, `bun test`, `Bun.$` and `bun build --compile`.

The server listens on `127.0.0.1` only, so nothing else on the network can reach it. API requests must also come from a known host (`localhost`, `127.0.0.1`, `go`) and the same origin, so other websites can't edit your links.

## Run

```sh
bun install
sudo bun run start    # http://go/admin (or PORT=3000 bun run dev for http://localhost:3000/admin)
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

Config (optional, via `.env`): `PORT` (default 80), `DB_PATH` (default `data/links.db`).

## Making `go/foo` work

```sh
echo "127.0.0.1 go" | sudo tee -a /etc/hosts   # once
sudo bun run start                              # http://go/admin
```

Port 80 is privileged, hence `sudo`.

To start it automatically at boot instead (macOS LaunchDaemon, runs as root, restarts on crash):

```sh
sudo cp com.go-links.plist /Library/LaunchDaemons/
sudo launchctl bootstrap system /Library/LaunchDaemons/com.go-links.plist
# stop/remove: sudo launchctl bootout system /Library/LaunchDaemons/com.go-links.plist
```

Logs go to `/tmp/go-links.log`. In Chrome, type `go/` or `http://go/admin` so it isn't treated as a search.
