# 每日资讯运维

## 数据流

`Horizon Daily News` 在博客仓库运行固定版本 `Thysrael/Horizon@0d7b8f0656974271ce3129026513cfe546c66058`，采集过去 24 小时 → DeepSeek 中文分析 → JSON artifact → Worker `/api/news/:date` → D1 `news_digests` → `/news`。

北京时间 07:37 开始，09:17 补查；GitHub 调度可能延迟。相同日期已发布则跳过。日期取采集结束时间的北京时间，不取 runner 的 UTC 日期。界面显示真实更新时间；个人文章和原有 RSS 不包含资讯。

## 配置

GitHub Secrets：`HORIZON_DEEPSEEK_API_KEY`、`HORIZON_BASE_URL`、`NEWS_SYNC_TOKEN`，可选 `HORIZON_LWN_KEY`。GitHub Variable：`HORIZON_MODEL=deepseek-flash`。模型服务地址与密钥沿用本地 Horizon 的 DeepSeek 服务；本地 `.env` 不提交。GitHub 临时 token 仅供读取公开项目来源。

Worker Secret：`NEWS_SYNC_TOKEN`，与 GitHub 同名 secret 相同，仅允许资讯同步接口。轮换时同时更新两端。常规 Worker 部署保留已有 secret；更换 Worker 时必须重新配置。数据库迁移 `0013` 创建独立表，按日期和语言唯一，不修改既有文章。

沿用固定版本的 `data/config.github.json` 来源、筛选阈值和分类，生成仅中文，关闭上游邮件和飞书。没有 LWN 密钥时使用公开 RSS。个别来源受限会显示缺失来源；全部失败或全部 AI 分析失败不会发布。全部来源成功但没有合格资讯时发布明确的空日报。

## 手动运行与补传

在仓库 Actions → **Horizon Daily News** → **Run workflow**：

- 默认：当天不存在时生成并发布。
- `force=true`：重新生成当天日报，会产生模型调用。
- `artifact_run_id`：填写已生成 `horizon-news` artifact 的历史工作流 run ID，只补传，不重新采集或调用模型。Artifact 保留 30 天，权限限当前仓库；重新传同一产物幂等，更旧产物不能覆盖更新版本。

独立调用：`python scripts/horizon-news.py publish --output <digest.json>`，需通过环境变量提供 `NEWS_SYNC_TOKEN`。默认目标是 `https://aifield.cc`。生成命令拒绝已存在的输出路径，从临时目录构建内容，不读取上游仓库内的历史日报。

失败检查 Actions 的步骤和日志。错误日志不作为公开资讯正文；发布后自动匿名读取并核对内容。禁用工作流即可停止更新，历史内容保留。公开仓库无活动 60 天可能被 GitHub 停用 schedule，需检查工作流状态并重新启用。

原上游整站 artifact 自动部署需要 `CLOUDFLARE_AUTO_DEPLOY=true` 才随 Build 启动；Rspress 文档站需要 `RSPRESS_PAGES_ENABLED=true`。本站当前用本地已授权的 `scripts/blog-deploy-oauth.ts` 部署 Cloudflare，未给旧整站 Action 配置 Cloudflare 令牌，避免向上游默认的 `rin` 资源发起部署。每日资讯 Action 独立运行，不受这两个开关影响。

## 验证与回退

变更后运行 `bun test`、`bun run check`、`bun run build:client`；Python adapter 的离线失败场景由 `bun:test` 调用标准 Python，不引入额外测试框架。

生产部署前导出 D1。数据库表为增量新增，回退客户端/Worker 时无需删除日报。首次上线须检查真实 Action、匿名 API 和桌面/手机页面；手动运行成功不等于定时触发已验证。
