import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'wouter';

export function ReadingBack({ fallback, label }: { fallback: string; label: string }) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  return <nav className="reading-breadcrumb" aria-label={t('reading.back')}>
    <button onClick={() => window.history.state?.rinDepth > 0 ? window.history.back() : navigate(fallback)}>← {t('reading.back')}</button>
    <Link href={fallback}>{label}</Link>
  </nav>;
}
