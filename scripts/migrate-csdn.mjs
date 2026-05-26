/**
 * 从 CSDN 博客 (jingling555) 迁移文章到 content/posts/
 * 用法: node scripts/migrate-csdn.mjs [--limit=20] [--skip-existing]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "content", "posts");

const USERNAME = "jingling555";
const PAGE_SIZE = 40;
const DELAY_MS = 800;

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: `https://blog.csdn.net/${USERNAME}`,
};

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});
turndown.addRule("removeScripts", {
  filter: ["script", "style", "iframe"],
  replacement: () => "",
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(articleId) {
  return String(articleId);
}

function escapeYaml(str) {
  if (!str) return '""';
  const s = String(str)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .replace(/\r/g, "");
  return `"${s}"`;
}

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function fetchArticleList(page, size) {
  const url = new URL(
    "https://blog.csdn.net/community/home-api/v1/get-business-list",
  );
  url.searchParams.set("page", String(page));
  url.searchParams.set("size", String(size));
  url.searchParams.set("businessType", "blog");
  url.searchParams.set("username", USERNAME);
  const json = await fetchJson(url.toString());
  if (json.code !== 200) throw new Error(json.message || "list api failed");
  return json.data;
}

async function fetchArticleHtml(articleUrl) {
  const res = await fetch(articleUrl, { headers });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${articleUrl}`);
  return res.text();
}

function extractArticleBody(html) {
  const $ = cheerio.load(html);

  const title =
    $("h1.title-article").first().text().trim() ||
    $("title").text().replace(/-CSDN.*$/, "").trim();

  let contentEl =
    $("#content_views").first().length > 0
      ? $("#content_views").first()
      : $("#article_content").first();

  if (!contentEl.length) {
    contentEl = $("div.blog-content-box").first();
  }

  contentEl.find("script, style, .hide-article-box").remove();

  const htmlContent = contentEl.html() || "";
  let markdown = htmlContent ? turndown.turndown(htmlContent) : "";

  if (!markdown.trim()) {
    const desc =
      $('meta[name="description"]').attr("content") ||
      $(".article-bar-top").text().trim();
    markdown = desc
      ? `> ${desc}\n\n（正文需登录或接口限制，请访问原文链接查看完整内容。）`
      : "（未能抓取正文，请访问原文链接。）";
  }

  return { title, markdown };
}

function writePost(meta, markdown, titleOverride) {
  const slug = slugify(meta.articleId);
  const filePath = path.join(POSTS_DIR, `${slug}.md`);

  const title = titleOverride || meta.title;
  const tags = (meta.tags || []).filter(Boolean);
  const frontmatter = [
    "---",
    `title: ${escapeYaml(title)}`,
    `date: ${escapeYaml(meta.postTime || "")}`,
    `description: ${escapeYaml(meta.description || "")}`,
    `tags: [${tags.map((t) => escapeYaml(t)).join(", ")}]`,
    `viewCount: ${meta.viewCount ?? 0}`,
    `articleId: "${meta.articleId}"`,
    `sourceUrl: ${escapeYaml(meta.url)}`,
    meta.picList?.[0] ? `cover: ${escapeYaml(meta.picList[0])}` : null,
    "---",
    "",
  ]
    .filter(Boolean)
    .join("\n");

  fs.writeFileSync(filePath, `${frontmatter}\n${markdown}`, "utf8");
  return filePath;
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : Infinity;
  const skipExisting = args.includes("--skip-existing");

  if (!fs.existsSync(POSTS_DIR)) {
    fs.mkdirSync(POSTS_DIR, { recursive: true });
  }

  console.log(`开始迁移 CSDN 博客: ${USERNAME}`);

  const first = await fetchArticleList(1, PAGE_SIZE);
  const total = first.total ?? first.list?.length ?? 0;
  console.log(`共 ${total} 篇文章`);

  let allArticles = [...(first.list || [])];
  const totalPages = Math.ceil(total / PAGE_SIZE);

  for (let page = 2; page <= totalPages; page++) {
    await sleep(300);
    const data = await fetchArticleList(page, PAGE_SIZE);
    allArticles = allArticles.concat(data.list || []);
    console.log(`已获取列表 ${page}/${totalPages} 页`);
  }

  if (Number.isFinite(limit)) {
    allArticles = allArticles.slice(0, limit);
  }

  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (let i = 0; i < allArticles.length; i++) {
    const meta = allArticles[i];
    const slug = slugify(meta.articleId);
    const filePath = path.join(POSTS_DIR, `${slug}.md`);

    if (skipExisting && fs.existsSync(filePath)) {
      skip++;
      continue;
    }

    process.stdout.write(
      `[${i + 1}/${allArticles.length}] ${meta.title?.slice(0, 40)}... `,
    );

    try {
      await sleep(DELAY_MS);
      const html = await fetchArticleHtml(meta.url);
      const { title, markdown } = extractArticleBody(html);
      writePost(meta, markdown, title || meta.title);
      console.log("OK");
      ok++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
      try {
        writePost(
          meta,
          `> ${meta.description || ""}\n\n[在 CSDN 阅读全文](${meta.url})`,
          meta.title,
        );
        ok++;
      } catch {
        fail++;
      }
    }
  }

  const manifest = {
    migratedAt: new Date().toISOString(),
    username: USERNAME,
    total,
    imported: ok,
    skipped: skip,
    failed: fail,
  };
  fs.writeFileSync(
    path.join(ROOT, "content", "migration-manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  console.log("\n完成:", manifest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
