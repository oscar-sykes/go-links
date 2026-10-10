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
| `bun run build` | single executable at `out/go-links` |

Config (optional, environment variables): `PORT` (default 80), `DB_PATH` (default `data/links.db`).

## Making `go/foo` work

```sh
echo "127.0.0.1 go" | sudo tee -a /etc/hosts   # once
sudo bun run start                              # http://go/admin
```

Port 80 is privileged, hence `sudo`.

To start it automatically at boot instead (macOS LaunchDaemon, runs as root, restarts on crash):

```sh
sed -e "s|__BUN__|$(which bun)|" -e "s|__DIR__|$PWD|" com.go-links.plist | sudo tee /Library/LaunchDaemons/com.go-links.plist >/dev/null
sudo launchctl bootstrap system /Library/LaunchDaemons/com.go-links.plist
# stop/remove: sudo launchctl bootout system /Library/LaunchDaemons/com.go-links.plist
```

Logs go to `/tmp/go-links.log`. In Chrome, type `go/` or `http://go/admin` so it isn't treated as a search.

### Troubleshooting

- **Nothing happens / connection refused** — the server isn't running on port 80. Check `/tmp/go-links.log` (boot service) or the terminal running `sudo bun run start`. Make sure `bun install` has been run.
- **`EADDRINUSE` / port 80 in use** — something else is using it (`sudo lsof -iTCP:80 -sTCP:LISTEN`). Stop it, or stop your manual `sudo bun run start` before installing the boot service.
- **Browser searches for "go" instead of opening it** — type `http://go/` (or `go/` with the trailing slash).
- **`go` doesn't resolve** — check `/etc/hosts` has `127.0.0.1 go`. A VPN or DNS-filtering app can also override it.
- **Boot service doesn't start** — keep the project out of `~/Desktop`, `~/Documents` and `~/Downloads` (macOS blocks background services from reading them). If you move the project or reinstall Bun, redo the `sed` install step.
