// Loaded only by the local development preview. These examples never enter D1 or RSS.
import { useEffect } from "react";
import { Helmet } from "react-helmet";
import { useTranslation } from "react-i18next";
import { Link, useSearch } from "wouter";
import { useSiteConfig } from "../hooks/useSiteConfig";
import { FeedCard } from "./feed_card";
import { Markdown } from "./markdown";

const samples = [
  { title: "从一个小工具开始，理解 AI Native", summary: "让 AI 参与实际工作流程，从一个可以运行、可以验证的小工具开始。", tags: ["AI Native", "工程实践"], content: "## 从问题开始\n\n先选择一个明确的小问题：整理笔记、检查数据，或生成重复的代码。记录输入、期望输出，以及判断结果是否正确的方法。\n\n## 留下验证步骤\n\n```typescript\nconst note = { title: 'A small experiment', verified: false };\nconsole.log(note);\n```\n\n这是一篇用于查看中文正文、标题和代码排版的本地示例。" },
  { title: "Building a small, useful thing", summary: "Start with one problem, build the smallest working version, and write down what you learn.", tags: ["English", "项目记录"], content: "## Start small\n\nChoose one problem and describe what a useful result looks like. Build a version you can try, then keep a short record of what worked and what needs to change.\n\n> A working example is a useful starting point for the next question.\n\nThis is a local typography example, not a published project report." },
  { title: "写给未来自己的工程笔记", summary: "除了记录怎么做，也留下为什么这样做、遇到了什么问题，以及如何验证结果。", tags: ["中文", "工程实践"], content: "## 一份可以复现的记录\n\n- 背景：要解决什么问题\n- 做法：关键步骤与选择\n- 验证：如何知道它确实有效\n- 后续：还没有解决的部分\n\n这是一篇本地排版示例。" },
  { title: "Code, curiosity, and a little patience", summary: "A notebook for questions, experiments, and the details that are easy to forget.", tags: ["English", "AI Native"], content: "## Leave room for questions\n\nWrite down the question before starting the experiment. Afterwards, separate observations from assumptions.\n\nThis local example demonstrates English paragraphs and headings." },
  { title: "让项目留下可复现的记录", summary: "把环境、配置与验证方法写清楚，让下一次开始变得容易一点。", tags: ["项目记录", "中文"], content: "## 记录环境\n\n记录使用的版本、必要配置和启动命令。将密码与密钥保存在独立的环境文件中。\n\n## 记录结果\n\n区分已经验证的结果和仍待检查的部分。\n\n这是一篇本地排版示例，不代表实际项目经历。" },
];

export default function NotebookPreview() {
  const { t } = useTranslation();
  const site = useSiteConfig();
  const query = new URLSearchParams(useSearch());
  const sampleId = query.get("sample");
  const sample = sampleId === null ? undefined : samples[Number(sampleId)];
  useEffect(() => { window.scrollTo(0, 0); }, [sampleId]);
  return <main>
    <Helmet><title>{`${site.name} · ${t("notebook.preview_sample")}`}</title><meta name="robots" content="noindex" /></Helmet>
    {sample ? <>
      <p className="notebook-preview-label">{t("notebook.preview_label")}</p>
      <article className="notebook-article"><h1>{sample.title}</h1><Markdown content={sample.content} /></article>
      <Link className="notebook-link" href="/?preview=1">← {t("notebook.preview_back")}</Link>
    </> : <>
      <section className="notebook-intro">
        <p>{t("notebook.hello")}</p>
        <p>{site.description} {t("notebook.intro")}</p>
        <p>{t("notebook.subscribe_before")}<a className="notebook-link" href="/rss.xml">{t("notebook.subscribe_link")}</a>{t("notebook.subscribe_after")}</p>
      </section>
      <section aria-labelledby="preview-notes-heading">
        <div className="notebook-section-heading"><h2 id="preview-notes-heading">{t("notebook.recent")} <small>· {t("notebook.preview_sample")}</small></h2></div>
        {samples.map((post, index) => <FeedCard key={index} id={`preview-${index}`} href={`/?preview=1&sample=${index}`} title={post.title} summary={post.summary} hashtags={post.tags.map((name, id) => ({ id, name }))} createdAt={new Date(Date.UTC(2026, 8, 12 - index))} updatedAt={new Date(Date.UTC(2026, 8, 12 - index))} />)}
      </section>
      <section className="notebook-topic-index">
        <p><a className="notebook-link" href="/rss.xml">{t("notebook.subscribe_link")}</a></p>
        <h2>{t("notebook.browse_tags")}</h2>
        <div className="notebook-tags">{["AI Native", "工程实践", "项目记录", "中文", "English"].map(name => <Link key={name} href={`/hashtag/${encodeURIComponent(name)}`}>#{name}</Link>)}</div>
      </section>
    </>}
    <p className="notebook-preview-label">{t("notebook.preview_label")} · <Link className="notebook-link" href="/">{t("notebook.preview_exit")}</Link></p>
  </main>;
}
