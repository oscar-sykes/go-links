const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
let token = localStorage.getItem("go-token") ?? "";

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(path, { ...init, headers: { authorization: `Bearer ${token}`, "content-type": "application/json" } });
  if (res.status === 401) {
    localStorage.removeItem("go-token");
    show(false);
    throw new Error("unauthorized");
  }
  return res;
}

function show(authed: boolean) {
  $("login").hidden = authed;
  $("app").hidden = !authed;
}

async function refresh() {
  const links: { slug: string; url: string; hits: number }[] = await (await api("/api/links")).json();
  const rows = $("rows");
  rows.replaceChildren(
    ...links.map((l) => {
      const tr = document.createElement("tr");
      const a = Object.assign(document.createElement("a"), { href: l.url, textContent: l.url });
      const del = Object.assign(document.createElement("button"), { textContent: "Delete" });
      del.onclick = async () => {
        await api(`/api/links/${l.slug}`, { method: "DELETE" });
        refresh();
      };
      const cells = [Object.assign(document.createElement("code"), { textContent: `go/${l.slug}` }), a, document.createTextNode(String(l.hits)), del];
      for (const c of cells) tr.appendChild(document.createElement("td")).append(c);
      return tr;
    }),
  );
  show(true);
}

$("login").onsubmit = (e) => {
  e.preventDefault();
  token = $<HTMLInputElement>("token").value;
  localStorage.setItem("go-token", token);
  refresh().catch(() => ($("error").textContent = "Wrong token"));
};

$("add").onsubmit = async (e) => {
  e.preventDefault();
  const slug = $<HTMLInputElement>("slug");
  const url = $<HTMLInputElement>("url");
  const res = await api("/api/links", { method: "POST", body: JSON.stringify({ slug: slug.value, url: url.value }) });
  $("error").textContent = res.ok ? "" : ((await res.json()) as { error: string }).error;
  if (res.ok) {
    slug.value = url.value = "";
    refresh();
  }
};

token ? refresh().catch(() => show(false)) : show(false);
