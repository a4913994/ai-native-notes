import { describe, expect, it } from 'bun:test';
import { fileURLToPath } from 'node:url';

describe('Horizon adapter failure and publication boundaries', () => {
  for (const scenario of ['ready', 'empty', 'partial', 'swallowed-failure', 'twitter-failure', 'twitter-security', 'extra-sources', 'all-headlines', 'all-failed', 'ai-failed', 'enrichment-failed', 'old-file']) {
    it(scenario, async () => {
      const child = Bun.spawn([process.platform === 'win32' ? 'python' : 'python3', '-X', 'utf8', fileURLToPath(new URL('./horizon-news-fixture.py', import.meta.url)), scenario], { stdout: 'pipe', stderr: 'pipe' });
      const code = await child.exited;
      if (code) console.error(await new Response(child.stderr).text());
      expect(code).toBe(0);
    });
  }
});
