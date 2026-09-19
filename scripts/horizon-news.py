"""Pinned Horizon adapter. No local .env or old generated files are consumed."""
import argparse
import asyncio
from datetime import datetime, timedelta, timezone
import json
import os
from pathlib import Path
import sys
import tempfile
import time
import urllib.error
import urllib.request

SHANGHAI = timezone(timedelta(hours=8))


def stamp(value):
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def request(path, payload=None):
    base = os.environ.get("BLOG_URL", "https://aifield.cc").rstrip("/")
    if not base.startswith("https://"):
        raise ValueError("BLOG_URL must use HTTPS")
    headers = {"Accept": "application/json", "User-Agent": "HorizonNews/1.0 (+https://aifield.cc/news)"}
    if payload is not None:
        headers.update({"Authorization": "Bearer " + os.environ["NEWS_SYNC_TOKEN"], "Content-Type": "application/json"})
    req = urllib.request.Request(base + "/api/news" + path, data=json.dumps(payload, ensure_ascii=False).encode() if payload is not None else None, headers=headers, method="PUT" if payload is not None else "GET")
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                return json.load(response)
        except urllib.error.HTTPError as error:
            if error.code == 404 and payload is None:
                return None
            if error.code < 500 and error.code != 429:
                raise RuntimeError(f"Blog API HTTP {error.code}") from None
        except (urllib.error.URLError, TimeoutError):
            pass
        if attempt < 2:
            time.sleep(5 * (attempt + 1))
    raise RuntimeError("Blog API unavailable after three attempts")


def make_config(root):
    config = json.loads((root / "data/config.github.json").read_text(encoding="utf-8"))
    config["ai"].update(provider="deepseek", model=os.environ["HORIZON_MODEL"], base_url=os.environ["HORIZON_BASE_URL"], api_key_env="DEEPSEEK_API_KEY", languages=["zh"])
    config["processing"]["profiles_dir"] = str(root / "profiles")
    config["email"] = None
    config["webhook"] = None
    for source in config["sources"]["rss"]:
        if source["name"] == "LWN.net":
            if os.environ.get("LWN_KEY"):
                source["url"] = source["url"].replace("${LWN_KEY}", os.environ["LWN_KEY"])
            else:
                source["url"] = "https://lwn.net/headlines/rss"
    return config


def source_warnings(report):
    if not report or report.status in ("failure", "not_attempted"):
        raise RuntimeError("No source succeeded; previous edition is preserved")
    # Do not persist exception strings: source URLs can contain credentials.
    return [f"{outcome.source_name}: 暂不可用" for outcome in report.outcomes if outcome.status == "failure"]


async def generate(root, output):
    sys.path.insert(0, str(root))
    from src.orchestrator import HorizonOrchestrator
    from src.storage.manager import StorageManager
    from src.models import Config
    from src.ai.summarizer import DailySummarizer
    from src.ai.client import create_ai_client

    end = datetime.now(timezone.utc)
    start = end - timedelta(hours=24)
    day = end.astimezone(SHANGHAI).date().isoformat()
    config = Config.model_validate(make_config(root))
    # Fail early if credentials/model are not usable, even on a quiet news day.
    client = create_ai_client(config.ai)
    await client.complete(user='Return JSON with ok true', system='Connectivity check. Output JSON.')
    with tempfile.TemporaryDirectory(prefix="horizon-news-") as temporary:
        runner = HorizonOrchestrator(config, StorageManager(temporary))
        items = await runner.fetch_all_sources(start)
        warnings = source_warnings(runner.last_fetch_report)
        # Exclude future timestamps; the edition records a fixed collection window.
        items = [item for item in items if start <= item.published_at <= end]
        selected = []
        if items:
            analyzed = await runner.analyze_items(runner.merge_cross_source_duplicates(items))
            valid = [item for item in analyzed if item.processing and item.processing.analysis and item.processing.analysis.score is not None]
            if not valid:
                raise RuntimeError("All AI analyses failed; refusing an empty success")
            if len(valid) != len(analyzed):
                warnings.append(f"AI 分析失败：{len(analyzed) - len(valid)} 条已跳过")
            selected = (await runner.select_digest_items(valid)).items
            if selected:
                enriched = await runner.enrich_items(selected)
                if enriched.failed_count == len(selected):
                    raise RuntimeError("All enrichment failed; previous edition is preserved")
                if enriched.failed_count:
                    warnings.append(f"背景分析失败：{enriched.failed_count} 条已跳过")
                    selected = [item for item in selected if item.id not in enriched.failed_ids]
        if not selected and warnings:
            raise RuntimeError("No publishable items and incomplete sources/analysis; refusing empty success")
        content = await DailySummarizer(profile_names=runner.profiles.names, profile_order=config.digest.profile_order).generate_summary(selected, day, len(items), language="zh") if selected else "今天没有符合筛选标准的新资讯。\n\n所有已配置来源已完成检查。"
        if not content.strip():
            raise RuntimeError("Empty generated Markdown")
        payload = {"date": day, "language": "zh", "title": f"每日资讯 · {day}", "summary": f"从 {len(items)} 条内容中筛选出 {len(selected)} 条资讯。", "content": content, "status": "ready" if selected else "empty", "windowStart": stamp(start), "windowEnd": stamp(end), "generatedAt": stamp(datetime.now(timezone.utc)), "sourceWarnings": warnings}
        output.parent.mkdir(parents=True, exist_ok=True)
        temporary_output = output.with_suffix(".tmp")
        temporary_output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        temporary_output.replace(output)
        print(f"Generated {day}: {len(selected)} items, {len(warnings)} warnings")


def validate_artifact(payload):
    end = datetime.fromisoformat(payload["windowEnd"].replace("Z", "+00:00"))
    generated = datetime.fromisoformat(payload["generatedAt"].replace("Z", "+00:00"))
    if payload["date"] != end.astimezone(SHANGHAI).date().isoformat() or generated < end or not payload["content"].strip():
        raise ValueError("Invalid or mismatched generated artifact")
    if payload.get("language") != "zh" or payload.get("status") not in ("ready", "empty"):
        raise ValueError("Invalid artifact language/status")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["check", "generate", "publish"])
    parser.add_argument("--horizon", type=Path, default=Path(".horizon"))
    parser.add_argument("--output", type=Path, default=Path("artifacts/horizon-news/digest.json"))
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    if args.command == "check":
        day = datetime.now(SHANGHAI).date().isoformat()
        exists = request("/" + day) is not None
        needed = args.force or not exists
        if os.environ.get("GITHUB_OUTPUT"):
            with open(os.environ["GITHUB_OUTPUT"], "a") as stream:
                stream.write(f"needed={str(needed).lower()}\n")
        print(f"{day}: {'generation needed' if needed else 'already published'}")
    elif args.command == "generate":
        if args.output.exists():
            raise RuntimeError("Output already exists; use a fresh output location")
        asyncio.run(generate(args.horizon.resolve(), args.output))
    else:
        payload = json.loads(args.output.read_text(encoding="utf-8"))
        validate_artifact(payload)
        day = payload.pop("date")
        request("/" + day, payload)
        saved = request("/" + day)
        if not saved or saved["generatedAt"] < payload["generatedAt"]:
            raise RuntimeError("Publication read-back failed")
        if saved["generatedAt"] == payload["generatedAt"] and saved["content"] != payload["content"]:
            raise RuntimeError("Published content mismatch")
        print(f"Verified https://aifield.cc/news/{day}")


if __name__ == "__main__":
    main()
