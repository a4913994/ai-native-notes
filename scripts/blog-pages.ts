import { cp, mkdir } from 'node:fs/promises';

export async function publishPages(project: string, worker: string) {
  // A fresh directory prevents old hashed bundles from entering the next release.
  // Retain previous build outputs locally; no recursive deletion is required.
  const output = `dist/pages-${Date.now()}`;
  await mkdir(output, {recursive: true});
  await cp('dist/client', output, {recursive: true});
  async function run(args: string[], cwd = process.cwd()) {
    const child = Bun.spawn([process.execPath, ...args], {cwd, stdout:'inherit', stderr:'inherit', env:process.env});
    if (await child.exited !== 0) throw new Error(`Pages command failed: ${args[0]}`);
  }
  await run(['build', 'deploy/pages-worker.ts', '--target=browser', `--outfile=${output}/_worker.js`]);
  await mkdir('deploy/pages', {recursive:true});
  await Bun.write('deploy/pages/wrangler.toml', `name = ${JSON.stringify(project)}\npages_build_output_dir = "../../${output}"\ncompatibility_date = "2026-01-20"\n[[services]]\nbinding = "BACKEND"\nservice = ${JSON.stringify(worker)}\n`);
  await run(['x','wrangler','pages','deploy',`../../${output}`,'--project-name',project,'--branch','main','--commit-dirty=true'],'deploy/pages');
}
