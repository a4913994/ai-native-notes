import type { ApiResponse, FeedListResponse } from '@rin/api';

export type PublicPost = FeedListResponse['data'][number];
type FetchPage = (query: { type: 'normal'; page: number; limit: number }) => Promise<ApiResponse<FeedListResponse>>;

/** Load every public page before grouping/filtering the archive. */
export async function loadPublicPosts(fetchPage: FetchPage, all = false, limit = 3, cancelled = () => false): Promise<PublicPost[]> {
  const posts = new Map<number, PublicPost>();
  for (let page = 1; !cancelled(); page++) {
    const { data, error } = await fetchPage({ type: 'normal', page, limit });
    if (cancelled()) return [];
    if (error || !data) throw new Error('Could not load public posts');
    const before = posts.size;
    for (const post of data.data) posts.set(post.id, post);
    if (!all || !data.hasNext) return [...posts.values()];
    if (before === posts.size) throw new Error('Archive pagination made no progress');
  }
  return [];
}

export function archiveIndex(posts: PublicPost[], tag = '') {
  const tags = new Map<string, number>();
  for (const post of posts) for (const name of new Set(post.hashtags.map(tag => tag.name))) tags.set(name, (tags.get(name) || 0) + 1);
  const selected = posts.filter(post => !tag || post.hashtags.some(item => item.name === tag));
  const groups = new Map<string, PublicPost[]>();
  for (const post of [...selected].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id - a.id)) {
    const year = new Date(post.createdAt).getFullYear();
    const key = Number.isNaN(year) ? 'undated' : String(year);
    groups.set(key, [...(groups.get(key) || []), post]);
  }
  return { tags: [...tags].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])), groups: [...groups], count: selected.length };
}
