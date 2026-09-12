import { blogClient, checked } from "./blog-api";

const { request, env } = await blogClient(process.argv[2]);
await checked(await request("/api/config/client", "POST", {
  "site.name": env.NAME, "site.description": env.DESCRIPTION, "site.avatar": env.AVATAR,
  "site.page_size": 5, rss: true,
}));
await checked(await request("/api/config/server", "POST", { "ai_summary.enabled": false }));
const about = await request("/api/feed/about");
if (about.status === 404) {
  await checked(await request("/api/feed", "POST", {
    title: "关于本站 / About this blog", alias: "about",
    content: await Bun.file("content/about.draft.md").text(),
    draft: true, listed: false, tags: ["中文", "English", "AI Native", "工程实践", "项目记录"],
  }));
  console.log("Created private About draft and starter tags.");
} else {
  await checked(about);
  console.log("Kept existing About article.");
}
console.log("Site settings saved; RSS enabled; AI summaries disabled.");
