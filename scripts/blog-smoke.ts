import { blogClient, checked } from "./blog-api";

const { request, origin } = await blogClient();
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error("Smoke script is local-only.");
const ids: number[] = [];
const marker = `rin-smoke-${Date.now()}`;
const keep = process.argv.includes("--keep");
try {
  const auth = await (await checked(await request("/api/auth/status", "GET", undefined, false))).json() as any;
  if (!auth.password || auth.github) throw new Error("Expected password-only login");
  for (const [language, title] of [["中文", "中文写作与代码展示"], ["English", "Engineering notes in English"]]) {
    const res = await checked(await request("/api/feed", "POST", {
      title: `[验收测试] ${title}`, content: [`# ${title}`, `${marker}-${language}`, '```typescript\nconst note = "AI Native Notes";\nconsole.log(note);\n```'].join("\n\n"),
      alias: `${marker}-${ids.length}`, draft: false, listed: true, tags: [language, "工程实践"],
    }));
    ids.push((await res.json() as any).insertedId);
  }
  const privateResult = await checked(await request("/api/feed", "POST", {
    title: `[验收测试] private ${marker}`, content: `Private ${marker}`, draft: true, listed: false, tags: ["项目记录"],
  }));
  const privateId = (await privateResult.json() as any).insertedId;
  ids.push(privateId);
  const privateRead = await request(`/api/feed/${privateId}`, "GET", undefined, false);
  if (privateRead.ok) throw new Error("Anonymous access to private draft");
  await checked(await request(`/api/feed/${ids[0]}`, "POST", { title: "[验收测试] 中文写作与代码展示（已编辑）", listed: true, tags: ["中文", "工程实践"] }));
  const anonymousEdit = await request(`/api/feed/${ids[0]}`, "POST", { title: "Unauthorized", listed: true }, false);
  if (anonymousEdit.ok) throw new Error("Anonymous edit was accepted");
  const file = new FormData();
  file.set("key", "acceptance.png");
  file.set("file", new Blob([Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII="), c => c.charCodeAt(0))], { type: "image/png" }), "acceptance.png");
  const uploaded = await (await checked(await request("/api/storage", "POST", file))).json() as { url: string };
  const image = await checked(await fetch(new URL(uploaded.url, origin)));
  if (!image.headers.get("content-type")?.startsWith("image/")) throw new Error("Upload not served as image");
  for (const path of ["/", `/feed/${ids[0]}`, `/feed/${ids[1]}`, "/rss.xml", "/sitemap.xml", "/robots.txt"]) {
    const res = await checked(await request(path, "GET", undefined, false));
    const text = await res.text();
    if (path.endsWith(".xml") && text.includes(`private ${marker}`)) throw new Error("Private content leaked into metadata");
    console.log(`PASS ${path} (${res.status})`);
  }
  console.log("PASS password login, bilingual publish/edit, private draft protection, anonymous edit denial, image upload and anonymous read");
  await Bun.write("artifacts/smoke.json", JSON.stringify({ origin, ids, imageUrl: uploaded.url, passed: true, kept: keep }, null, 2));
} finally {
  if (!keep) for (const id of ids) await checked(await request(`/api/feed/${id}`, "DELETE"));
}
