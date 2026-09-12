import { blogClient, checked } from './blog-api';

const backup = process.argv[2];
if (!backup || !(await Bun.file(backup).exists())) throw new Error('Pass the database backup path created before acceptance.');
const {request,origin} = await blogClient('.env.production.local');
if (new URL(origin).protocol !== 'https:') throw new Error('Expected the configured HTTPS production origin.');
const marker = `acceptance-${Date.now()}`;
const ids: number[] = [];
const anonymous = (path: string) => request(path, 'GET', undefined, false);
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
let imageUrl = '';
try {
  const auth = await (await checked(await anonymous('/api/auth/status'))).json() as any;
  assert(auth.password && !auth.github, 'Expected password-only login');
  const created = await (await checked(await request('/api/feed', 'POST', {
    title: `[验收测试] ${marker}`, alias: marker, content: '私密草稿 / Private draft',
    draft: true, listed: true, tags: ['工程实践'],
  }))).json() as any;
  const id = created.insertedId;
  ids.push(id);
  assert((await anonymous(`/api/feed/${id}`)).status === 403, 'Draft leaked anonymously');
  await checked(await request(`/api/feed/${id}`, 'POST', {
    title: `[验收测试] 中文与 English`, content: `中文和 English\n\n\`\`\`typescript\nconst published = true;\n\`\`\``,
    draft: false, listed: true, tags: ['工程实践'],
  }));
  const published = await (await checked(await anonymous(`/api/feed/${marker}`))).json() as any;
  assert(published.content.includes('const published = true'), 'Publish failed');
  const filtered = await (await checked(await anonymous('/api/feed?tag=工程实践&limit=50'))).json() as any;
  assert(filtered.data.some((post: any) => post.id === id), 'Published article missing from filtered list');
  await checked(await request(`/api/feed/${id}`, 'POST', {draft: true, listed: false, tags: ['项目记录']}));
  for (const tag of ['工程实践','项目记录']) {
    const listing = await (await checked(await anonymous(`/api/feed?tag=${encodeURIComponent(tag)}&limit=50`))).json() as any;
    assert(!listing.data.some((post: any) => post.id === id), 'Private article leaked via list cache');
  }
  assert((await anonymous(`/api/feed/${marker}`)).status === 403, 'Previously published content leaked after making private');
  const denied = await request(`/api/feed/${id}`, 'POST', {title: 'unauthorized'}, false);
  assert([401, 403].includes(denied.status), `Expected anonymous edit denial, received HTTP ${denied.status}`);
  assert((await anonymous('/api/feed/about')).status === 403, 'About draft privacy changed');
  const form = new FormData();
  form.set('key', `${marker}.png`);
  form.set('file', new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII='), c => c.charCodeAt(0))], {type:'image/png'}), `${marker}.png`);
  const uploaded = await (await checked(await request('/api/storage', 'POST', form))).json() as any;
  imageUrl = new URL(uploaded.url, origin).href;
  assert(imageUrl.startsWith(`${origin}/api/blob/`), 'Unexpected public image origin');
  const image = await checked(await fetch(imageUrl));
  assert(image.headers.get('content-type')?.startsWith('image/'), 'Upload did not serve image');
  assert((await image.arrayBuffer()).byteLength > 0, 'Empty image');
  console.log('PASS login, draft, publish, edit, privacy after cache hits, anonymous edit denial, image upload and public read');
} finally {
  for (const id of ids) await checked(await request(`/api/feed/${id}`, 'DELETE'));
  await Bun.write('artifacts/production-acceptance.json', JSON.stringify({origin,marker,ids,imageUrl},null,2));
}
for (const path of ['/', '/blog', '/newsletter', '/socials', '/understanding-ai-native', '/rss.xml', '/atom.xml', '/sitemap.xml', '/robots.txt']) {
  const response = await checked(await anonymous(path));
  const body = await response.text();
  assert(!body.includes(marker), 'Acceptance content leaked into metadata');
  assert(!body.includes('localhost:11498'), 'Local address in production response');
  if (path.endsWith('.xml')) assert(body.includes(origin), 'Production public URL missing');
  console.log(`PASS ${path} ${response.status}`);
}
