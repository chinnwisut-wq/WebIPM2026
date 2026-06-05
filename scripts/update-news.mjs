import { writeFile } from "node:fs/promises";

const feeds = [
  {
    category: "AI CCTV",
    url: "https://news.google.com/rss/search?q=CCTV%20AI%20video%20surveillance%20security%20technology&hl=en-US&gl=US&ceid=US:en"
  },
  {
    category: "IT Security",
    url: "https://news.google.com/rss/search?q=enterprise%20IT%20security%20network%20infrastructure&hl=en-US&gl=US&ceid=US:en"
  },
  {
    category: "Innovation",
    url: "https://news.google.com/rss/search?q=smart%20building%20security%20access%20control%20innovation&hl=en-US&gl=US&ceid=US:en"
  }
];

function decodeXml(value = "") {
  return value
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&nbsp;", " ")
    .trim();
}

function pickTag(item, tag) {
  const match = item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return decodeXml(match?.[1] || "");
}

function parseRss(xml, category) {
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  return itemMatches.slice(0, 4).map((item) => ({
    category,
    title: pickTag(item, "title"),
    summary: pickTag(item, "description").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    sourceName: pickTag(item, "source") || "Google News",
    sourceUrl: pickTag(item, "link"),
    publishedAt: pickTag(item, "pubDate")
  })).filter((item) => item.title && item.sourceUrl);
}

async function fetchFeed(feed) {
  const response = await fetch(feed.url);
  if (!response.ok) throw new Error(`Feed failed ${feed.category}: ${response.status}`);
  const xml = await response.text();
  return parseRss(xml, feed.category);
}

function cleanTitle(title) {
  return title.replace(/\s+-\s+[^-]+$/, "").trim();
}

function makeFallbackSummaryTh(item) {
  const title = item.title.replace(/\s+-\s+[^-]+$/, "").trim();
  const introByCategory = {
    "AI CCTV": "ประเด็นนี้เกี่ยวข้องกับการพัฒนา AI, กล้องวงจรปิด และระบบวิเคราะห์ภาพสำหรับงานรักษาความปลอดภัย",
    "IT Security": "ประเด็นนี้เกี่ยวข้องกับความปลอดภัยด้าน IT และโครงสร้างเครือข่ายที่องค์กรควรติดตาม",
    "Innovation": "ประเด็นนี้สะท้อนทิศทางนวัตกรรมที่เกี่ยวข้องกับระบบอาคารและความปลอดภัยอัจฉริยะ"
  };
  return `${introByCategory[item.category] || "ประเด็นนี้เกี่ยวข้องกับเทคโนโลยีความปลอดภัยองค์กร"}: ${title}`;
}

function makeFallbackSummaryEn(item) {
  const title = cleanTitle(item.title);
  const introByCategory = {
    "AI CCTV": "This update relates to AI video surveillance, CCTV analytics, and smarter monitoring",
    "IT Security": "This update relates to enterprise IT security, network infrastructure, and operational resilience",
    "Innovation": "This update reflects innovation trends in smart buildings, access control, and integrated security"
  };
  return `${introByCategory[item.category] || "This update relates to enterprise security technology"}: ${title}`;
}

function limitPerCategory(items, limit = 2) {
  const counts = new Map();
  return items.filter((item) => {
    const current = counts.get(item.category) || 0;
    if (current >= limit) return false;
    counts.set(item.category, current + 1);
    return true;
  });
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const parts = data.output?.flatMap((entry) => entry.content || []) || [];
  return parts.map((part) => part.text || "").join("\n").trim();
}

function parseJsonText(text) {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  return JSON.parse(cleaned);
}

async function summarizeWithOpenAI(items) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const selected = limitPerCategory(items, 2).slice(0, 6);
    return {
      thItems: selected.map((item) => ({
        category: item.category,
        title: item.title,
        summary: makeFallbackSummaryTh(item),
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl
      })),
      enItems: selected.map((item) => ({
        category: item.category,
        title: item.title,
        summary: makeFallbackSummaryEn(item),
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl
      }))
    };
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content: "You summarize technology news for a Thai corporate security systems website. Return JSON only."
        },
        {
          role: "user",
          content: `Select the 6 most relevant items for IT, CCTV, access control, alarm, network security, and innovation. Return JSON only in this shape: {"thItems":[{"category":"","title":"","summary":"","sourceName":"","sourceUrl":""}],"enItems":[{"category":"","title":"","summary":"","sourceName":"","sourceUrl":""}]}. Thai summaries must be concise Thai. English summaries must be concise English. Preserve sourceName and sourceUrl.\n\n${JSON.stringify(items.slice(0, 12), null, 2)}`
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI response failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const text = extractResponseText(data);
  const parsed = parseJsonText(text);
  return {
    thItems: parsed.thItems || parsed.items || [],
    enItems: parsed.enItems || parsed.items || []
  };
}

async function main() {
  const groups = await Promise.all(feeds.map(fetchFeed));
  const rawItems = groups.flat();
  const summarized = await summarizeWithOpenAI(rawItems);
  const baseMeta = {
    updatedAt: new Date().toISOString(),
    generatedBy: process.env.OPENAI_API_KEY ? "github-actions-openai" : "github-actions-rss-fallback"
  };
  const makeNews = (items) => ({
    ...baseMeta,
    items: items.map((item) => ({
      category: item.category || "Security",
      title: item.title,
      summary: item.summary,
      sourceName: item.sourceName || "Source",
      sourceUrl: item.sourceUrl
    })).filter((item) => item.title && item.summary && item.sourceUrl).slice(0, 6)
  });

  const thNews = makeNews(summarized.thItems);
  const enNews = makeNews(summarized.enItems);
  await writeFile(new URL("../data/news.json", import.meta.url), `${JSON.stringify(thNews, null, 2)}\n`, "utf8");
  await writeFile(new URL("../data/news-en.json", import.meta.url), `${JSON.stringify(enNews, null, 2)}\n`, "utf8");
  console.log(`Updated ${thNews.items.length} Thai news items and ${enNews.items.length} English news items.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
