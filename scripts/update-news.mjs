import { writeFile } from "node:fs/promises";

const feeds = [
  {
    category: "AI CCTV",
    url: "https://news.google.com/rss/search?q=AI%20CCTV%20video%20surveillance%20physical%20security%20OR%20video%20analytics&hl=en-US&gl=US&ceid=US:en"
  },
  {
    category: "Cybersecurity",
    url: "https://news.google.com/rss/search?q=enterprise%20cybersecurity%20network%20security%20threat%20intelligence&hl=en-US&gl=US&ceid=US:en"
  },
  {
    category: "Access Control",
    url: "https://news.google.com/rss/search?q=access%20control%20biometrics%20facial%20recognition%20building%20security&hl=en-US&gl=US&ceid=US:en"
  },
  {
    category: "AIOC & Analytics",
    url: "https://news.google.com/rss/search?q=security%20operations%20center%20AI%20analytics%20license%20plate%20recognition%20speed%20detection&hl=en-US&gl=US&ceid=US:en"
  },
  {
    category: "Drone & Radar",
    url: "https://news.google.com/rss/search?q=counter%20drone%20radar%20perimeter%20security%20detection%20technology&hl=en-US&gl=US&ceid=US:en"
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
    "AI CCTV": "ข่าวจากแหล่งภายนอกนี้เกี่ยวข้องกับ AI, CCTV และระบบวิเคราะห์ภาพสำหรับงานรักษาความปลอดภัย",
    "Cybersecurity": "ข่าวจากแหล่งภายนอกนี้เกี่ยวข้องกับความปลอดภัยไซเบอร์และโครงสร้างเครือข่ายองค์กร",
    "Access Control": "ข่าวจากแหล่งภายนอกนี้เกี่ยวข้องกับ Access Control, Biometrics และระบบยืนยันตัวตน",
    "AIOC & Analytics": "ข่าวจากแหล่งภายนอกนี้เกี่ยวข้องกับศูนย์ควบคุมอัจฉริยะ, Video Analytics, LPR และการตรวจจับเหตุการณ์",
    "Drone & Radar": "ข่าวจากแหล่งภายนอกนี้เกี่ยวข้องกับการตรวจจับโดรน เรดาร์ และความปลอดภัยรอบพื้นที่"
  };
  return `${introByCategory[item.category] || "ข่าวจากแหล่งภายนอกนี้เกี่ยวข้องกับเทคโนโลยีความปลอดภัยองค์กร"}: ${title}`;
}

function makeFallbackSummaryEn(item) {
  const title = cleanTitle(item.title);
  const introByCategory = {
    "AI CCTV": "External news update covering AI video surveillance, CCTV analytics, and smarter monitoring",
    "Cybersecurity": "External news update covering enterprise cybersecurity, network security, and resilience",
    "Access Control": "External news update covering access control, biometrics, and identity systems",
    "AIOC & Analytics": "External news update covering intelligent control rooms, video analytics, LPR, and event detection",
    "Drone & Radar": "External news update covering counter-drone, radar, and perimeter detection technology"
  };
  return `${introByCategory[item.category] || "External news update covering enterprise security technology"}: ${title}`;
}

function dedupeByTitle(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = cleanTitle(item.title).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

function balancedSelection(items, total = 6, perCategory = 2) {
  const categories = [...new Set(feeds.map((feed) => feed.category))];
  const selected = [];

  for (const category of categories) {
    const item = items.find((candidate) => candidate.category === category && !selected.includes(candidate));
    if (item) selected.push(item);
    if (selected.length >= total) return selected;
  }

  for (const item of limitPerCategory(items, perCategory)) {
    if (!selected.includes(item)) selected.push(item);
    if (selected.length >= total) return selected;
  }

  return selected;
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
    const selected = balancedSelection(items, 6, 2);
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
          content: "You summarize external technology news for a Thai corporate security systems website. Do not write as if the news is from IPM. Return JSON only."
        },
        {
          role: "user",
          content: `Select the 6 most relevant external news items for IT, CCTV, cybersecurity, access control, AIOC/control rooms, video analytics, license plate recognition, drone/radar detection, and security innovation. Avoid IPM as a source. Return JSON only in this shape: {"thItems":[{"category":"","title":"","summary":"","sourceName":"","sourceUrl":""}],"enItems":[{"category":"","title":"","summary":"","sourceName":"","sourceUrl":""}]}. Thai summaries must be concise Thai and mention that the item is from an external news source when natural. English summaries must be concise English. Preserve sourceName and sourceUrl.\n\n${JSON.stringify(items.slice(0, 20), null, 2)}`
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
  const rawItems = dedupeByTitle(groups.flat()).filter((item) => !/ipm/i.test(`${item.sourceName} ${item.sourceUrl}`));
  const summarized = await summarizeWithOpenAI(rawItems);
  const baseMeta = {
    updatedAt: new Date().toISOString(),
    generatedBy: process.env.OPENAI_API_KEY ? "github-actions-openai" : "github-actions-rss-fallback"
  };
  const makeNews = (items) => ({
    ...baseMeta,
    items: items.map((item) => ({
      category: item.category || "Security",
      title: cleanTitle(item.title),
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
