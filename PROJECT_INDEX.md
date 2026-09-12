# AI Native Notes

Rin-based bilingual personal blog. Chinese and English posts share one real feed and use topic tags. A persistent toolbar keeps search, interface language, theme and account available. The global language preference changes interface text; there is no separate article-language filter or layout-preview mode.

Live site: https://ai-native-notes-a4913994.pages.dev · Login: https://ai-native-notes-a4913994.pages.dev/login. Deployed and checked from the current computer's network on 2026-09-12. Production contains the same five public articles and private About draft as the local snapshot; credentials are separate in ignored `.env.production.local`.

- [Local setup and operations](BLOG_SETUP.md)
- [Implementation and verification status](tracking/status.md)
- [Project identity and pinned upstream](project.yaml)
- [About draft](content/about.draft.md)
- [.env.blog.example](.env.blog.example): local defaults; real credentials live in ignored `.env.local`.
- [.env.production.example](.env.production.example): production template; real credentials live in ignored `.env.production.local`.

The public reading layout uses a compact identity masthead, separate sticky navigation, a 640px text column and a consistent article header. Five starter articles are published in the local database and can be edited or deleted normally. The administration workspace shares its notebook colors and common toolbar controls.

Public navigation follows home / newsletter / blog / github / socials, localized with the interface. Each page has its own introduction and structure: `/blog` groups the complete public archive by year with topic filters (`/timeline` remains compatible); newsletter explains the content, offers RSS subscriptions and links to real posts; socials separates the GitHub profile, blog source and ways to follow. Article details link back to the archive and subscription page.

Keep the upstream MIT license and source history. Blog customizations are intentionally small.

Article reading: comments removed; fixed, collapsible desktop TOC with current-section tracking and reading progress; inline collapsible TOC and bottom progress on smaller screens. Article prose/titles use locally hosted Noto Serif SC Variable under OFL; dates and code retain iA Writer Mono.
