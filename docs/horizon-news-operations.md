# 每日资讯运维

## 数据流

`Horizon Daily News` 在博客仓库运行固定版本 `Thysrael/Horizon@0d7b8f0656974271ce3129026513cfe546c66058`，采集过去 24 小时 → DeepSeek 中文分析 → JSON artifact → Worker `/api/news/:date` → D1 `news_digests` → `/news`。

北京时间 07:37 开始，09:17 补查；GitHub 调度可能延迟。相同日期已发布则跳过。日期取采集结束时间的北京时间，不取 runner 的 UTC 日期。界面显示真实更新时间；个人文章和原有 RSS 不包含资讯。

## 配置

GitHub Secrets：`HORIZON_DEEPSEEK_API_KEY`、`HORIZON_BASE_URL`、`NEWS_SYNC_TOKEN`，可选 `HORIZON_LWN_KEY`。GitHub Variable：`HORIZON_MODEL=deepseek-flash`。模型服务地址与密钥沿用本地 Horizon 的 DeepSeek 服务；本地 `.env` 不提交。GitHub 临时 token 仅供读取公开项目来源。

Worker Secret：`NEWS_SYNC_TOKEN`，与 GitHub 同名 secret 相同，仅允许资讯同步接口。轮换时同时更新两端。常规 Worker 部署保留已有 secret；更换 Worker 时必须重新配置。数据库迁移 `0013` 创建独立表，按日期和语言唯一，不修改既有文章。

沿用固定版本的 `data/config.github.json` 来源和分类，生成仅中文，关闭上游邮件和飞书。没有 LWN 密钥时使用公开 RSS。个别来源受限会显示缺失来源；全部失败或全部 AI 分析失败不会发布。全部来源成功但没有新资讯时发布明确的空日报。

## 手动运行与补传

展示规则：收录采集时间范围内的全部可用候选，不再按 Profile 阈值和主题平衡删除低分条目。按 AI 重要性评分降序排列，前 20 条生成详细内容并直接展开；其余条目放在默认折叠的标题列表中，标题链接原文。不足 20 条时全部展开。部分评分失败的条目保留标题并排在末尾，重点条目背景补充失败时保留初步摘要。来源范围、语言过滤和失败提示仍有效；并不意味着抓取各平台的全部内容。历史日报未保存被丢弃的候选，不能凭旧 Markdown 补回；新规则需要重新采集生成。

附加来源配置在 `scripts/horizon-extra-sources.json`：OpenBB 使用 `yfinance`，默认关注 NVDA、MSFT、GOOGL、AMZN、META、AAPL、AMD、TSM，归入财经；无需额外密钥，不启用 SEC 报告。工作流使用 `uv sync --frozen --extra openbb` 安装上游锁定的 OpenBB 4.7.1 及提供商依赖。附加来源排除含中文汉字的标题／正文，保留原文链接，由 DeepSeek 生成中文摘要。

OSS Insight 查询过去 24 小时全语言开源趋势，最多取 15 个项目，归入科技。这里的语言指编程语言。趋势时间表示观察窗口，不表示仓库创建日期。2026-09-19 实测接口 `data_quality.status=unavailable`，上游事件覆盖不足，无法计算可信排名；日报展示缺失提示，接口恢复有效数据后自动纳入。HTTP 失败和空排名不会伪装成正常无资讯。现有 GitHub 来源继续工作。

Twitter 使用 Apify `altimis~scweet`，需要 GitHub Secret `APIFY_TOKEN`。采集配置在 `scripts/horizon-twitter.json`，当前一次合并英文搜索覆盖 AI、开源模型、独立开发、科技和 AI 论文；查询使用 `lang:en`，每日正常运行一次 Apify Actor、最多请求 100 条，最终收录过去 24 小时的内容并按重要性排序，中文摘要发布到日报。它不是个人首页的“为你推荐”。不需要 X Cookie。Apify 用量计入账号额度；关闭 JSON 中的 `enabled` 即可单独停用 Twitter。上游异常可能在 URL 中携带 token，适配器在日志生成时脱敏，并把 Twitter 失败计入公开来源缺失提示。

在仓库 Actions → **Horizon Daily News** → **Run workflow**：

- 默认：当天不存在时生成并发布。
- `force=true`：重新生成当天日报，会产生模型调用。
- `artifact_run_id`：填写已生成 `horizon-news` artifact 的历史工作流 run ID，只补传，不重新采集或调用模型。Artifact 保留 30 天，权限限当前仓库；重新传同一产物幂等，更旧产物不能覆盖更新版本。

独立调用：`python scripts/horizon-news.py publish --output <digest.json>`，需通过环境变量提供 `NEWS_SYNC_TOKEN`。默认目标是 `https://aifield.cc`。生成命令拒绝已存在的输出路径，从临时目录构建内容，不读取上游仓库内的历史日报。

失败检查 Actions 的步骤和日志。错误日志不作为公开资讯正文；发布后自动匿名读取并核对内容。禁用工作流即可停止更新，历史内容保留。公开仓库无活动 60 天可能被 GitHub 停用 schedule，需检查工作流状态并重新启用。

原上游整站 artifact 自动部署需要 `CLOUDFLARE_AUTO_DEPLOY=true` 才随 Build 启动；Rspress 文档站需要 `RSPRESS_PAGES_ENABLED=true`。本站当前用本地已授权的 `scripts/blog-deploy-oauth.ts` 部署 Cloudflare，未给旧整站 Action 配置 Cloudflare 令牌，避免向上游默认的 `rin` 资源发起部署。每日资讯 Action 独立运行，不受这两个开关影响。

## 验证与回退

2026-09-19 附加来源验收：Actions `35434456938` 成功，云端日志确认 OpenBB 获取 60 条新闻；本期合计 102 条候选，筛选发布 10 条。匿名 API 已读取到本期更新及 OSS Insight 不可用提示。此记录为切换全部收录规则之前的历史验收。489 项 Bun 测试通过。

2026-09-19 接入验证：Token 可用，真实 Actions 运行 `35433995837` 发布成功；随后核实 Scweet 日志提示 `Daily run limit reached`，虽然 Actor 状态为 `SUCCEEDED`，数据集却为空。已将五组主题合并成一次查询，并给空数据增加来源不可用提示。本日 Twitter 内容未通过端到端验收，需在额度恢复后检查真实结果；不要仅凭 Actor 成功状态认定采集成功。

变更后运行 `bun test`、`bun run check`、`bun run build:client`；Python adapter 的离线失败场景由 `bun:test` 调用标准 Python，不引入额外测试框架。

生产部署前导出 D1。数据库表为增量新增，回退客户端/Worker 时无需删除日报。首次上线须检查真实 Action、匿名 API 和桌面/手机页面；手动运行成功不等于定时触发已验证。
