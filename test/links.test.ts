import { beforeEach, expect, test } from "bun:test";
import { createServer } from "../src/app";
import { createStore, validate, type Store } from "../src/db";

let store: Store;
let base: string;
let server: ReturnType<typeof createServer>;

beforeEach(async () => {
  server?.stop(true);
  store = await createStore();
  server = createServer(store, 0);
  base = server.url.origin;
});

test("validate rejects bad slugs, reserved slugs and non-http urls", () => {
  expect(validate("ok-1", "https://example.com")).toBeNull();
  expect(validate("Bad Slug", "https://example.com")).not.toBeNull();
  expect(validate("api", "https://example.com")).not.toBeNull();
  expect(validate("x", "javascript:alert(1)")).not.toBeNull();
});

test("api rejects unknown hosts and cross-site origins", async () => {
  const url = `${base}/api/links`;
  expect((await fetch(url, { headers: { host: "evil.example" } })).status).toBe(
    403,
  );
  expect(
    (
      await fetch(url, {
        method: "POST",
        headers: { origin: "https://evil.example" },
        body: "{}",
      })
    ).status,
  ).toBe(403);
  expect((await fetch(url)).status).toBe(200);
});

test("create, redirect, count hits, delete", async () => {
  const res = await fetch(`${base}/api/links`, {
    method: "POST",
    body: JSON.stringify({ slug: "GH", url: "https://github.com" }),
  });
  expect(res.status).toBe(201);

  const hop = await fetch(`${base}/gh`, { redirect: "manual" });
  expect(hop.status).toBe(302);
  expect(hop.headers.get("location")).toBe("https://github.com/");
  await fetch(`${base}/gh`, { redirect: "manual" });

  const links = (await (await fetch(`${base}/api/links`)).json()) as {
    slug: string;
    hits: number;
  }[];
  expect(links[0]).toMatchObject({ slug: "gh", hits: 2 });

  expect(
    (await fetch(`${base}/api/links/gh`, { method: "DELETE" })).status,
  ).toBe(204);
  expect((await fetch(`${base}/gh`, { redirect: "manual" })).status).toBe(404);
});

test("posting an existing slug updates its target", async () => {
  for (const url of ["https://a.example", "https://b.example"])
    await fetch(`${base}/api/links`, {
      method: "POST",
      body: JSON.stringify({ slug: "x", url }),
    });
  expect(await store.list()).toHaveLength(1);
  expect(await store.resolve("x")).toBe("https://b.example");
});
