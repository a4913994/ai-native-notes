import { mkdir } from "node:fs/promises";
import { publishPages } from "./blog-pages";
import { parseEnv } from "../cli/src/lib/env";
import { runCloudflareDeploy } from "../cli/src/tasks/deploy-cf";

const file = Bun.file(".env.production.local");
if (!(await file.exists())) throw new Error("Copy .env.production.example to .env.production.local and fill the Cloudflare credentials.");
const env = parseEnv(await file.text());
// Allow a short-lived deployment token supplied by the authenticated CLI session.
// Never persist OAuth tokens alongside the site's production configuration.
env.CLOUDFLARE_API_TOKEN ||= process.env.CLOUDFLARE_API_TOKEN || "";
const required = ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "PAGES_NAME", "WORKER_NAME", "DB_NAME", "R2_BUCKET_NAME", "FRONTEND_URL", "S3_ACCESS_HOST", "ADMIN_USERNAME", "ADMIN_PASSWORD", "JWT_SECRET"];
for (const name of required) if (!env[name]) throw new Error(`Missing production configuration: ${name}`);
if (env.ADMIN_PASSWORD.length < 24 || env.JWT_SECRET.length < 32) throw new Error("Use a random production password (24+ characters) and JWT secret (32+ characters).");
const dev = parseEnv(await Bun.file(".env.local").text());
for (const name of ["ADMIN_PASSWORD", "JWT_SECRET"]) if (env[name] === dev[name]) throw new Error(`Production ${name} must differ from development.`);
if (env.FRONTEND_URL !== `https://${env.PAGES_NAME}.pages.dev`) throw new Error("First deployment uses the Pages default domain; align FRONTEND_URL with PAGES_NAME.");
if (env.S3_ACCESS_HOST !== `${env.FRONTEND_URL}/api/blob`) throw new Error("Use the verified same-origin /api/blob endpoint for R2 images.");
for (const name of ["PAGES_NAME", "WORKER_NAME", "DB_NAME", "R2_BUCKET_NAME"]) if (!/^ai-native-notes[a-z0-9-]*$/.test(env[name])) throw new Error(`Invalid blog resource name: ${name}`);
// Avoid inheriting local OAuth, S3 credentials or development defaults from Bun's dotenv loader.
for (const key of Object.keys(dev)) delete process.env[key];
Object.assign(process.env, env);

async function run(args: string[], cwd = process.cwd()) {
  const child = Bun.spawn([process.execPath, ...args], { cwd, stdout: "inherit", stderr: "inherit", env: process.env });
  if (await child.exited !== 0) throw new Error(`Command failed: ${args.join(" ")}`);
}
async function cf(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}${path}`, {
    method, headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json() as any;
  if (!res.ok || !json.success) throw new Error(`Cloudflare ${method} ${path}: ${JSON.stringify(json.errors)}`);
  return json.result;
}
await cf("/workers/subdomain"); // Read-only authorization preflight before resource creation.
if (process.argv.includes("--preflight")) {
  console.log("Production configuration and Cloudflare account access verified.");
  process.exit(0);
}
const buckets = await cf("/r2/buckets");
if (!buckets.buckets.some((bucket: any) => bucket.name === env.R2_BUCKET_NAME)) await cf("/r2/buckets", "POST", { name: env.R2_BUCKET_NAME });
const projects = await cf("/pages/projects");
const project = projects.find((project: any) => project.name === env.PAGES_NAME)
  || await cf("/pages/projects", "POST", { name: env.PAGES_NAME, production_branch: "main" });
if (`https://${project.subdomain}` !== env.FRONTEND_URL) {
  throw new Error(`Pages assigned ${project.subdomain}. Choose a unique PAGES_NAME and update FRONTEND_URL/S3_ACCESS_HOST before publishing.`);
}
await run(["run", "build:client"]);
await runCloudflareDeploy("all");
await publishPages(env.PAGES_NAME, env.WORKER_NAME);
await mkdir("backups", { recursive: true });
await run(["x", "wrangler", "d1", "export", env.DB_NAME, "--remote", "--output", `backups/before-acceptance-${Date.now()}.sql`]);
console.log(`Deployed ${env.FRONTEND_URL}. Import the reviewed content snapshot on first deployment, then verify from the user's network.`);
