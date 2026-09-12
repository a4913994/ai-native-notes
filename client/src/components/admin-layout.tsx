import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "wouter";
import { NotebookShell } from "./notebook-shell";
import "./notebook-admin.css";

export function AdminLayout({ title, description, children }: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const navigation: [string, string][] = [
    ["/admin/writing", t("writing")],
    ["/admin/settings", t("settings.title")],
    ["/admin/health", t("health.title")],
    ["/admin/queue-status", t("queue_status.title")],
    ["/admin/compat-tasks", t("compat_tasks.title")],
  ];
  return (
    <NotebookShell admin navigation={navigation}>
      <main className={`admin-workspace${location.startsWith('/admin/writing') ? ' admin-workspace-writing' : ''}`}>
        <header className="admin-page-heading">
          <div className="admin-page-breadcrumb">
            <span>{t("admin.title")}</span>
            <Link href="/" className="notebook-link">{t("admin.back_to_site")} <span aria-hidden="true">↗</span></Link>
          </div>
          <h1>{title}</h1>
          <p>{description}</p>
        </header>
        <div className="admin-page-content">{children}</div>
      </main>
    </NotebookShell>
  );
}
