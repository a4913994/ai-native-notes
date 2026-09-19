import type { ReactNode } from "react";
import { useContext } from "react";
import type { DefaultParams, PathPattern } from "wouter";
import { Route, Switch } from "wouter";
import { AdminLayout } from "../components/admin-layout";
import { NotebookShell } from "../components/notebook-shell";
import { Tips, TipsPage } from "../components/tips";
import { CallbackPage } from "../page/callback";
import { NewsletterPage } from "../page/newsletter";
import { NewsPage } from '../page/news';
import { SocialsPage } from "../page/socials";
import { CompatTasksPage } from "../page/compat-tasks";
import { ErrorPage } from "../page/error";
import { FeedPage } from "../page/feed";
import { FeedsPage } from "../page/feeds";
import { FriendsPage } from "../page/friends";
import { HealthPage } from "../page/health";
import { HashtagPage } from "../page/hashtag";
import { HashtagsPage } from "../page/hashtags";
import { LoginPage } from "../page/login";
import { MomentsPage } from "../page/moments";
import { ProfilePage } from "../page/profile";
import { QueueStatusPage } from "../page/queue-status";
import { SearchPage } from "../page/search";
import { Settings } from "../page/settings";
import { BlogArchivePage } from "../page/blog-archive";
import { WritingPage } from "../page/writing";
import { ProfileContext } from "../state/profile";
import { tryInt } from "../utils/int";
import { useTranslation } from "react-i18next";

export function AppRoutes() {
  const { t } = useTranslation();

  return (
    <Switch>
      <AppRoute path="/">
        <FeedsPage />
      </AppRoute>

      <AppRoute path="/timeline">
        <BlogArchivePage />
      </AppRoute>

      <AppRoute path="/blog">
        <BlogArchivePage />
      </AppRoute>

      <AppRoute path="/newsletter">
        <NewsletterPage />
      </AppRoute>

      <AppRoute path="/news"><NewsPage /></AppRoute>
      <AppRoute path="/news/:date">{params => <NewsPage date={params.date} />}</AppRoute>

      <AppRoute path="/socials">
        <SocialsPage />
      </AppRoute>

      <AppRoute path="/moments">
        <MomentsPage />
      </AppRoute>

      <AppRoute path="/friends">
        <FriendsPage />
      </AppRoute>

      <AppRoute path="/hashtags">
        <HashtagsPage />
      </AppRoute>

      <AppRoute path="/hashtag/:name">
        {(params) => <HashtagPage name={params.name || ""} />}
      </AppRoute>

      <AppRoute path="/search/:keyword">
        {(params) => <SearchPage keyword={params.keyword || ""} />}
      </AppRoute>

      <AdminRoute path="/admin/settings" requirePermission title={t("settings.title")} description={t("admin.settings_description")}>
        <Settings />
      </AdminRoute>

      <AdminRoute path="/admin/health" requirePermission title={t("health.title")} description={t("admin.health_description")}>
        <HealthPage />
      </AdminRoute>

      <AdminRoute path="/admin/queue-status" requirePermission title={t("queue_status.title")} description={t("admin.queue_status_description")}>
        <QueueStatusPage />
      </AdminRoute>

      <AdminRoute path="/admin/compat-tasks" requirePermission title={t("compat_tasks.title")} description={t("admin.compat_tasks_description")}>
        <CompatTasksPage />
      </AdminRoute>

      <AdminRoute path="/admin/writing" requirePermission title={t("writing")} description={t("admin.writing_description")}>
        <WritingPage />
      </AdminRoute>

      <AdminRoute path="/admin/writing/:id" requirePermission title={t("writing")} description={t("admin.writing_description")}>
        {({ id }) => <WritingPage id={tryInt(0, id)} />}
      </AdminRoute>

      <AppRoute path="/callback">
        <CallbackPage />
      </AppRoute>

      <AppRoute path="/login">
        <LoginPage />
      </AppRoute>

      <AppRoute path="/profile">
        <ProfilePage />
      </AppRoute>

      <AppRoute path="/feed/:id">
        {(params) => <FeedPage id={params.id || ""} />}
      </AppRoute>

      <AppRoute path="/:alias">
        {(params) => <FeedPage id={params.alias || ""} />}
      </AppRoute>

      <AppRoute path="/user/github">
        <TipsPage>
          <Tips value={t("error.api_url")} type="error" />
        </TipsPage>
      </AppRoute>

      <AppRoute path="/*/user/github">
        <TipsPage>
          <Tips value={t("error.api_url_slash")} type="error" />
        </TipsPage>
      </AppRoute>

      <AppRoute path="/user/github/callback">
        <TipsPage>
          <Tips value={t("error.github_callback")} type="error" />
        </TipsPage>
      </AppRoute>

      <AppRoute>
        <ErrorPage error={t("error.not_found")} />
      </AppRoute>
    </Switch>
  );
}

function AppRoute({
  path,
  children,
  headerComponent,
  requirePermission,
}: {
  path?: PathPattern;
  children: ReactNode | ((params: DefaultParams) => ReactNode);
  headerComponent?: ReactNode;
  requirePermission?: boolean;
}) {
  const profile = useContext(ProfileContext);
  const { t } = useTranslation();

  const content =
    requirePermission && !profile?.permission ? <ErrorPage error={t("error.permission_denied")} /> : children;

  return (
    <Route path={path}>
      {(params) => {
        const resolvedContent = typeof content === "function" ? content(params) : content;
        return <NotebookShell tools={headerComponent}>{resolvedContent}</NotebookShell>;
      }}
    </Route>
  );
}

function AdminRoute({
  path,
  children,
  requirePermission,
  title,
  description,
}: {
  path: PathPattern;
  children: ReactNode | ((params: DefaultParams) => ReactNode);
  requirePermission?: boolean;
  title: string;
  description: string;
}) {
  const profile = useContext(ProfileContext);
  const { t } = useTranslation();
  const content =
    requirePermission && !profile?.permission ? <ErrorPage error={t("error.permission_denied")} /> : children;

  return (
    <Route path={path}>
      {(params) => (
        <AdminLayout title={title} description={description}>
          {typeof content === "function" ? content(params) : content}
        </AdminLayout>
      )}
    </Route>
  );
}
