import { createServer } from "./src/app";
import { createStore } from "./src/db";

const token = Bun.env.ADMIN_TOKEN;
if (!token) {
  console.error("Set ADMIN_TOKEN in .env (see .env.example)");
  process.exit(1);
}

const store = createStore(Bun.env.DB_PATH ?? "data/links.db");
const server = createServer(store, token, Number(Bun.env.PORT ?? 3000));
console.log(`go-links listening on ${server.url}`);
