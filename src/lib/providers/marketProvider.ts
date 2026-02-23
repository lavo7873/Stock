import type { Quote, Bar } from '@/lib/types';

const QUOTES_TTL = 120; // seconds
const BARS_TTL = 45 * 60; // 45 minutes

const cache = new Map<string, { data: Quote | Bar[]; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data as T;
}

function setCache<T extends Quote | Bar[]>(key: string, data: T, ttlSeconds: number) {
  cache.set(key, { data, expires: Date.now() + ttlSeconds * 1000 });
}

async function polygonQuote(ticker: string): Promise<Quote | null> {
  const key = process.env.POLYGON_API_KEY;
  if (!key) return null;
  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.results?.[0]) return null;
    const r = json.results[0];
    const prevClose = r.c ?? r.o;
    const change = r.c - prevClose;
    return {
      ticker,
      price: r.c,
      change,
      changePercent: prevClose ? (change / prevClose) * 100 : 0,
      volume: r.v ?? 0,
      open: r.o,
      high: r.h,
      low: r.l,
      prevClose,
    };
  } catch {
    return null;
  }
}

async function finnhubQuote(ticker: string): Promise<Quote | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const r = await res.json();
    if (r.c == null || r.c === 0) return null;
    const prevClose = r.pc ?? r.o ?? r.c;
    const change = r.c - prevClose;
    return {
      ticker,
      price: r.c,
      change,
      changePercent: prevClose ? (change / prevClose) * 100 : 0,
      volume: r.v ?? 0,
      prevClose,
    };
  } catch {
    return null;
  }
}

export async function getQuote(ticker: string): Promise<Quote | null> {
  const cacheKey = `quote:${ticker}`;
  const cached = getCached<Quote>(cacheKey);
  if (cached) return cached;

  let result = await polygonQuote(ticker);
  if (!result) result = await finnhubQuote(ticker);
  if (result) setCache(cacheKey, result, QUOTES_TTL);
  return result;
}

function toBar(p: { o: number; h: number; l: number; c: number; v?: number; t?: number }): Bar {
  return {
    o: p.o,
    h: p.h,
    l: p.l,
    c: p.c,
    v: p.v ?? 0,
    t: p.t ?? Date.now(),
  };
}

async function polygonBars(ticker: string, range: string): Promise<Bar[] | null> {
  const key = process.env.POLYGON_API_KEY;
  if (!key) return null;
  try {
    const days = range === '1d' ? 1 : range === '5d' ? 5 : range === '1m' ? 30 : 90;
    const to = new Date();
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    const format = (d: Date) => d.toISOString().slice(0, 10);
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${format(from)}/${format(to)}?adjusted=true&sort=asc&limit=5000&apiKey=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.results?.length) return null;
    return json.results.map(toBar);
  } catch {
    return null;
  }
}

async function finnhubBars(ticker: string, range: string): Promise<Bar[] | null> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return null;
  try {
    const days = range === '1d' ? 1 : range === '5d' ? 5 : range === '1m' ? 30 : 90;
    const to = Math.floor(Date.now() / 1000);
    const from = to - days * 86400;
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${from}&to=${to}&token=${key}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.c?.length) return null;
    const bars: Bar[] = json.c.map((c: number, i: number) => ({
      o: json.o?.[i] ?? c,
      h: json.h?.[i] ?? c,
      l: json.l?.[i] ?? c,
      c,
      v: json.v?.[i] ?? 0,
      t: (json.t?.[i] ?? 0) * 1000,
    }));
    return bars;
  } catch {
    return null;
  }
}

export async function getBars(ticker: string, range: string): Promise<Bar[] | null> {
  const cacheKey = `bars:${ticker}:${range}`;
  const cached = getCached<Bar[]>(cacheKey);
  if (cached) return cached;

  let result = await polygonBars(ticker, range);
  if (!result?.length) result = await finnhubBars(ticker, range);
  if (result?.length) setCache(cacheKey, result, BARS_TTL);
  return result ?? null;
}
