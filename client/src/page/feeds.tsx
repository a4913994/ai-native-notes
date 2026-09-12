import { lazy, Suspense, useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { Link, useSearch } from "wouter";
import { client } from "../app/runtime";
import { FeedCard, type FeedCardProps } from "../components/feed_card";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { ProfileContext } from "../state/profile";
import { ClientConfigContext } from "../state/config";
import { tryInt } from "../utils/int";

type FeedType = "normal" | "draft" | "unlisted";
type FeedList = { size: number; data: FeedCardProps[]; hasNext: boolean };
const emptyList: FeedList = { size: 0, data: [], hasNext: false };
const NotebookPreview = import.meta.env.DEV ? lazy(() => import("../components/notebook-preview")) : null;

export function FeedsPage() {
  const query = new URLSearchParams(useSearch());
  return NotebookPreview && query.get("preview") === "1"
    ? <Suspense><NotebookPreview /></Suspense>
    : <PublishedFeedsPage />;
}

function PublishedFeedsPage() {
  const { t } = useTranslation();
  const site = useSiteConfig();
  const profile = useContext(ProfileContext);
  const config = useContext(ClientConfigContext);
  const query = new URLSearchParams(useSearch());
  const rawType = query.get("type");
  const type: FeedType = rawType === "draft" || rawType === "unlisted" ? rawType : "normal";
  const page = Math.max(1, tryInt(1, query.get("page")));
  const limit = Math.max(1, tryInt(site.pageSize, query.get("limit")));
  const [feeds, setFeeds] = useState<FeedList>(emptyList);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    let active = true;
    setStatus("loading");
    client.feed.list({ page, limit, type }).then(({ data, error }) => {
      if (!active) return;
      if (error || !data) { setStatus("error"); return; }
      setFeeds({ ...data, data: Array.isArray(data.data) ? data.data as unknown as FeedCardProps[] : [] });
      setStatus("ready");
    }).catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [page, limit, type, profile?.permission]);

  return <main>
    <Helmet>
      <title>{site.name}</title>
      <meta name="description" content={site.description} />
      <meta property="og:site_name" content={site.name} />
      <meta property="og:title" content={site.name} />
      <meta property="og:description" content={site.description} />
      <meta property="og:type" content="website" />
    </Helmet>
    {type === "normal" && page === 1 && <section className="notebook-intro">
      <p>{t("notebook.hello")}</p>
      <p>{site.description} {t("notebook.intro")}</p>
      {config.getBoolean("rss") && <p>{t("notebook.subscribe_before")}<a className="notebook-link" href="/rss.xml">{t("notebook.subscribe_link")}</a>{t("notebook.subscribe_after")}</p>}
    </section>}
    <section aria-labelledby="notes-heading" aria-busy={status === "loading"}>
      <div className="notebook-section-heading">
        <h2 id="notes-heading">{type === "normal" ? t("notebook.recent") : t(type === "draft" ? "draft_bin" : "unlisted")}</h2>
      </div>
      {profile?.permission && type !== "normal" && <div className="notebook-manage">
        <Link className="notebook-link" href="/admin/writing">{t("writing")} ↗</Link>
        <Link className="notebook-link" href={type === "draft" ? "/" : "/?type=draft"}>{type === "draft" ? t("notebook.home") : t("draft_bin")}</Link>
        <Link className="notebook-link" href={type === "unlisted" ? "/" : "/?type=unlisted"}>{type === "unlisted" ? t("notebook.home") : t("unlisted")}</Link>
      </div>}
      {status === "loading" && <p role="status">{t("notebook.loading")}</p>}
      {status === "error" && <p role="alert">{t("notebook.load_error")}</p>}
      {status === "ready" && <>
        {feeds.data.map(feed => <FeedCard key={feed.id} {...feed} />)}
        {feeds.data.length === 0 && <div className="notebook-empty">
          <p>{t("notebook.empty_body")}</p>
          {profile?.permission && <Link className="notebook-link" href="/admin/writing">{t("notebook.first_note")} →</Link>}
          {import.meta.env.DEV && <p className="notebook-preview-label"><Link className="notebook-link" href="/?preview=1">{t("notebook.preview_open")}</Link></p>}
        </div>}
        {(page > 1 || feeds.hasNext) && <nav className="notebook-pagination" aria-label={t("notebook.pagination")}>
          {page > 1 ? <Link className="notebook-link" href={`/?type=${type}&page=${page - 1}`}>← {t("previous")}</Link> : <span />}
          {feeds.hasNext && <Link className="notebook-link" href={`/?type=${type}&page=${page + 1}`}>{t("next")} →</Link>}
        </nav>}
      </>}
    </section>
    {type === "normal" && <section className="notebook-topic-index">
      {config.getBoolean("rss") && <p><a className="notebook-link" href="/rss.xml">{t("notebook.subscribe_link")}</a></p>}
      <h2>{t("notebook.browse_tags")}</h2>
      <div className="notebook-tags">{["AI Native", "工程实践", "项目记录", "中文", "English"].map(name => <Link key={name} href={`/hashtag/${encodeURIComponent(name)}`}>#{name}</Link>)}</div>
    </section>}
  </main>;
}
