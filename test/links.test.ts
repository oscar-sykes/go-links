import { beforeEach, expect, test } from "bun:test";
import { createServer } from "../src/app";
import { createStore, validate } from "../src/db";

const auth = { authorization: "Bearer secret" };
let store: ReturnType<typeof createStore>;
let base: string;
let server: ReturnType<typeof createServer>;

beforeEach(() => {
  server?.stop(true);
  store = createStore();
  server = createServer(store, "secret", 0);
  base = server.url.origin;
});

test("validate rejects bad slugs, reserved slugs and non-http urls", () => {
  expect(validate("ok-1", "https://example.com")).toBeNull();
  expect(validate("Bad Slug", "https://example.com")).not.toBeNull();
  expect(validate("admin", "https://example.com")).not.toBeNull();
  expect(validate("x", "javascript:alert(1)")).not.toBeNull();
});

test("api requires the token", async () => {
  expect((await fetch(`${base}/api/links`)).status).toBe(401);
  expect((await fetch(`${base}/api/links`, { headers: { authorization: "Bearer nope" } })).status).toBe(401);
});

test("create, redirect, count hits, delete", async () => {
  const res = await fetch(`${base}/api/links`, { method: "POST", headers: auth, body: JSON.stringify({ slug: "GH", url: "https://github.com" }) });
  expect(res.status).toBe(201);

  const hop = await fetch(`${base}/gh`, { redirect: "manual" });
  expect(hop.status).toBe(302);
  expect(hop.headers.get("location")).toBe("https://github.com/");
  await fetch(`${base}/gh`, { redirect: "manual" });

  const links = (await (await fetch(`${base}/api/links`, { headers: auth })).json()) as { slug: string; hits: number }[];
  expect(links[0]).toMatchObject({ slug: "gh", hits: 2 });

  expect((await fetch(`${base}/api/links/gh`, { method: "DELETE", headers: auth })).status).toBe(204);
  expect((await fetch(`${base}/gh`, { redirect: "manual" })).status).toBe(404);
});

test("posting an existing slug updates its target", async () => {
  for (const url of ["https://a.example", "https://b.example"])
    await fetch(`${base}/api/links`, { method: "POST", headers: auth, body: JSON.stringify({ slug: "x", url }) });
  expect(store.list()).toHaveLength(1);
  expect(store.resolve("x")).toBe("https://b.example");
});
