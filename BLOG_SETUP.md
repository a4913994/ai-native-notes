# AI Native Notes 使用与维护

本项目固定起点为 Rin `308a542df6165bbf757fad111d7f8ab6296db771`，采用 Bun 1.3.13。
中英文文章共用列表；使用 `中文`、`English` 和主题标签组织内容。`AI Native` 是文章主题，不代表自动生成内容；AI 摘要保持关闭。

## 前台视觉

前台按 [cassidoo.co](https://cassidoo.co/) 实测尺寸重排：632px 正文栏、32px 常规标题、24px 副标题、200px 圆形头像、居中导航、三段简介、无分隔线文章列表及底部标签索引。字体使用同款 iA Writer Mono，通过固定版本 `@fontsource/ia-writer-mono@5.3.0` 本地打包，许可随站点附在 `public/fonts/iA-Writer-Mono-LICENSE.txt`。没有复制参考站照片或个人经历。插图为本项目的 SVG 占位图；后台可替换头像地址。复用现有 Tailwind 和 Rin 控件，搜索、语言及登录入口收在页脚。

公共页面外框在 `client/src/components/notebook-shell.tsx`，样式在同目录 `notebook.css`，首页在 `client/src/page/feeds.tsx`。文案通过四种现有语言的 `translation.json` 管理。首页使用后台的站名及简介；默认头像位置显示笔记插图，在后台设置其他头像地址后显示自定义图片。前台采用固定单栏样式，上游后台的页头布局、卡片样式、瀑布流选项不影响这个定制前台；文章编辑器和后台布局继续使用原版。

未发布文章时展示空状态，不放虚构文章。发布后首页自动显示标题、日期、摘要和标签；搜索、标签页复用同一文章列表样式。

开发模式下打开 `http://localhost:11498/?preview=1` 可看五篇明确标记的排版示例，点击标题可查看示例正文。它们不写入数据库、不进入 RSS，生产构建排除该预览模块；正式首页仍只显示实际发布的文章。

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
