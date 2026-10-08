import rss from "@astrojs/rss";
import {getCollection} from "astro:content";
import sanitizeHtml from "sanitize-html";
import MarkdownIt from "markdown-it";
import {SITE_TITLE, SITE_DESCRIPTION} from "../consts";
import type {APIContext} from "astro";

const parser = new MarkdownIt();

export async function GET(context: APIContext) {
  const posts = await getCollection("blog");
  const currentDate = new Date().toUTCString();

  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: posts
      .filter((post) => !post.data.isArchived)
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .slice(0, 10)
      .map((post) => ({
        ...post.data,
        link: `/blog/${post.id}/`,
        pubDate: post.data.pubDate,
        content: post.body ? sanitizeHtml(parser.render(post.body)) : ""
      })),
    customData: `<lastBuildDate>${currentDate}</lastBuildDate>`
  });
}
