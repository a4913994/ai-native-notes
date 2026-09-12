import { useContext, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { Link, useSearch } from "wouter";
import { client } from "../app/runtime";
import { FeedCard, type FeedCardProps } from "../components/feed_card";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { ProfileContext } from "../state/profile";
import { tryInt } from "../utils/int";

type FeedType = "normal" | "draft" | "unlisted";
type FeedList = { size: number; data: FeedCardProps[]; hasNext: boolean };
const emptyList: FeedList = { size: 0, data: [], hasNext: false };

export function FeedsPage() {
  const { t } = useTranslation();
  const site = useSiteConfig();
  const profile = useContext(ProfileContext);
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
      <h1>{t("notebook.hello")} <span aria-hidden="true">✳</span></h1>
      <p>{site.description.split(" / ")[0]}</p>
      {site.description.includes(" / ") && <p className="notebook-english" lang="en">{site.description.split(" / ").slice(1).join(" / ")}</p>}
      <p>{t("notebook.intro")}</p>
      <div className="notebook-tags" aria-label={t("notebook.topics")}>
        {["AI Native", "工程实践", "项目记录", "中文", "English"].map(name => <Link key={name} href={`/hashtag/${encodeURIComponent(name)}`}>#{name}</Link>)}
      </div>
    </section>}
    <section aria-labelledby="notes-heading" aria-busy={status === "loading"}>
      <div className="notebook-section-heading">
        <h2 id="notes-heading">{type === "normal" ? t("notebook.recent") : t(type === "draft" ? "draft_bin" : "unlisted")}</h2>
        <span>{t("notebook.small_steps")}</span>
      </div>
      {profile?.permission && <div className="notebook-manage">
        <Link className="notebook-link" href="/admin/writing">{t("writing")} ↗</Link>
        <Link className="notebook-link" href={type === "draft" ? "/" : "/?type=draft"}>{type === "draft" ? t("notebook.home") : t("draft_bin")}</Link>
        <Link className="notebook-link" href={type === "unlisted" ? "/" : "/?type=unlisted"}>{type === "unlisted" ? t("notebook.home") : t("unlisted")}</Link>
      </div>}
      {status === "loading" && <p role="status">{t("notebook.loading")}</p>}
      {status === "error" && <p role="alert">{t("notebook.load_error")}</p>}
      {status === "ready" && <>
        {feeds.data.map(feed => <FeedCard key={feed.id} {...feed} />)}
        {feeds.data.length === 0 && <div className="notebook-empty">
          <div className="notebook-empty-symbol" aria-hidden="true">[ … ]</div>
          <h3>{t("notebook.empty_title")}</h3>
          <p>{t("notebook.empty_body")}</p>
          {profile?.permission && <Link className="notebook-link" href="/admin/writing">{t("notebook.first_note")} →</Link>}
        </div>}
        {(page > 1 || feeds.hasNext) && <nav className="notebook-pagination" aria-label={t("notebook.pagination")}>
          {page > 1 ? <Link className="notebook-link" href={`/?type=${type}&page=${page - 1}`}>← {t("previous")}</Link> : <span />}
          {feeds.hasNext && <Link className="notebook-link" href={`/?type=${type}&page=${page + 1}`}>{t("next")} →</Link>}
        </nav>}
      </>}
    </section>
  </main>;
}
