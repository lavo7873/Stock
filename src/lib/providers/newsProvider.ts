import type { NewsItem } from '@/lib/types';

const NEWS_TTL = 15 * 60; // 15 minutes

const cache = new Map<string, { data: NewsItem[]; expires: number }>();

function hashUrl(url: string): string {
  let h = 0;
  for (let i = 0; i < url.length; i++) {
    h = ((h << 5) - h) + url.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

function dedupeByUrl(news: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return news.filter((n) => {
    const key = hashUrl(n.url);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function newsApiNews(ticker: string, days: number): Promise<NewsItem[] | null> {
  const key = process.env.NEWS_API_KEY;
  if (!key) return null;
  try {
    const from = new Date();
    from.setDate(from.getDate() - days);
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(ticker)}&from=${from.toISOString().slice(0, 10)}&sortBy=publishedAt&pageSize=50&apiKey=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status !== 'ok' || !json.articles?.length) return [];
    return json.articles
      .filter((a: { url?: string }) => a.url)
      .map((a: { title?: string; url?: string; publishedAt?: string; source?: { name?: string }; description?: string }) => ({
        title: a.title ?? '',
        url: a.url ?? '',
        publishedAt: a.publishedAt ?? '',
        source: a.source?.name,
        summary: a.description,
      }));
  } catch {
    return null;
  }
}

async function finnhubNews(ticker: string): Promise<NewsItem[] | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  try {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${from.toISOString().slice(0, 10)}&to=${new Date().toISOString().slice(0, 10)}&token=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (!Array.isArray(json)) return [];
    return json
      .filter((a: { url?: string }) => a.url)
      .map((a: { headline?: string; url?: string; datetime?: number; source?: string; summary?: string }) => ({
        title: a.headline ?? '',
        url: a.url ?? '',
        publishedAt: a.datetime ? new Date(a.datetime * 1000).toISOString() : '',
        source: a.source,
        summary: a.summary,
      }));
  } catch {
    return null;
  }
}

export async function getNews(ticker: string, days: number): Promise<NewsItem[]> {
  const cacheKey = `news:${ticker}:${days}`;
  const entry = cache.get(cacheKey);
  if (entry && Date.now() <= entry.expires) return entry.data;

  let result: NewsItem[] | null = await newsApiNews(ticker, days);
  if (result === null) result = await finnhubNews(ticker);
  const items = dedupeByUrl(result ?? []);
  cache.set(cacheKey, { data: items, expires: Date.now() + NEWS_TTL * 1000 });
  return items;
}
