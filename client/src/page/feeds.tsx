import { useEffect, useState } from 'react';
import { useSearch } from 'wouter';
import { client } from '../app/runtime';
import { NotebookHome, type HomeFeedData } from '../components/notebook-home';
import { useSiteConfig } from '../hooks/useSiteConfig';
import { readHomeQuery } from '../utils/home-query';
export function FeedsPage() {
  const site = useSiteConfig();
  const search = useSearch();
  const { page, limit, type } = readHomeQuery(search,site.pageSize);
  const [feeds,setFeeds] = useState<HomeFeedData>({size:0,data:[],hasNext:false});
  const [status,setStatus] = useState<'loading'|'ready'|'error'>('loading');
  const [attempt,retry] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus('loading');
    client.feed.list({page,limit,type}).then(({data,error}) => {
      if (!active) return;
      if (error || !data) {setStatus('error');return;}
      setFeeds(data as unknown as HomeFeedData);
      setStatus('ready');
    }).catch(() => {if(active) setStatus('error');});
    return () => { active=false; };
  },[page,limit,type,attempt]);
  return <NotebookHome feeds={feeds} status={status} retry={() => retry(value => value+1)} />;
}
