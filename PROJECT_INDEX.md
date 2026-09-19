# AI Native Notes

Rin-based bilingual personal blog. Chinese and English posts share one real feed and use topic tags. Search, interface language, theme and account appear in a separate top-right homepage utility row; other public pages retain navigation only. Admin pages retain their operational controls. The global language preference changes interface text; there is no separate article-language filter or layout-preview mode.

Live site: https://aifield.cc · Login: https://aifield.cc/login. The legacy Pages domain and www redirect public pages to the main domain. Deployed and checked from the current computer's network on 2026-09-12. Production contains the same five public articles and private About draft as the local snapshot; credentials are separate in ignored `.env.production.local`. Contact address: contact@aifield.cc, using free Cloudflare Email Routing to the owner's verified mailbox.

- [Local setup and operations](BLOG_SETUP.md)
- [Implementation and verification status](tracking/status.md)
- [Daily Horizon news operations](docs/horizon-news-operations.md): independent `/news` section, GitHub schedule and publication retry.
- [Project identity and pinned upstream](project.yaml)
- [About draft](content/about.draft.md)
- [.env.blog.example](.env.blog.example): local defaults; real credentials live in ignored `.env.local`.
- [.env.production.example](.env.production.example): production template; real credentials live in ignored `.env.production.local`.

The public reading layout uses a compact identity masthead, separate sticky navigation, a 640px text column and a consistent article header. Five starter articles are published in the local database and can be edited or deleted normally. The administration workspace shares its notebook colors and common toolbar controls.

Public navigation follows home / newsletter / blog / news / github / socials, localized with the interface. Each page has its own introduction and structure: `/blog` groups the complete public archive by year with topic filters (`/timeline` remains compatible); newsletter explains the content, offers RSS subscriptions and links to real posts; socials separates the GitHub profile, blog source and ways to follow. Article details link back to the archive and subscription page.

Keep the upstream MIT license and source history. Blog customizations are intentionally small.

Article reading: comments removed; fixed, collapsible desktop TOC with current-section tracking and reading progress; inline collapsible TOC and bottom progress on smaller screens. Article prose/titles use locally hosted Noto Serif SC Variable under OFL; dates and code retain iA Writer Mono.

Large-screen reading uses a centered 1120–1160px overall frame with a 760–800px text column, 240px reserved TOC and 20px prose. Medium screens use 19px single-column prose; phones retain 18px. Article masthead/navigation/footer align with the reading frame without changing homepage layout.
