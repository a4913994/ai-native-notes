import { useEffect, useState } from 'react';
import { client } from '../app/runtime';
import { loadPublicPosts, type PublicPost } from '../utils/public-posts';

export function usePublicPosts(all = false, limit = 3) {
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadPublicPosts(query => client.feed.list(query), all, limit, () => cancelled).then(data => {
      if (!cancelled) { setPosts(data); setStatus('ready'); }
    }).catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [all, limit, attempt]);
  return { posts, status, retry: () => retry(value => value + 1) };
}
