import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';

/** The live article and development preview use the same reading hierarchy. */
export function NotebookArticleHeader({ title, createdAt, updatedAt, tags, actions }: {
  title: string;
  createdAt: Date | string;
  updatedAt?: Date | string;
  tags: { name: string }[];
  actions?: ReactNode;
}) {
  const { t, i18n } = useTranslation();
  const published = new Date(createdAt);
  const updated = updatedAt ? new Date(updatedAt) : undefined;
  const format = (date: Date) => date.toLocaleDateString(i18n.resolvedLanguage || 'zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
  return <header className="notebook-article-header">
    <div className="notebook-article-title-row">
      <h1>{title || t('notebook.untitled')}</h1>
      {actions && <div className="notebook-article-actions">{actions}</div>}
    </div>
    <div className="notebook-article-dates">
      {!Number.isNaN(published.getTime()) && <time dateTime={published.toISOString()}>{format(published)}</time>}
      {updated && !Number.isNaN(updated.getTime()) && updated.getTime() !== published.getTime() && <span>{t('feed_card.updated$time', { time: format(updated) })}</span>}
    </div>
    {tags.length > 0 && <div className="notebook-tags">{tags.map(({ name }) => <Link key={name} href={`/hashtag/${encodeURIComponent(name)}`}>#{name}</Link>)}</div>}
  </header>;
}
