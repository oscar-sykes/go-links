# go-links

Personal `go/` link shortener that runs only on your machine. Built entirely on Bun: `Bun.serve` routes, `bun:sqlite`, HTML imports for the UI, `bun test` and `Bun.$`.

The server listens on `127.0.0.1` only, so nothing else on the network can reach it. API requests must also come from a known host (`localhost`, `127.0.0.1`, `go`) and the same origin, so other websites can't edit your links.

## Run

```sh
bun install
bun run setup    # once: adds `go` to /etc/hosts and runs the server at boot (asks for your password)
```

Then open http://go/ to add and delete links. `/:slug` is a 302 redirect that counts hits.

Re-run `bun run setup` to restart the service after changing code; `bun run setup --uninstall` removes it.

## Scripts

| Script | What it does |
| --- | --- |
| `bun run setup` | install/restart the boot service (macOS) |
| `bun run start` / `dev` | run the server in the foreground (`dev` hot-reloads); needs `sudo` for port 80 |
| `bun test` | tests |
| `bun check` | typecheck |

The server always listens on `127.0.0.1:80` and stores links in `data/links.db`. Port 80 needs root, which is why the boot service and `sudo bun run start` run as root.

## Troubleshooting

- **Nothing happens / connection refused** — check `/tmp/go-links.log`, and make sure `bun install` has been run.
- **`EADDRINUSE` / port 80 in use** — something else is using it (`sudo lsof -iTCP:80 -sTCP:LISTEN`), possibly a manual `sudo bun run start`.
- **Browser searches for "go" instead of opening it** — type `http://go/`, or `go/` with the trailing slash.
- **`go` doesn't resolve** — check `/etc/hosts` has `127.0.0.1 go`. A VPN or DNS-filtering app can also override it.
- **Service doesn't start** — keep the project out of `~/Desktop`, `~/Documents` and `~/Downloads` (macOS blocks background services from reading them). If you move the project or reinstall Bun, re-run `bun run setup`.
- **Permission errors on `data/`** — the server runs as root, so it may create root-owned files. Fix with `sudo chown -R $USER data`.
