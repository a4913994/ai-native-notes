import { endpoint } from '../config';

const cache = new Map<string, { expires: number; value: Promise<unknown> }>();

export function loadNews<T>(path: string, refresh = false): Promise<T> {
  const existing = cache.get(path);
  if (!refresh && existing && existing.expires > Date.now()) return existing.value as Promise<T>;
  const value = fetch(`${endpoint}/api/news${path}`).then(response => {
    if (!response.ok) throw new Error(response.status === 404 ? 'missing' : 'error');
    return response.json();
  }).catch(error => { cache.delete(path); throw error; });
  if (cache.size >= 30) cache.delete(cache.keys().next().value!);
  cache.set(path, { expires: Date.now() + 30000, value });
  return value;
}
