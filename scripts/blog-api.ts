import { parseEnv } from "../cli/src/lib/env";

export async function blogClient(envFile = ".env.local") {
  const env = parseEnv(await Bun.file(envFile).text());
  const origin = new URL(env.FRONTEND_URL).origin;
  const response = await fetch(`${origin}/api/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: env.ADMIN_USERNAME, password: env.ADMIN_PASSWORD }),
  });
  if (!response.ok) throw new Error(`Login failed: ${response.status}`);
  const login = await response.json() as { token: string };
  async function request(path: string, method = "GET", body?: unknown, authenticated = true) {
    return fetch(`${origin}${path}`, {
      method,
      headers: { ...(authenticated ? { Authorization: `Bearer ${login.token}` } : {}),
        ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}) },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    });
  }
  return { env, origin, request };
}

export async function checked(response: Response) {
  if (!response.ok) throw new Error(`${response.url}: HTTP ${response.status}: ${(await response.text()).slice(0, 250)}`);
  return response;
}
