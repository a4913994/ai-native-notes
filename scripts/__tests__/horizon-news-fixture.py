"""Offline adapter integration scenarios, invoked by bun:test."""
import asyncio
from datetime import datetime, timezone
import importlib.util
import html
import json
import logging
import os
from pathlib import Path
import sys
import tempfile
from types import SimpleNamespace as N
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('adapter', Path(__file__).parents[1] / 'horizon-news.py')
adapter = importlib.util.module_from_spec(spec)
spec.loader.exec_module(adapter)
scenario = sys.argv[1]
guard_twitter = adapter.guard_twitter_empty_results
adapter.guard_twitter_empty_results = lambda module: None
configure_extra = adapter.configure_extra_scrapers
adapter.configure_extra_scrapers = lambda module, cutoff: None
item = N(id='one', title='Example', url='https://example.com', published_at=datetime.now(timezone.utc), processing=N(analysis=N(score=8)))


class Runner:
    def __init__(self, config, storage):
        self.profiles = N(names={'tech-news': '科技新闻'})
        failed = scenario in ('partial', 'all-failed')
        self.last_fetch_report = N(status='failure' if scenario == 'all-failed' else 'partial_failure' if failed else 'success', outcomes=[N(source_name='rss', status='failure' if failed else 'success')])

    async def fetch_all_sources(self, start):
        if scenario == 'all-headlines':
            return [N(id=str(i), title=f'Headline {i} <script>alert(1)</script>', url=f'https://example.com/{i}', published_at=item.published_at, processing=N(analysis=N(score=i / 3 if i else None))) for i in range(25)]
        if scenario == 'twitter-failure':
            logging.getLogger('src.scrapers.twitter').error('Failed to fetch Apify dataset example: HTTP 403')
        if scenario == 'swallowed-failure':
            logging.getLogger('src.scrapers.reddit').warning('Reddit RSS fallback failed for r/%s: %s', 'Example', 'https://secret.example/?key=PRIVATE')
        return [] if scenario == 'empty' else [item]

    def merge_cross_source_duplicates(self, items):
        return items

    async def analyze_items(self, items):
        if scenario == 'ai-failed':
            return [N(processing=N(analysis=N(score=None)))]
        return items

    async def select_digest_items(self, items):
        raise AssertionError('The full feed must not apply the old selection threshold')

    async def enrich_items(self, items):
        if scenario == 'all-headlines':
            assert len(items) == 20
            assert items[0].id == '24' and items[-1].id == '5'
        return N(failed_count=1 if scenario == 'enrichment-failed' else 0, failed_ids=['one'] if scenario == 'enrichment-failed' else [])


class Client:
    async def complete(self, **kwargs):
        return '{"ok":true}'


class Summarizer:
    def __init__(self, **kwargs):
        pass

    async def generate_summary(self, *args, **kwargs):
        return '## 科技新闻\n\n[资讯](https://example.com)'

    def _format_item(self, item, *args, **kwargs):
        return f'### [{html.escape(item.title)}]({item.url})\n\nDetailed summary\n\n'


modules = {'src.orchestrator': N(HorizonOrchestrator=Runner), 'src.storage.manager': N(StorageManager=lambda path: path), 'src.models': N(Config=N(model_validate=lambda data: N(ai=N(), digest=N(profile_order=['tech-news'])))), 'src.ai.summarizer': N(DailySummarizer=Summarizer), 'src.ai.client': N(create_ai_client=lambda config: Client())}
with tempfile.TemporaryDirectory() as temporary, patch.dict(sys.modules, modules), patch.dict(os.environ, {'HORIZON_MODEL': 'test', 'HORIZON_BASE_URL': 'https://example.com'}):
    root = Path(temporary)
    (root / 'data').mkdir()
    (root / 'data/config.github.json').write_text(json.dumps({'ai': {}, 'processing': {}, 'sources': {'rss': [{'name': 'LWN.net', 'url': 'private'}]}}))
    output = root / 'digest.json'
    if scenario == 'extra-sources':
        config = adapter.make_config(root)
        assert config['sources']['openbb']['watchlists'][0]['provider'] == 'yfinance'
        assert config['sources']['ossinsight']['enabled']
        assert not adapter.english_extra_item(N(source_type='openbb', title='中文资讯', content=''))
        assert adapter.english_extra_item(N(source_type='openbb', title='AI chip news', content='English report'))
        cutoff = datetime.now(timezone.utc)
        class FakeOSS:
            BASE_URL = 'https://example.com'
            def _row_to_item(self, row, language):
                return N(published_at=datetime.now(timezone.utc), metadata={})
        module = N(OSSInsightScraper=FakeOSS)
        configure_extra(module, cutoff)
        scraper = module.OSSInsightScraper()
        assert scraper._row_to_item({}, 'All').published_at == cutoff
        diagnostic = adapter.SourceDiagnostics()
        logging.getLogger().addHandler(diagnostic)
        async def get(*args, **kwargs):
            return N(raise_for_status=lambda: None, json=lambda: {'data_quality': {'status': 'unavailable'}, 'data': {'rows': []}})
        scraper.client = N(get=get)
        assert asyncio.run(scraper._fetch_period('past_24_hours', 'All')) == []
        assert any('OSS Insight' in warning for warning in diagnostic.failed)
        logging.getLogger('src.scrapers.openbb').warning('OpenBB watchlist test failed: hidden credentials')
        assert any('OpenBB' in warning for warning in diagnostic.failed)
        assert all('hidden credentials' not in warning for warning in diagnostic.failed)
        async def failed_get(*args, **kwargs):
            raise RuntimeError('network unavailable')
        scraper.client = N(get=failed_get)
        try:
            asyncio.run(scraper._fetch_period('past_24_hours', 'All'))
            raise AssertionError('Network failure was swallowed')
        except RuntimeError:
            pass
    elif scenario == 'twitter-security':
        class EmptyScraper:
            async def _fetch_dataset(self, token, dataset_id):
                return []
        module = N(TwitterScraper=EmptyScraper)
        guard_twitter(module)
        diagnostic = adapter.SourceDiagnostics()
        logging.getLogger().addHandler(diagnostic)
        assert asyncio.run(module.TwitterScraper()._fetch_dataset('private', 'dataset')) == []
        assert any('Twitter' in warning for warning in diagnostic.failed)
        twitter = adapter.make_config(root)['sources']['twitter']
        assert twitter['keywords'] and all('lang:en' in q for q in twitter['keywords'])
        assert any('arxiv' in q for q in twitter['keywords'])
        with patch.dict(os.environ, {'APIFY_TOKEN': 'SECRET_TEST_TOKEN'}):
            adapter.redact_apify_logs()
            record = logging.getLogRecordFactory()('src.scrapers.twitter', logging.ERROR, '', 1, 'Failed to start Apify run: %s', ('https://api.apify.com/?token=SECRET_TEST_TOKEN',), None)
            assert 'SECRET_TEST_TOKEN' not in record.getMessage()
            handler = adapter.SourceDiagnostics()
            handler.emit(record)
            assert any('Twitter' in warning for warning in handler.failed)
    elif scenario in ('all-failed', 'ai-failed'):
        try:
            asyncio.run(adapter.generate(root, output))
            raise AssertionError('Failure was reported as success')
        except RuntimeError:
            assert not output.exists()
    elif scenario == 'old-file':
        output.write_text('old digest')
        with patch.object(sys, 'argv', ['adapter', 'generate', '--output', str(output)]):
            try:
                adapter.main()
                raise AssertionError('Old output was accepted')
            except RuntimeError:
                assert output.read_text() == 'old digest'
    else:
        asyncio.run(adapter.generate(root, output))
        payload = json.loads(output.read_text(encoding='utf-8'))
        adapter.validate_artifact(payload)
        assert payload['status'] == ('empty' if scenario == 'empty' else 'ready')
        assert bool(payload['sourceWarnings']) == (scenario in ('partial', 'swallowed-failure', 'twitter-failure', 'enrichment-failed', 'all-headlines'))
        if scenario == 'all-headlines':
            assert '共收录 25 条' in payload['summary']
            assert payload['content'].count('Detailed summary') == 20
            assert payload['content'].count('<li>') == 5
            assert '<details>' in payload['content'] and '<details open' not in payload['content']
            assert '<script>' not in payload['content']
            for i in range(25):
                assert f'https://example.com/{i}' in payload['content']
        assert 'PRIVATE' not in json.dumps(payload)
        payload['date'] = '2000-01-01'
        try:
            adapter.validate_artifact(payload)
            raise AssertionError('Mismatched date was accepted')
        except ValueError:
            pass
print('Scenario passed:', scenario)
