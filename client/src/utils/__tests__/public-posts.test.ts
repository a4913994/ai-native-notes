import { describe, expect, it } from 'bun:test';
import { archiveIndex, loadPublicPosts, type PublicPost } from '../public-posts';

const post = (id: number, year: number, tags: string[] = []) => ({ id, title: `Post ${id}`, createdAt: `${year}-01-01T00:00:00Z`, hashtags: tags.map((name, id) => ({id,name})) } as PublicPost);
describe('Public archive', () => {
  it('loads beyond one API page using only the public list and deduplicates changing page boundaries', async () => {
    const calls: unknown[] = [];
    const items = Array.from({length: 60}, (_,i) => post(i, i < 50 ? 2026 : 2025, [i < 50 ? 'A' : 'B']));
    const result = await loadPublicPosts(async query => {
      calls.push(query);
      return {data:{size:60,data:query.page === 1 ? items.slice(0,50) : items.slice(49),hasNext:query.page === 1}};
    }, true, 50);
    expect(result).toHaveLength(60);
    expect(calls).toEqual([{type:'normal',page:1,limit:50},{type:'normal',page:2,limit:50}]);
    expect(archiveIndex(result, 'B').count).toBe(10);
    expect(archiveIndex(result, 'B').groups[0][0]).toBe('2025');
  });
  it('sorts chronologically, counts tags once per post and supports unknown filters', () => {
    const result = archiveIndex([post(1,2024,['A','A']),post(2,2026,['A','B']),post(3,2025,[])]);
    expect(result.groups.map(([year])=>year)).toEqual(['2026','2025','2024']);
    expect(result.tags).toEqual([['A',2],['B',1]]);
    expect(archiveIndex([post(1,2026)],'unknown').count).toBe(0);
  });
  it('stops on API errors and non-progressing pages instead of showing an incomplete archive', async () => {
    await expect(loadPublicPosts(async()=>({error:{status:500,value:'Error'}}),true,50)).rejects.toThrow();
    await expect(loadPublicPosts(async()=>({data:{size:2,data:[post(1,2026)],hasNext:true}}),true,50)).rejects.toThrow('no progress');
  });
});
