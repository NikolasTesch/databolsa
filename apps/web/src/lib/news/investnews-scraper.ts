import type { NewsArticle } from './news.service';

const INVESTNEWS_RSS_URL = 'https://investnews.com.br/investimentos/feed/';

/** Parses a RFC 2822 date string (e.g., "Tue, 16 Jun 2026 21:19:27 +0000") to ISO 8601. */
function parseRfcDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {
    // fall through
  }
  return new Date().toISOString();
}

/** Extracts the text content between two XML tags using simple string parsing. */
function extractTag(xml: string, tag: string): string {
  const openTag = `<${tag}>`;
  const closeTag = `</${tag}>`;

  // Try plain tag first
  let start = xml.indexOf(openTag);
  if (start !== -1) {
    const end = xml.indexOf(closeTag, start + openTag.length);
    if (end !== -1) {
      return xml.slice(start + openTag.length, end).trim();
    }
  }

  // Try CDATA variant: <tag><![CDATA[...]]></tag>
  const cdataOpen = `<${tag}><![CDATA[`;
  const cdataClose = `]]></${tag}>`;
  start = xml.indexOf(cdataOpen);
  if (start !== -1) {
    const end = xml.indexOf(cdataClose, start + cdataOpen.length);
    if (end !== -1) {
      return xml.slice(start + cdataOpen.length, end).trim();
    }
  }

  return '';
}

/** Extracts the value of an XML attribute from an element string. */
function extractAttr(element: string, attr: string): string {
  const match = element.match(new RegExp(`${attr}="([^"]+)"`));
  return match ? match[1] : '';
}

/**
 * Fetches the InvestNews /investimentos/ RSS feed and parses it into NewsArticle objects.
 * Returns an empty array on any error so callers can degrade gracefully.
 */
export async function fetchInvestNewsArticles(): Promise<NewsArticle[]> {
  try {
    const res = await fetch(INVESTNEWS_RSS_URL, {
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'DataBolsa/1.0 (+https://databolsa.com.br)' },
    });

    if (!res.ok) {
      console.warn(`[investnews-scraper] RSS returned ${res.status}`);
      return [];
    }

    const xml = await res.text();

    // Split into <item> blocks
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const articles: NewsArticle[] = [];
    let match: RegExpExecArray | null;

    while ((match = itemRegex.exec(xml)) !== null) {
      const item = match[1];

      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link');
      const description = extractTag(item, 'description');
      const pubDate = extractTag(item, 'pubDate');
      const guid = extractTag(item, 'guid');

      if (!title || !link) continue;

      // Try to get image from <media:content url="..."> or <media:thumbnail url="...">
      let imageUrl: string | null = null;
      const mediaContent = item.match(/<media:content[^>]+>/);
      if (mediaContent) {
        imageUrl = extractAttr(mediaContent[0], 'url') || null;
      }
      if (!imageUrl) {
        const mediaThumbnail = item.match(/<media:thumbnail[^>]+>/);
        if (mediaThumbnail) {
          imageUrl = extractAttr(mediaThumbnail[0], 'url') || null;
        }
      }

      // Use guid as ID; strip the domain prefix if present
      const id = `investnews-${guid.replace('https://investnews.com.br/?p=', '')}`;

      articles.push({
        id,
        title,
        summary: description,
        source: 'InvestNews',
        url: link,
        imageUrl,
        publishedAt: parseRfcDate(pubDate),
      });
    }

    return articles;
  } catch (err) {
    console.warn(`[investnews-scraper] Error fetching RSS: ${String(err)}`);
    return [];
  }
}
