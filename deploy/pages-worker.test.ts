import { describe, expect, it, test } from "bun:test";
import worker from "./pages-worker";

describe("Pages gateway", () => {
  it("preserves credentials and POST body on same-origin API calls", async () => {
    const req = new Request("https://notes.pages.dev/api/auth/login", { method: "POST", headers: { Cookie: "token=test" }, body: "test body" });
    const res = await worker.fetch(req, {
      ASSETS: { fetch: async () => { throw new Error("must use backend"); } },
      BACKEND: { fetch: async (forwarded) => {
        expect(forwarded.url).toBe(req.url);
        expect(forwarded.headers.get("cookie")).toBe("token=test");
        expect(await forwarded.text()).toBe("test body");
        return new Response("ok", { headers: { "set-cookie": "token=next; Path=/" } });
      } },
    });
    expect(res.headers.get("set-cookie")).toContain("token=next");
  });
  it("routes feeds, metadata and images to the backend", async () => {
    for (const path of ["/rss.xml", "/robots.txt", "/sitemap.xml", "/favicon.ico", "/api/blob/images/demo.png"]) {
      const response = await worker.fetch(new Request(`https://notes.pages.dev${path}`), {
        ASSETS: { fetch: async () => new Response("wrong") }, BACKEND: { fetch: async () => new Response("backend") },
      });
      expect(await response.text()).toBe("backend");
    }
  });
  it("falls back to the SPA for deep links, but preserves missing asset errors", async () => {
    const env = { BACKEND: { fetch: async () => new Response("wrong") }, ASSETS: { fetch: async (req: Request) => new Response(new URL(req.url).pathname === "/" ? "app" : "missing", { status: new URL(req.url).pathname === "/" ? 200 : 404 }) } };
    expect(await (await worker.fetch(new Request("https://notes.pages.dev/feed/12"), env)).text()).toBe("app");
    expect((await worker.fetch(new Request("https://notes.pages.dev/missing.png"), env)).status).toBe(404);
  });
});

const env = {
  CANONICAL_ORIGIN: 'https://aifield.cc', LEGACY_HOST: 'blog.pages.dev',
  ASSETS: {fetch: async () => new Response('asset')},
  BACKEND: {fetch: async (r: Request) => new Response(`${r.method} ${new URL(r.url).pathname}`)},
};
test('legacy and www document links preserve paths and queries on canonical origin', async () => {
  for (const host of ['blog.pages.dev', 'www.aifield.cc']) {
    const response = await worker.fetch(new Request(`https://${host}/feed/2?ref=rss`), env);
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://aifield.cc/feed/2?ref=rss');
  }
});
test('canonical and preview hosts do not loop or redirect', async () => {
  for (const host of ['aifield.cc', 'preview.blog.pages.dev']) {
    expect((await worker.fetch(new Request(`https://${host}/feed/2`), env)).status).toBe(200);
  }
  expect((await worker.fetch(new Request('https://blog.pages.dev/'), {...env, CANONICAL_ORIGIN:'https://blog.pages.dev'})).status).toBe(200);
});
test('legacy API requests keep their origin and methods, and cached assets keep working', async () => {
  for (const method of ['GET', 'POST']) {
    const response = await worker.fetch(new Request('https://blog.pages.dev/api/auth/login', {method}), env);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe(`${method} /api/auth/login`);
  }
  expect(await (await worker.fetch(new Request('https://blog.pages.dev/assets/main.js'), env)).text()).toBe('asset');
});
