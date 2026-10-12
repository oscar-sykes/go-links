import { createServer } from "./src/app";
import { createStore } from "./src/db";

const store = await createStore("data/links.db");
const server = createServer(store, 80);
console.log(`go-links listening on ${server.url}`);
