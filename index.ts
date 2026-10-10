import { createServer } from "./src/app";
import { createStore } from "./src/db";

const store = createStore(Bun.env.DB_PATH ?? "data/links.db");
const server = createServer(store, Number(Bun.env.PORT ?? 3000));
console.log(`go-links listening on ${server.url}`);
