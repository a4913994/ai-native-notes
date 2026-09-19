# Implementation status

## Horizon daily news — 2026-09-19

- Deployed independent `/news` and `/news/YYYY-MM-DD` pages and `/api/news` read/sync APIs. D1 migration 0013 adds a separate day/language-unique digest table. Production D1 was exported before deployment to ignored `backups/before-horizon-20260919.sql`; original five public articles remain independent.
- Enabled `Horizon Daily News` on GitHub main: Shanghai 07:37 generation, 09:17 check/retry, Chinese DeepSeek output, complete upstream source configuration and public LWN fallback. Secrets were installed in GitHub and Worker without committing credentials. Pinned Horizon commit is in the workflow and operations document.
- Actual cloud generation/publish/read-back succeeded in runs 35432728134 and 35433101653. Latest accepted generation selected 12 of 42 items; Reddit sub-source failures are exposed as a partial-source notice. Normal retry skips an existing day; artifact-only retry is available without AI calls.
- Frontend type checks/build and backend integration tests passed. Browser inspection confirmed desktop anchor navigation, expandable source references, direct dated route, and no horizontal overflow at 390px. Automated tests cover dedicated authorization, concurrent upserts, stale update protection, partial/all-source failures, empty days, AI/enrichment failures, old output rejection and HTML sanitization.
- Upstream whole-site and Rspress deployment workflows now require explicit enablement variables because this blog deploys via the existing local OAuth script; they previously attempted unconfigured upstream defaults. New daily news publishing is independent of those workflows.
- First scheduled execution remains a separate acceptance step; a one-time follow-up is arranged for 2026-09-20 after the morning retry window. See `docs/horizon-news-operations.md` for manual publishing, recovery and disabling updates.

## Custom domain and free email routing — 2026-09-12

- User purchased aifield.cc. Bound apex and www to the existing Pages project; both domains and TLS certificates are active. Production public origin is now https://aifield.cc, and new image URLs use its same-origin `/api/blob` endpoint.
- Published Worker version `f2bbb911-9ac4-4edf-827e-8bbb6ce6b7e8` and Pages deployment `e6ad60d8`. Scoped the generated RSS/sitemap cache to `cache/aifield.cc/` to avoid serving old-domain metadata. Existing articles were preserved.
- Added 308 document redirects from the legacy Pages hostname and www, preserving paths and queries. Legacy API/image access and hashed assets remain accessible; preview deployments do not redirect. All 472 tests pass (including three new gateway regression tests); workspace and blog-script type checks and the client production build pass. Live Chrome confirmed the article, www redirect and legacy alias redirect from the user's network.
- Backed up production D1 to ignored `backups/before-aifield-20260912.sql` before acceptance. New-domain API checks passed for login, secure session cookies, logout, draft/publish/edit, privacy after cache hits, anonymous edit denial, upload/public image access, pagination, all six original articles, RSS, sitemap and public routes. Temporary test article and image were removed.
- Enabled free Cloudflare Email Routing with MX/SPF/DKIM records and configured contact@aifield.cc to the owner's confirmed, verified destination. Dashboard shows routing enabled, one active rule and one verified destination; public DNS records resolve. Catch-all stays disabled. End-to-end delivery to the mailbox still needs a test email from another address.

## Homepage-only utility controls — 2026-09-12

- Search, interface language, theme and account are rendered only on the public homepage in a separate top-right row. Article, archive, subscription and other public pages retain navigation without empty utility columns. Admin controls remain available.
- Public mobile navigation now fits a single 44px row (about 57px including padding/border). Homepage utilities occupy their own row; non-home pages reclaim the previous second toolbar row.
- Local Chrome at 1440px and 390px confirms no overflow, homepage language menu visibility, Escape/focus return, and zero search/account/preference controls on article pages. Desktop article width remains 760px. All three type checks and the frontend production build pass.
- Also verified the 360px homepage search dialog and existing admin controls. Published Pages deployment `b8cda83a`; live primary-domain navigation confirms four homepage utility buttons at the top and zero utility controls on the article page, with no overflow.

## Large-screen reading refinement — 2026-09-12

- Measured the previous 1920px viewport: 640px body at 18px with an additional sidebar on the right, shifting the combined reading area away from the viewport center.
- Centered the complete reading frame, with body/TOC columns reserved together. Body width is 760px on 1200–1599px screens and 800px at 1600px+, with 20px/1.85 prose, fluid title hierarchy and aligned masthead/navigation/footer. Compact article identity and a left-aligned title divider reduce scattered whitespace. Homepage styling remains independent.
- Intermediate screens use up to 736px body / 19px text and an inline TOC; phones retain 18px text. Low-height desktops have a higher TOC position and a separately scrollable list.
- Browser measurements at 390, 768, 1024, 1200, 1440, 1920 and 2560px confirm no horizontal overflow; desktop body/TOC use the same centered frame. English and Chinese real article layouts inspected.
- Client/server/CLI type checks and production frontend build pass. Published Pages deployment `b1bc15b9`; live Chrome confirms 800px / 20px English prose at 1920px and 760px / 20px Chinese prose at 1440x600, with the fixed sidebar fully visible and no horizontal overflow. This CSS-only update leaves article data and backend unchanged.

## Reading experience update — 2026-09-12

- Removed article comment UI and its fetches; disabled the existing comment/guest-comment display settings in local and production config without deleting stored comments or changing upstream API routes.
- Replaced the TOC modal with a fixed desktop right sidebar (1200px+) and an inline mobile accordion. Both use semantic anchor links, current-section highlighting, duplicate-heading IDs and keyboard focus on the destination. Desktop contents can collapse while retaining progress; mobile Escape closes the accordion and restores its trigger focus.
- Reading percentage tracks the article bounds, excludes footer/adjacent posts, and updates after scrolling, viewport changes, images and font layout changes. Long TOCs scroll independently and keep the active chapter visible.
- Self-hosted Unicode-subset Noto Serif SC Variable 5.3.0 for article titles/prose, OFL license included; dates/code retain iA Writer Mono. Fixed the missing author-avatar fallback.
- 469 tests passed (including reading bounds, upward scrolling, long paragraphs, short/no-heading content and resized article regressions). Client/server/CLI type checks and production frontend build passed.
- Local Chrome verified 360/390/768px without horizontal overflow, actual font loading, mobile anchor focus and progress, no TOC dialog/comments; a private 48-heading local fixture verified duplicate anchors and a middle-article jump at 48% with fixed sidebar top 252px. Fixture deleted after testing.
- Published the frontend to Cloudflare Pages (deployment `104ec829`); production Chrome at 1440px confirms the fixed two-section TOC, downloaded Chinese font, no comment UI and no horizontal overflow. Existing six article bodies/visibility, pagination, RSS and sitemap still match the pre-deployment snapshot. Backend code and database schema were unchanged.

## Ready locally

- Homepage redesigned for reading: separate compact identity masthead and sticky 1040px desktop toolbar, 104px two-row mobile toolbar, 640px text column, small avatar, borderless posts and a minimal footer. Search, interface language, theme and account are at the top. System sans-serif for prose; locally bundled iA Writer Mono for brand, dates and code.
- The five former preview examples are now ordinary published local articles (IDs 2–6). Layout-preview mode and the article-language filter have been removed; the global interface language does not filter or translate posts.
- Homepage, feed rows, search/tag result rows and article reading styles unified; admin editor preserves its original functionality with the shared notebook style.

- Upstream pinned: `308a542df6165bbf757fad111d7f8ab6296db771`; personal fork created at `a4913994/ai-native-notes`.
- Bun 1.3.13 installed; frozen dependency installation completed.
- Blog available at `http://localhost:11498` while the local dev process is running.
- Site name, legacy bilingual description, N avatar and RSS initialized through existing configuration. Four locale-specific description defaults added in existing KV configuration, editable separately in settings.
- Starter language/topic tags and private About draft saved in local D1.
- Password-only configuration fixed; secrets kept out of generated Wrangler vars.
- Windows migration invocation and cache directory fixed; sitemap/robots/favicon development proxies added.
- Private/unlisted draft flags now survive editor reload, with per-article isolation.
- Narrow-screen header and article management controls adjusted; generic login label replaces misleading GitHub label.
- Pages gateway preserves origin, cookies and request bodies through BACKEND service binding. Production script uses a dedicated Pages config directory (Wrangler 4.71 does not support an arbitrary single Pages config path).

## Verified

### Navigation page redesign

- Read the reference site's newsletter, blog archive and socials pages. Public sections now have distinct localized mastheads and content structures. `/blog` replaces the compact timeline UI, with `/timeline` retained as a compatible route.
- Archive loads every page through the existing public list API, groups chronologically by year, and filters by topic through URL state. Counts and tag totals use the complete loaded archive; errors and non-progressing pagination stop with a retry action.
- Newsletter explains the three real content themes, provides RSS copying (with manual fallback), and loads three actual articles. Socials separates the confirmed GitHub account, source repository, subscriptions and friends. No invented email service, social accounts, reader counts or testimonials.
- Verified 1440px desktop archive/newsletter, 768px archive/detail, 390px socials and 360px English newsletter. No inspected horizontal overflow; subscription anchor clears the sticky toolbar; RSS copy succeeds; topic filters and global locale changes work. Article details link to archive and subscriptions.
- 464 tests and client/server/CLI type checks passed; frontend build and Worker dry-run passed. Archive tests cover 60 posts across pages/years, duplicate boundaries, tag counts, empty filters and API errors. Sitemap tests cover `/blog`, `/newsletter`, `/socials`; local sitemap cache refreshed. No article content changes or Cloudflare deployment in this step.

### Latest content change

- Exported local D1 before publication to ignored `backups/before-starter-posts-20260912-095035.sql`. Published five starter posts with topic tags, summaries, real aliases and editable Markdown; removed the layout-demo disclaimers from their bodies. The existing About draft remains private.
- Removed the development preview adapter and language filter UI. Legacy preview/language query parameters no longer change the article collection and are removed from pagination links. Startup and deployment do not import starter content.
- Anonymous API checks confirm five public posts, page-two results, exact saved content, RSS entries, sitemap aliases and HTTP 403 for the private About draft. Refreshed the old local sitemap cache after publication. Earlier preview/filter checks below describe superseded versions.
- Browser checks confirm five real detail links, no preview/language-filter UI, no overflow at 390px, real pagination (2/2/1 rows), interface-language changes preserving the current article set/page, and a populated admin editor for article 2. All 461 tests, client/server/CLI and blog-script type checks, frontend build and Worker dry-run passed.

- TypeScript checks for client, server, CLI and blog scripts passed.
- Full suite for the homepage redesign: 457 tests passed, 0 failures.
- Homepage browser checks: 360px, 390px, 768px and 1440px layouts without page-level horizontal overflow; the first preview article title is at about 348px on a 390 x 844 screen. UI language and article filters are independent; preference refresh, menu focus return and multi-page preview navigation checked.
- Frontend production build and Worker bundle dry-run passed.
- Real local API: password login; Chinese/English publication and editing; private draft access denied anonymously; anonymous editing denied; PNG upload and unauthenticated image read.
- Real Chrome: login, admin writing, Markdown preview, reload recovery of content and privacy flags, saving a private draft.
- Mobile viewport 390 x 844: article/code rendering and header menu inspected; no page-level horizontal overflow.
- Local Worker service-binding gateway at port 11500: home, API config/auth, article deep link, RSS and sitemap returned 200 with expected content types. This proves the gateway locally, not Cloudflare publication.
- Acceptance articles marked `[验收测试]` are cleaned after inspection; About remains private. A tiny PNG remains in the local development bucket only.

## Homepage redesign validation

- In-memory SQL regression fixtures cover more than one page of Chinese, English, untagged and dual-tag articles, counts, unknown tags, private/unlisted exclusion for anonymous and administrator homepages, cache isolation and invalidation after tag/visibility edits.
- URL and preference regression tests cover article tag mapping, invalid pagination, filter/page preservation, Chinese default and saved UI language, all retained homepage translations, theme restoration and live system theme changes.
- This redesign does not modify existing article content or deploy to Cloudflare. The real local homepage is still empty; preview samples are development-only.

## Admin style alignment

- Shared public/admin shell: sticky toolbar, locale/theme/account/search controls, lightweight administration navigation, paper background and restrained green actions. Settings/status content stays at 720px; writing uses the wider workspace.
- Added persistent form labels, matching Monaco/preview colors, responsive editor toolbar, opaque sticky settings-save prompt, and localized date calendar with Escape/focus return. Shared component style hooks remain scoped to the admin page.
- Verified 360px settings, 390px writing/calendar/preview, 768px status pages, and 1440px desktop writing. No page-level horizontal overflow in the inspected layouts. Settings draft was reset without saving; no article content was edited or published.
- Regression suite: 459 tests passed; client/server/CLI type checks and production frontend/Worker dry-run builds passed. Date calendar regression tests cover localization, Escape focus restoration, date/time preservation and clearing.

## Reading layout refinement

- Restored the reference site's visual hierarchy: identity above desktop navigation, normal-weight list titles, prominent green underlines, italic dates and small colored tag links. Mobile keeps the two-row toolbar and compact introduction.
- Live articles and development samples share title/date/tag markup. Article statistics moved below the body; authorized edit/pin/delete actions use the existing keyboard-accessible menu and confirmation handlers.
- Prose is 18px with 1.8 line height, with a short title divider, simple quotes and a single code-block background. An exact duplicate opening H1 is omitted only in the rendered reading view; stored article content remains intact.
- Browser checks: 360px real private article, 390px Chinese home and English detail, 768px home, 1440px home/detail and admin writing; inspected layouts have no page-level horizontal overflow. On 390x844, the first preview title starts around 340px. Light/dark themes and management-menu Escape/focus return verified.
- 461 tests passed, including duplicate-title preservation cases; client/server/CLI type checks and frontend/Worker dry-run builds passed. Scanned 260 production JS/HTML assets without finding preview text. Search dismissal restores trigger focus; desktop toolbar remains at top 0 after scrolling. Real About draft remains private (anonymous GET returns 403); public feed remains empty. No article publication, content edit or Cloudflare deployment.

## Bilingual public navigation

- Public navigation now uses home / newsletter / blog / github / socials in English and 首页／订阅／博客／GitHub／社交 in Simplified Chinese, with Traditional Chinese and Japanese translations retained. Desktop anchors and the mobile menu share destinations; GitHub uses an actual external navigation rather than an SPA route.
- Added localized `/newsletter` (current RSS subscription, with email delivery explicitly unavailable) and `/socials` (confirmed GitHub profile and friends link). Blog opens the existing archive, which now exposes the tags page.
- Checked English desktop at 1440px and 900px, and Chinese/English mobile navigation and pages at 360px. No inspected overflow or overlap; RSS returns HTTP 200. Existing 461 tests, all three type checks, frontend production build and Worker bundle dry-run pass.

## Cloud deployment completed — 2026-09-12

- Production: https://ai-native-notes-a4913994.pages.dev. The shorter default domain was unavailable; the unused first Pages project was removed after publishing the username-suffixed project.
- Dedicated Pages, Worker, D1, R2 and Queue created. Existing unrelated account resources were preserved. R2 activation and overage billing were explicitly approved by the user; no domain or paid AI service purchased.
- Wrangler OAuth authorized. Deployment token stays in Wrangler's credential store/process memory; production admin password and JWT are distinct from local credentials and uploaded as Worker Secrets. No S3 access keys are needed with the bound private R2 bucket and same-origin `/api/blob` gateway.
- Migrated the actual six-article local snapshot: five public listed articles plus the private About draft, preserving Markdown, summaries, aliases, dates, topic tags and visibility. AI summaries remain disabled.
- Production API acceptance passed: password login; secure HttpOnly cookie login through Pages; logout clears the session cookie and private access without it is denied; draft save, publish and edit; anonymous modification denied (403); private articles denied even after public cache hits and tag/visibility changes; image upload and anonymous read; actual page-two results. All six saved articles match the local snapshot.
- Homepage, archive, newsletter, socials, direct article URL, RSS, Atom, sitemap and robots return 200. RSS links point to production article IDs; sitemap contains production aliases and the distinct navigation pages. Private/test articles are absent.
- Current-network Chrome checks passed: desktop homepage; article navigation and direct alias reload; 390px article and English newsletter without horizontal overflow; language choice retained across navigation; login form and anonymous uploaded image load. Actual production login and content mutations were tested through the API; the browser login form was inspected without retaining a production session.
- Temporary acceptance articles and the PNG object were cleaned. Fresh Pages staging avoids carrying obsolete hashed assets into releases. Local development configuration was restored and the local server restarted.
- Backups (ignored): `backups/before-cloud-deploy-20260912.sql`, `backups/local-content-before-cloud.json`, `backups/production-before-live-acceptance-20260912.sql`, `backups/production-accepted-20260912.sql`. Production Wrangler config is saved beside them for operations.
- 464 tests pass; client/server/CLI and blog-script type checks pass; fresh frontend and actual Worker/Pages production builds succeed. Upstream large JavaScript bundle warning remains a future performance improvement.

## Operational notes

- Upstream Turbo 1.13 may warn that it cannot parse the Bun lockfile while constructing its task graph; all three TypeScript tasks still complete successfully. No dependency upgrade was made solely to hide that warning.
- Upstream migration tests used URL pathname as a Windows filesystem path; fixed with `fileURLToPath`.
- RSS unit tests previously contacted a fake S3 hostname and timed out; isolated them with a local R2 stub.
- Root `wrangler.toml` is generated and shared by local/server deployment commands. Stop local servers before production deployment; regenerate local config before resuming development.
- Production script, service binding gateway and resource creation are now verified against the live account. Future deployments must still back up production data and repeat public acceptance after relevant changes.
