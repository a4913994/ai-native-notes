import { describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const modulePath = fileURLToPath(new URL("./setup-dev.ts", import.meta.url));

function generate(extra: string) {
  const dir = mkdtempSync(join(tmpdir(), "rin-setup-test-"));
  try {
    mkdirSync(join(dir, "client"));
    writeFileSync(join(dir, ".env.local"), `JWT_SECRET=test-only-jwt\nR2_BUCKET_NAME=test-local\n${extra}`);
    const result = Bun.spawnSync([process.execPath, "-e", `import { runSetupDev } from ${JSON.stringify(modulePath)}; await runSetupDev();`], {
      cwd: dir, stdout: "pipe", stderr: "pipe",
    });
    return {
      code: result.exitCode,
      config: result.exitCode === 0 ? readFileSync(join(dir, "wrangler.toml"), "utf8") : "",
      secrets: result.exitCode === 0 ? readFileSync(join(dir, ".dev.vars"), "utf8") : "",
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("local blog setup", () => {
  it("supports password-only auth, optional avatar, and server-side site settings", () => {
    const result = generate('ADMIN_USERNAME=admin\nADMIN_PASSWORD=test-only-password\nNAME=AI Native Notes\nDESCRIPTION=中文 / English\nRSS_ENABLE=true\nFRONTEND_URL=http://localhost:11498');
    expect(result.code).toBe(0);
    expect(result.config).toContain('NAME = "AI Native Notes"');
    expect(result.config).toContain('DESCRIPTION = "中文 / English"');
    expect(result.config).toContain('RSS_ENABLE = "true"');
    expect(result.config).not.toContain("ADMIN_PASSWORD");
    expect(result.config).not.toContain("undefined");
    expect(result.secrets).toContain('ADMIN_PASSWORD="test-only-password"');
    expect(result.secrets).not.toContain("RIN_GITHUB_CLIENT_ID");
  });
  it("rejects incomplete authentication", () => {
    expect(generate("ADMIN_USERNAME=admin").code).not.toBe(0);
  });
  it("preserves GitHub-only login compatibility", () => {
    expect(generate("RIN_GITHUB_CLIENT_ID=test-id\nRIN_GITHUB_CLIENT_SECRET=test-secret").code).toBe(0);
  });
});
