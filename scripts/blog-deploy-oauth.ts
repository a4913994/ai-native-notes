import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

// Auth config locations follow the repository's pinned Wrangler 4.71 runtime.
// Tokens stay in Wrangler's credential store and this process's memory.
const legacy = join(homedir(), '.wrangler');
const base = existsSync(legacy) ? legacy : process.platform === 'win32'
  ? join(process.env.APPDATA!, 'xdg.config', '.wrangler')
  : join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), '.wrangler');
const credentialFile = Bun.file(join(base, 'config', 'default.toml'));
if (!(await credentialFile.exists())) throw new Error('First run: ./scripts/blog.ps1 x wrangler login');
const auth = Bun.TOML.parse(await credentialFile.text()) as {oauth_token?: string; expiration_time?: string};
if (!auth.oauth_token || !auth.expiration_time || Date.parse(auth.expiration_time) <= Date.now()) {
  throw new Error('Wrangler OAuth login is missing or expired. Run wrangler login, then retry deployment.');
}
process.env.CLOUDFLARE_API_TOKEN = auth.oauth_token;
await import('./blog-deploy');
