/// <reference lib="dom" />
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const json = { "content-type": "application/json" };

async function refresh() {
  const links: { slug: string; url: string; hits: number }[] = await (
    await fetch("/api/links")
  ).json();
  $("rows").replaceChildren(
    ...links.map((l) => {
      const tr = document.createElement("tr");
      const a = Object.assign(document.createElement("a"), { href: l.url, textContent: l.url });
      const del = Object.assign(document.createElement("button"), { textContent: "Delete" });
      del.onclick = async () => {
        await fetch(`/api/links/${l.slug}`, { method: "DELETE" });
        refresh();
      };
      const cells = [
        Object.assign(document.createElement("code"), { textContent: `go/${l.slug}` }),
        a,
        document.createTextNode(String(l.hits)),
        del,
      ];
      for (const c of cells) tr.appendChild(document.createElement("td")).append(c);
      return tr;
    }),
  );
}

$("add").onsubmit = async (e) => {
  e.preventDefault();
  const slug = $<HTMLInputElement>("slug");
  const url = $<HTMLInputElement>("url");
  const res = await fetch("/api/links", {
    method: "POST",
    headers: json,
    body: JSON.stringify({ slug: slug.value, url: url.value }),
  });
  $("error").textContent = res.ok ? "" : ((await res.json()) as { error: string }).error;
  if (res.ok) {
    slug.value = url.value = "";
    refresh();
  }
};

refresh();
