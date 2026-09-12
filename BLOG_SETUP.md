# AI Native Notes 使用与维护

本项目固定起点为 Rin `308a542df6165bbf757fad111d7f8ab6296db771`，采用 Bun 1.3.13。
中英文文章共用列表，通过主题标签组织内容。`AI Native` 是文章主题，不代表自动生成内容；AI 摘要保持关闭。

## 线上地址与登录

2026-09-12 已发布并从当前电脑网络验收：

- 博客：https://aifield.cc
- 登录：https://aifield.cc/login
- 管理设置：https://aifield.cc/admin/settings

`www.aifield.cc` 和原 Pages 默认域名的公开页面会保留路径、查询参数跳转到主域名；原域名的 API、图片和构建资源保持兼容。Pages 自定义域名需显示已激活，部署脚本才接受自有域名。生产环境使用 `FRONTEND_URL=https://aifield.cc`、`S3_ACCESS_HOST=https://aifield.cc/api/blob` 和 `S3_CACHE_FOLDER=cache/aifield.cc/`，避免沿用旧域名的 RSS/站点地图缓存。

免费域名邮箱为 `contact@aifield.cc`，通过 Cloudflare Email Routing 转发至站主确认且已验证的邮箱；具体目标在 Cloudflare 后台管理，不写入公共仓库。MX、SPF、DKIM 由 Cloudflare 管理，全收规则保持关闭。该配置用于收件转发，不提供独立邮箱登录或 SMTP 发信账号。更换邮件服务商时需协调替换 DNS 邮件记录，避免叠加冲突的 MX/SPF。实际投递验收应使用另一个邮箱发送测试邮件，并检查目标邮箱和路由活动日志。
- 用户名：`admin`；生产密码见本地 `.env.production.local` 中的 `ADMIN_PASSWORD`，与 `.env.local` 的开发密码不同。JWT 密钥不用于登录，不要公开此文件。
- 已迁移 5 篇公开文章及 1 篇私密“关于本站”草稿。后续线上与本地数据库各自独立，常规代码部署不复制或覆盖文章。
- Pages：`ai-native-notes-a4913994`；Worker：`ai-native-notes-server`；D1：`ai-native-notes`；R2：`ai-native-notes-images`；Queue：`ai-native-notes-tasks`。图片走博客同域 `/api/blob`。

R2 已经用户确认开通，超出免费额度会向已绑定付款方式计费。长期图片域名、自有域名和前端大包优化仍是后续事项。

## 前台视觉与语言

大屏响应式阅读进一步调整：文章页使用整体居中的正文与目录区域，而不是将目录附加到居中的窄正文之外。1200–1599px 屏幕正文宽 760px，1600px 以上为 800px，正文 20px/1.85；中等屏幕采用 19px 单栏，手机保留 18px。页头、导航、正文与页脚共享对齐线，目录维持固定和可收起；首页布局独立。文章页站名介绍更紧凑，标题和段落间距随屏幕调整。

2026-09-12 阅读页更新：移除评论列表和提交表单，本地/生产设置中的评论开关均关闭，已有评论数据保留。桌面宽度达到 1200px 时，右侧固定显示可收起的目录、当前章节和阅读进度；窄屏改为正文前的页内折叠目录及底部进度栏，无目录弹窗。目录支持重复标题、键盘链接、跳转后焦点及减少动态效果偏好；按正文范围计算进度，字体或图片改变高度后重新计算。

正文与文章标题采用自托管的 Noto Serif SC Variable（思源宋体系列），固定依赖 `@fontsource-variable/noto-serif-sc@5.3.0`，使用 Unicode 分片和 `font-display: swap`，无需访问 Google Fonts。导航保持系统无衬线字体，日期与代码保留 iA Writer Mono。字体许可随发布文件保留在 `/fonts/Noto-Serif-SC-LICENSE.txt`。

保留 [cassidoo.co](https://cassidoo.co/) 的留白和彩色链接：桌面将站名、简介与小头像放在独立页头，下方保留常驻导航，首页正文最大宽度 640px。搜索、界面语言、主题和账户仅在首页独立的右上角区域展示，其他公共页面只保留导航；手机导航缩为一行，首页另有一行工具区。英文导航为 home / newsletter / blog / github / socials，中文为首页／订阅／博客／GitHub／社交；两者使用相同链接。订阅页 `/newsletter` 提供 RSS，邮件订阅尚未开通；博客链接 `/blog`，`/timeline` 保留兼容；`/socials` 展示已确认的 GitHub 账号及友链入口。页脚仅保留版权、源码、GitHub、RSS。文章详情采用标题、日期、标签、分隔线与正文的顺序，正文在手机、平板、大屏分别使用 18px、19px、20px；管理操作收进菜单，阅读统计放在文末。与标题完全相同的开头一级标题仅在阅读时去重，不修改原始 Markdown。

中文导航和正文使用系统无衬线字体，iA Writer Mono 仅用于站名、日期和代码。字体固定为 `@fontsource/ia-writer-mono@5.3.0`，本地打包并附许可。未复制参考站照片或个人经历。主题支持浅色、深色和跟随系统，保存于原有 `theme` 键；顶部栏和后台共用切换组件。

默认界面为简体中文，仅恢复用户保存的 `i18nextLng` 选择，保留 English、繁體中文、日本語。后台设置分别编辑 `site.description.zh-CN`、`site.description.en`、`site.description.zh-TW`、`site.description.ja`；缺省时使用已确认简介的对应译文。旧的 `site.description` 仍保留，不通过拆分斜杠推断译文。站名、技术名词、文章原文与用户标签不随界面语言翻译。

首页显示全部公开且已列出的文章，只有顶部全局界面语言切换，不再提供文章语言筛选。界面语言切换不改变文章集合、页码或原文。旧的 `articleLang`、`preview`、`sample` 参数被忽略，分页链接会清除这些参数。

现有 `GET /api/feed` 接受可选 `tag`，在 SQL 查询阶段过滤并计算总数、分页。缓存隔离标签、页码及管理员/公开响应，文章编辑沿用集合缓存失效机制。没有新增文章语言字段、数据库表或数据接口。

各导航页面采用不同的内容结构与本地化页头：`/blog` 是完整文章归档，保留 `/timeline` 兼容入口，按年份分组并提供主题筛选；归档通过现有公开文章接口逐页读取后分组，筛选写入 `?tag=`，不会只过滤第一页。`/newsletter` 说明内容方向，提供可复制的 RSS 地址与三篇真实文章入口，邮件订阅仍未开通。`/socials` 分别展示个人 GitHub、本站源码与订阅／友链入口。GitHub 导航继续直达个人主页。文章详情提供返回归档和订阅链接。页面样式在 `notebook-pages.css`；这些新增前端路径也进入站点地图。

公共外框在 `client/src/components/notebook-shell.tsx`，共享首页在 `notebook-home.tsx`，样式在 `notebook.css`。定制前台固定单栏，上游页头布局、卡片样式、瀑布流选项不影响这个前台；编辑器保留原有功能并统一配色。

原先五篇排版示例已改为本地数据库中的公开文章，参与首页、归档、RSS 和站点地图，可从详情页的“管理文章”菜单编辑或删除。源码内容保存在 `content/starter-posts.json`，仅在显式执行 `./scripts/blog.ps1 scripts/blog-publish-starter.ts` 时导入；启动、刷新、构建和部署都不会重新创建已删除的文章。该导入命令仅允许本地环境，遇到已有同名别名会保留原文。未发布文章时展示空状态，不再提供本地排版预览。

## 后台样式

后台沿用首页的常驻顶部栏、纸张底色、系统无衬线字体和彩色链接，顶部导航提供写作、设置、健康检查、队列状态和兼容任务。搜索、界面语言、主题和账户入口与前台共用，手机仍使用两行布局。

设置与状态页正文最大宽度 720px，写作工作区适当加宽以容纳编辑与对比预览。设置按细分隔线组织，保存提示保留独立背景；写作字段带持续可见的标签，Markdown 编辑器与预览使用相同明暗配色。日期弹层跟随界面语言，手机居中显示，支持 Escape 关闭与焦点返回。

样式主要位于 client/src/components/notebook-admin.css，管理外框复用 NotebookShell。共享 UI 组件仅增加样式类名与可选日期语言参数，管理权限、发布、上传、设置保存和后台任务逻辑沿用现有实现。

本次只调整界面，未改动已有文章或保存生产配置，也未执行 Cloudflare 部署。

## 本地启动

在项目根目录用 PowerShell 执行：

```powershell
./scripts/blog.ps1 install --frozen-lockfile
./scripts/blog.ps1 scripts/blog-init.ts
./scripts/blog.ps1 run dev:setup
./scripts/blog.ps1 run build
./scripts/blog.ps1 run dev
```

打开 http://localhost:11498 。另开终端初始化后台设置与私密“关于本站”草稿：

```powershell
./scripts/blog.ps1 scripts/blog-seed.ts
```

用户名在 `.env.local` 的 `ADMIN_USERNAME`，密码在 `ADMIN_PASSWORD`。初始化器随机生成密码与 JWT 密钥，重复执行不会覆盖已有配置。不要把 `.env.local`、`.dev.vars`、数据库、备份或日志上传到 GitHub。

启动器先查找这次安装的 `%LOCALAPPDATA%\rin-tools\bun-1.3.13\bun-windows-x64\bun.exe`，其他电脑则使用 PATH 中的 Bun 1.3.13。本地入口端口 11498，内部 Worker 端口 11499；数据位于本项目 `.wrangler/state`，R2 在本地模拟，不访问生产数据。首次数据库迁移会耗时约一两分钟。首次构建用于准备 Worker 静态资源目录。

登录后点击头像 → 后台管理，可写作、调整站名/简介/头像和 RSS。关于本站目前仅管理员可读；在草稿箱审核后取消“仅自己可见”即可公开，别名 `about`。保留“列出在文章中”关闭，可让关于页不进入文章列表。不要把测试文章当成正式内容。

## Cloudflare 部署

本次新增 Pages 网关，使页面、登录、API、图片、RSS 和站点地图共用一个访问域名。Pages 通过 `BACKEND` 服务绑定调用 Rin Worker，Worker 使用 D1 与 R2。沿用上游任务队列；AI 功能不开启。

1. 登录 Cloudflare，在账号中启用所需的 Workers、Pages、D1、R2、Queues 产品。如果账号要求付款资料或接受新条款，由账号持有人自行完成；本项目不会购买域名或付费 AI。
2. 执行 `./scripts/blog.ps1 scripts/blog-init.ts --production`，生成 `.env.production.local` 和独立随机管理员密码/JWT 密钥（已有文件不会覆盖）。填写账户 ID。本次使用 Wrangler OAuth 登录，`CLOUDFLARE_API_TOKEN` 保持空白；也可使用仅限此账号的部署 API Token（Workers Scripts、Pages、D1、R2、Queues 编辑及相应读取权限）。
3. 默认 Pages 名称 `ai-native-notes`。如全局重名，改为 `ai-native-notes-a4913994`，同时更新 `FRONTEND_URL` 和 `S3_ACCESS_HOST`。
4. `S3_ACCESS_HOST` 必须设置为实际 Pages 地址加 `/api/blob`。图片通过现有 Rin 图片接口公开读取；R2 桶保持私有，由 Worker 的 R2 绑定授权读写，因此此模式不需要另存 S3 Access Key，也不猜测 `r2.dev` 地址。以后可改为实际图片域名。
5. 停止本地开发进程再执行部署，避免共享的生成配置被本地热更新读取：

```powershell
./scripts/blog.ps1 x wrangler login
./scripts/blog.ps1 scripts/blog-deploy-oauth.ts --preflight
./scripts/blog.ps1 scripts/blog-deploy-oauth.ts
```

OAuth 包装器从已固定版本 Wrangler 的标准凭证目录读取短期 token，仅放在进程内存，过期需重新登录。使用自备 API Token 时直接运行 `scripts/blog-deploy.ts`。脚本核对 Pages 实际分配的域名，避免全局重名时把 RSS 和图片指向别人的地址；每次在新的 `dist/pages-<时间戳>` 目录准备前台，避免旧构建文件残留。

脚本检查配置和账号、创建缺失的专用资源、重新构建前端、调用 Rin 后端迁移与发布、同步 Worker Secrets、发布带服务绑定的 Pages、导出验收前数据库。修改生产数据库前另做备份。部署失败会停止；可从错误处修复后重跑。生产部署后再次本地开发，先执行 `run dev:setup` 恢复本地配置。

首次文章迁移已完成，不要在日常部署后执行种子脚本。显式导入命令为 `scripts/blog-import-snapshot.ts <已审核的文章与配置快照.json> .env.production.local`：保留已有同内容别名，遇到内容冲突即停止，不导入开发用户、密码或 JWT。本次快照为忽略文件 `backups/local-content-before-cloud.json`。

首次采用上述手动部署脚本。上游 GitHub Actions 的 Deploy 不包含本项目新增的 Pages 网关，不应作为本博客的上线入口。尚未配置云端凭证时，不启用其自动部署。

## 验证与发布

```powershell
./scripts/blog.ps1 run check
./scripts/blog.ps1 x tsc --project tsconfig.blog.json
./scripts/blog.ps1 run test
./scripts/blog.ps1 run build
./scripts/blog.ps1 scripts/blog-smoke.ts
```

最后一项只允许本地运行，创建明确标记的测试文章并清理，验证登录、中英发布/编辑、私密保护、匿名拒写、图片上传与匿名读取，以及首页/直达页/RSS/sitemap/robots。上传的微型测试图片留在本地测试桶，不进入生产。`--keep` 仅供浏览器检查时保留测试文章，需随后手动清理。

生产验收需从实际网络访问 Pages 地址，实测密码登录、草稿、文章编辑、中英文代码块、图片、退出后拒绝管理操作、手机导航、刷新和 RSS。检查私密草稿不进入公开列表和订阅。默认域名在实际网络不可访问时，部署仍视为未完成。上线结果以 `tracking/status.md` 为准。

可在备份后显式运行 `scripts/blog-accept-production.ts <生产数据库备份.sql>`。它创建并清理标记为“验收测试”的文章，验证公开/私密切换与缓存隔离；测试图片地址记录在忽略的 `artifacts/production-acceptance.json`，浏览器检查后用 Wrangler 删除该确切对象。本次生产测试文章和图片均已清理。

## 备份、恢复与更新

本地备份（本地配置生效时）：

```powershell
./scripts/blog.ps1 x wrangler d1 export DB --local --output backups/local.sql
```

生产备份在生产配置与身份认证生效时使用 `d1 export ai-native-notes --remote --output backups/production.sql`。更新前和公开验收前都应导出；导出文件包含用户和私密文章，不提交仓库。R2 图片单独通过 S3 兼容客户端复制到私有备份位置；D1 导出不包含图片。

恢复时先创建新的空数据库，将备份用 `wrangler d1 execute <新数据库名> --remote --file <备份.sql>` 导入，在隔离 Worker 中绑定新库并核对文章/权限/图片，再切换生产。保留原数据库直到验证完成，不直接覆盖生产数据库。代码回退用上一版提交重新构建发布；数据库有迁移时需与备份兼容，不能仅回退代码。

上游更新：`git fetch upstream`，从当前个人版本新建 `codex/update-rin` 分支，合并选定上游提交，检查配置生成、Pages 网关和修复项冲突，完成上述验证后再推送与部署。更新 `project.yaml` 的上游提交记录。不要使用强制覆盖个人改动的同步方式。
