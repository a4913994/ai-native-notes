// Run explicitly once; never run during startup or deployment.
import posts from '../content/starter-posts.json';
import { blogClient, checked } from './blog-api';

const { request, origin } = await blogClient();
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Starter publication is local-only.');
const publicationTime = Date.now();
for (const [index, post] of posts.entries()) {
  const existing = await request(`/api/feed/${post.alias}`);
  if (existing.ok) {
    console.log(`Kept existing article: ${post.alias}`);
    continue;
  }
  if (existing.status !== 404) await checked(existing);
  const response = await checked(await request('/api/feed', 'POST', {
    ...post, draft: false, listed: true,
    createdAt: new Date(publicationTime - index * 1000).toISOString(),
  }));
  const { insertedId } = await response.json() as { insertedId: number };
  console.log(`Published ${insertedId}: ${origin}/feed/${insertedId}`);
}
