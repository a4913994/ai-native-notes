import { blogClient, checked } from './blog-api';

// Explicit migration command; never part of startup or a routine deployment.
const [snapshotPath, envPath] = process.argv.slice(2);
if (!snapshotPath || !envPath) throw new Error('Usage: blog-import-snapshot.ts <snapshot.json> <target.env>');
const snapshot = await Bun.file(snapshotPath).json();
const {request} = await blogClient(envPath);
await checked(await request('/api/config/server', 'POST', {'ai_summary.enabled': false}));
await checked(await request('/api/config/client', 'POST', snapshot.config));
for (const post of [...snapshot.articles].sort((a, b) => a.id - b.id)) {
  if (!post.alias) throw new Error(`Article ${post.id} needs a stable alias before import.`);
  const existing = await request(`/api/feed/${encodeURIComponent(post.alias)}`);
  if (existing.ok) {
    const saved = await existing.json() as any;
    if (saved.content !== post.content || saved.title !== post.title) throw new Error(`Conflicting existing article: ${post.alias}`);
    console.log(`Kept existing ${post.alias}`);
    continue;
  }
  if (existing.status !== 404) await checked(existing);
  const response = await checked(await request('/api/feed', 'POST', {
    title: post.title, alias: post.alias, content: post.content, summary: post.summary,
    draft: Boolean(post.draft), listed: Boolean(post.listed), createdAt: post.createdAt,
    tags: post.hashtags.map((tag: {name: string}) => tag.name),
  }));
  const {insertedId} = await response.json() as {insertedId: number};
  if (post.top) await checked(await request(`/api/feed/${insertedId}`, 'POST', {top: true}));
  console.log(`Imported ${post.alias} (${post.draft ? 'private draft' : 'published'})`);
}
