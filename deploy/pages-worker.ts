type Service = { fetch(request: Request): Promise<Response> };
type PagesEnv = { ASSETS: Service; BACKEND: Service };

export default {
  async fetch(request: Request, env: PagesEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || /^\/(rss\.xml|atom\.xml|rss\.json|feed\.json|feed\.xml|sitemap\.xml|robots\.txt|favicon(?:\.ico)?)(?:\/|$)/.test(url.pathname)) {
      // Preserve the public origin, cookies, method and body through the service binding.
      return env.BACKEND.fetch(request);
    }
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404 || /\.\w+$/.test(url.pathname) || !["GET", "HEAD"].includes(request.method)) return asset;
    return env.ASSETS.fetch(new Request(new URL("/", url.origin), request));
  },
};
