# AI Native Notes 使用与维护

本项目固定起点为 Rin `308a542df6165bbf757fad111d7f8ab6296db771`，采用 Bun 1.3.13。
中英文文章共用列表；使用 `中文`、`English` 和主题标签组织内容。`AI Native` 是文章主题，不代表自动生成内容；AI 摘要保持关闭。

## 前台视觉与语言

保留 [cassidoo.co](https://cassidoo.co/) 的留白和彩色链接，采用文章优先的布局：桌面常驻顶部栏最大宽度 1040px，正文 720px；手机是约 104px 的两行顶部栏。搜索、界面语言、主题和账户入口均在顶部，导航提供首页、归档、标签与友链。小头像配简洁介绍，页脚仅保留版权、源码、GitHub、RSS。

中文导航和正文使用系统无衬线字体，iA Writer Mono 仅用于站名、日期和代码。字体固定为 `@fontsource/ia-writer-mono@5.3.0`，本地打包并附许可。未复制参考站照片或个人经历。主题支持浅色、深色和跟随系统，保存于原有 `theme` 键；顶部栏和后台共用切换组件。

默认界面为简体中文，仅恢复用户保存的 `i18nextLng` 选择，保留 English、繁體中文、日本語。后台设置分别编辑 `site.description.zh-CN`、`site.description.en`、`site.description.zh-TW`、`site.description.ja`；缺省时使用已确认简介的对应译文。旧的 `site.description` 仍保留，不通过拆分斜杠推断译文。站名、技术名词、文章原文与用户标签不随界面语言翻译。

首页默认显示全部公开且已列出的文章。文章语言筛选独立于界面语言，URL 使用 `articleLang=all|zh|en`；中文与英文分别匹配原名为 `中文`、`English` 的标签。未标语言文章仅出现在全部，双标签文章同时进入两个筛选。切换筛选回第一页，分页、刷新和浏览器历史保留条件；界面语言切换不改变文章集合或页码。

现有 `GET /api/feed` 接受可选 `tag`，在 SQL 查询阶段过滤并计算总数、分页。缓存隔离标签、页码及管理员/公开响应，文章编辑沿用集合缓存失效机制。没有新增文章语言字段、数据库表或公共路由。

公共外框在 `client/src/components/notebook-shell.tsx`，共享首页在 `notebook-home.tsx`，样式在 `notebook.css`。定制前台固定单栏，上游页头布局、卡片样式、瀑布流选项不影响这个前台；编辑器保留原有功能并统一配色。

未发布文章时展示空状态。开发模式打开 `http://localhost:11498/?preview=1` 可看五篇明确标记、可点击的排版示例，与真实首页共用介绍、筛选和列表。用 `/?preview=1&articleLang=en&limit=1&page=2` 检查分页。示例不写入 D1、不进入 RSS，生产构建排除该模块和示例正文。

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
2. 执行 `./scripts/blog.ps1 scripts/blog-init.ts --production`，生成 `.env.production.local` 和独立随机管理员密码/JWT 密钥（已有文件不会覆盖）。在本地文件填写账户 ID、仅用于此账号的部署 API Token。Token 需要 Workers Scripts、Pages、D1、R2、Queues 的编辑权限及相应读取权限；不要提供全局 API Key。
3. 默认 Pages 名称 `ai-native-notes`。如全局重名，改为 `ai-native-notes-a4913994`，同时更新 `FRONTEND_URL` 和 `S3_ACCESS_HOST`。
4. `S3_ACCESS_HOST` 必须设置为实际 Pages 地址加 `/api/blob`。图片通过现有 Rin 图片接口公开读取；R2 桶保持私有，由 Worker 的 R2 绑定授权读写，因此此模式不需要另存 S3 Access Key，也不猜测 `r2.dev` 地址。以后可改为实际图片域名。
5. 停止本地开发进程再执行部署，避免共享的生成配置被本地热更新读取：

```powershell
./scripts/blog.ps1 scripts/blog-deploy.ts --preflight
./scripts/blog.ps1 scripts/blog-deploy.ts
./scripts/blog.ps1 scripts/blog-seed.ts .env.production.local
```

脚本检查配置和账号、创建缺失的专用资源、重新构建前端、调用 Rin 后端迁移与发布、同步 Worker Secrets、发布带服务绑定的 Pages、导出验收前数据库。部署失败会停止；可从错误处修复后重跑。生产部署后再次本地开发，先执行 `run dev:setup` 恢复本地配置。

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

## 备份、恢复与更新

本地备份（本地配置生效时）：

```powershell
./scripts/blog.ps1 x wrangler d1 export DB --local --output backups/local.sql
```

生产备份在生产配置与身份认证生效时使用 `d1 export ai-native-notes --remote --output backups/production.sql`。更新前和公开验收前都应导出；导出文件包含用户和私密文章，不提交仓库。R2 图片单独通过 S3 兼容客户端复制到私有备份位置；D1 导出不包含图片。

恢复时先创建新的空数据库，将备份用 `wrangler d1 execute <新数据库名> --remote --file <备份.sql>` 导入，在隔离 Worker 中绑定新库并核对文章/权限/图片，再切换生产。保留原数据库直到验证完成，不直接覆盖生产数据库。代码回退用上一版提交重新构建发布；数据库有迁移时需与备份兼容，不能仅回退代码。

上游更新：`git fetch upstream`，从当前个人版本新建 `codex/update-rin` 分支，合并选定上游提交，检查配置生成、Pages 网关和修复项冲突，完成上述验证后再推送与部署。更新 `project.yaml` 的上游提交记录。不要使用强制覆盖个人改动的同步方式。
