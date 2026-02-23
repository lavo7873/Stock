import { getQuote, getBars } from '@/lib/providers/marketProvider';
import { getNews } from '@/lib/providers/newsProvider';
import {
  STOCK_UNIVERSE,
  type ReportPayload,
  type IntradayPlanSetup,
  type TomorrowPlanSetup,
  type TrendingStock,
} from '@/lib/types';

function ema(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const result: number[] = [];
  let prev = data[0];
  for (let i = 0; i < data.length; i++) {
    prev = i === 0 ? data[i] : data[i] * k + prev * (1 - k);
    result.push(prev);
  }
  return result;
}

function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = closes.length - period; i < closes.length - 1; i++) {
    const diff = closes[i + 1] - closes[i];
    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function atr(bars: { h: number; l: number; c: number }[], period = 14): number {
  if (bars.length < period + 1) return 0;
  let sum = 0;
  for (let i = bars.length - period; i < bars.length; i++) {
    const h = bars[i].h;
    const l = bars[i].l;
    const prev = bars[i - 1]?.c ?? bars[i].c;
    sum += Math.max(h - l, Math.abs(h - prev), Math.abs(l - prev));
  }
  return sum / period;
}

function macd(closes: number[]): { macd: number; signal: number } | null {
  if (closes.length < 34) return null;
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((e12, i) => e12 - ema26[i]);
  const signalLine = ema(macdLine, 9);
  return {
    macd: macdLine[macdLine.length - 1] ?? 0,
    signal: signalLine[signalLine.length - 1] ?? 0,
  };
}

function momentum(closes: number[], days: number): number | null {
  if (closes.length < days + 1) return null;
  const p = closes[closes.length - days - 1];
  const c = closes[closes.length - 1];
  return p ? ((c - p) / p) * 100 : null;
}

export function getRegime(spyChange: number): string {
  if (spyChange > 0.5) return 'BULL';
  if (spyChange < -0.5) return 'BEAR';
  return 'NEUTRAL';
}

/** Demo payload when no API keys – shows sample data for UI testing */
export function getDemoPayload(ptDateStr: string): ReportPayload {
  const demoIntraday: IntradayPlanSetup[] = [
    { ticker: 'NVDA', setup: 'BREAKOUT', entry: 141.5, sellTarget: 145.2, stopLoss: 138.8, hold: '1–2 days', rr: 1.5, confidence: 'MEDIUM', why: ['Momentum strong', 'Volume spike'], riskFlags: [] },
    { ticker: 'AMD', setup: 'PULLBACK', entry: 142.0, sellTarget: 146.4, stopLoss: 139.2, hold: '1–2 days', rr: 1.6, confidence: 'HIGH', why: ['EMA20 support', 'RSI healthy'], riskFlags: [] },
    { ticker: 'TSLA', setup: 'NEWS-DRIVEN', entry: 245.0, sellTarget: 252.0, stopLoss: 240.0, hold: '1–2 days', rr: 1.4, confidence: 'MEDIUM', why: ['Recent news flow'], riskFlags: [] },
  ];
  const demoPlan: TomorrowPlanSetup[] = [
    { ticker: 'AAPL', setup: 'TREND', entryZone: { low: 225.5, high: 227.2 }, sellTarget: 235.0, stopLoss: 218.0, hold: '3–7 days', confidence: 'HIGH', why: ['EMA20 above EMA50', 'RSI in healthy zone'], riskFlags: [], tpDetail: { tp1: 231.0, tp2: 235.0 } },
    { ticker: 'NVDA', setup: 'PULLBACK', entryZone: { low: 138.0, high: 141.5 }, sellTarget: 150.0, stopLoss: 130.0, hold: '3–7 days', confidence: 'MEDIUM', why: ['MACD bullish', 'Positive 1w momentum'], riskFlags: [], tpDetail: { tp1: 145.0, tp2: 150.0 } },
    { ticker: 'MSFT', setup: 'TREND', entryZone: { low: 415.0, high: 418.5 }, sellTarget: 432.0, stopLoss: 402.0, hold: '1–3 weeks', confidence: 'HIGH', why: ['EMA20 above EMA50', 'Strong technicals'], riskFlags: [], tpDetail: { tp1: 427.0, tp2: 432.0 } },
    { ticker: 'GOOGL', setup: 'BREAKOUT', entryZone: { low: 178.5, high: 180.2 }, sellTarget: 188.0, stopLoss: 172.0, hold: '3–7 days', confidence: 'MEDIUM', why: ['RSI in healthy zone'], riskFlags: [], tpDetail: { tp1: 184.0, tp2: 188.0 } },
    { ticker: 'META', setup: 'TREND', entryZone: { low: 565.0, high: 570.0 }, sellTarget: 590.0, stopLoss: 548.0, hold: '3–7 days', confidence: 'MEDIUM', why: ['Positive 1w momentum'], riskFlags: [], tpDetail: { tp1: 582.0, tp2: 590.0 } },
  ];
  const demoTrending: TrendingStock[] = demoPlan.map((p, i) => ({
    ticker: p.ticker,
    setup: p.setup,
    price: (p.entryZone.low + p.entryZone.high) / 2,
    changePercent: [0.8, 1.2, 0.6, 1.5, 1.0][i] ?? 1.0,
    summary: p.why[0] ?? 'Strong technicals',
  }));
  return {
    asOfClose: `${ptDateStr}T21:00:00.000Z`,
    regime: 'NEUTRAL',
    summary5: [
      'Market regime: NEUTRAL (demo)',
      'SPY N/A% – Thêm POLYGON_API_KEY hoặc FINNHUB_API_KEY để lấy data thật',
      `Top setup: AAPL (TREND)`,
      'Hold horizon: 3–7 days',
      'News items: 0 (demo)',
    ],
    intradayPlan: demoIntraday,
    tomorrowPlan: demoPlan,
    trendingStrong: demoTrending,
    picks: { week: ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META'], month: ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META'], year: ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'META'] },
    newsShocks: [],
  };
}

export async function runDailyWrap(ptDateStr: string): Promise<ReportPayload> {
  const quotes: Record<string, Awaited<ReturnType<typeof getQuote>>> = {};
  const barsMap: Record<string, Awaited<ReturnType<typeof getBars>>> = {};
  const newsMap: Record<string, Awaited<ReturnType<typeof getNews>>> = {};

  const tickers = [...STOCK_UNIVERSE];

  await Promise.all(
    tickers.map(async (t) => {
      const [q, b] = await Promise.all([getQuote(t), getBars(t, '1m')]);
      quotes[t] = q;
      barsMap[t] = b;
    })
  );

  for (const t of tickers.slice(0, 10)) {
    newsMap[t] = await getNews(t, 1);
  }

  const spyQuote = quotes.SPY;
  const regime = getRegime(spyQuote?.changePercent ?? 0);

  const scored: Array<{
    ticker: string;
    score: number;
    quote: NonNullable<(typeof quotes)[string]>;
    bars: NonNullable<(typeof barsMap)[string]>;
    setup: 'TREND' | 'PULLBACK' | 'BREAKOUT';
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    why: string[];
    riskFlags: string[];
  }> = [];

  for (const ticker of tickers) {
    const q = quotes[ticker];
    const b = barsMap[ticker];
    if (!q || !b?.length) continue;

    const closes = b.map((x) => x.c);
    const ema20Arr = ema(closes, 20);
    const ema50Arr = ema(closes, 50);
    const ema20 = ema20Arr[ema20Arr.length - 1];
    const ema50 = ema50Arr[ema50Arr.length - 1];
    const rsiVal = rsi(closes);
    const macdVal = macd(closes);
    const mom1w = momentum(closes, 5);
    const mom1m = momentum(closes, 20);
    const atrVal = atr(barsMap[ticker]!, 14);
    const resistance = Math.max(...b.slice(-20).map((x) => x.h));

    let setup: 'TREND' | 'PULLBACK' | 'BREAKOUT' = 'TREND';
    const aboveEma20 = q.price > ema20;
    const aboveEma50 = q.price > ema50;
    if (aboveEma20 && aboveEma50 && q.price > resistance * 0.98) setup = 'BREAKOUT';
    else if (aboveEma20 && q.price < ema20 + atrVal) setup = 'PULLBACK';
    else if (aboveEma20 && aboveEma50) setup = 'TREND';

    const why: string[] = [];
    if (ema20 > ema50) why.push('EMA20 above EMA50');
    if (rsiVal != null && rsiVal > 40 && rsiVal < 70) why.push('RSI in healthy zone');
    if (macdVal && macdVal.macd > macdVal.signal) why.push('MACD bullish');
    if (mom1w != null && mom1w > 0) why.push('Positive 1w momentum');
    const news = newsMap[ticker];
    if (news?.length) why.push('Recent news flow');

    const riskFlags: string[] = [];
    if (rsiVal != null && rsiVal > 70) riskFlags.push('RSI overbought');
    if (mom1m != null && mom1m < -5) riskFlags.push('Weak 1m momentum');

    let score = 0;
    if (setup === 'TREND') score += 30;
    if (setup === 'BREAKOUT') score += 25;
    if (setup === 'PULLBACK') score += 20;
    if (rsiVal != null && rsiVal > 40 && rsiVal < 70) score += 15;
    if (macdVal && macdVal.macd > macdVal.signal) score += 10;
    if (mom1w != null && mom1w > 0) score += 10;
    if (regime === 'BULL') score += 10;
    score += q.changePercent;

    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (score > 75 && why.length >= 2) confidence = 'HIGH';
    if (score < 40) confidence = 'LOW';

    scored.push({ ticker, score, quote: q, bars: b, setup, confidence, why, riskFlags });
  }

  if (scored.length === 0) {
    return getDemoPayload(ptDateStr);
  }

  scored.sort((a, b) => b.score - a.score);
  const top5 = scored.slice(0, 5);

  const intradayCandidates = scored.filter((s) => {
    const rsiVal = rsi(s.bars.map((x) => x.c));
    const mom5 = momentum(s.bars.map((x) => x.c), 5);
    return (rsiVal == null || rsiVal < 80) && (mom5 == null || mom5 > 0) && (s.setup === 'BREAKOUT' || s.setup === 'PULLBACK' || (newsMap[s.ticker]?.length ?? 0) > 0);
  });

  const intradayPlan: IntradayPlanSetup[] = intradayCandidates.slice(0, 10).map((s) => {
    const atrVal = atr(s.bars, 14) || s.quote.price * 0.02;
    const closes = s.bars.map((x) => x.c);
    const ema20Last = ema(closes, 20).pop() ?? s.quote.price;
    const resistance = Math.max(...s.bars.slice(-20).map((x) => x.h));
    const hasNews = (newsMap[s.ticker]?.length ?? 0) > 0;
    let entry: number;
    let setup: 'BREAKOUT' | 'PULLBACK' | 'NEWS-DRIVEN' = s.setup === 'BREAKOUT' ? 'BREAKOUT' : s.setup === 'PULLBACK' ? 'PULLBACK' : 'NEWS-DRIVEN';
    if (s.setup === 'BREAKOUT' && s.quote.price > resistance * 0.98) {
      entry = resistance + 0.2 * atrVal;
      setup = 'BREAKOUT';
    } else if (s.setup === 'PULLBACK') {
      entry = ema20Last;
      setup = 'PULLBACK';
    } else if (hasNews) {
      entry = s.quote.price;
      setup = 'NEWS-DRIVEN';
    } else {
      entry = (ema20Last + s.quote.price) / 2;
    }
    const stop = entry - 0.8 * atrVal;
    const sell = entry + 1.2 * atrVal;
    const rr = entry > stop ? (sell - entry) / (entry - stop) : 0;
    return {
      ticker: s.ticker,
      setup,
      entry: Math.round(entry * 100) / 100,
      sellTarget: Math.round(sell * 100) / 100,
      stopLoss: Math.round(stop * 100) / 100,
      hold: '1–2 days',
      rr: Math.round(rr * 10) / 10,
      confidence: s.confidence,
      why: s.why.slice(0, 2),
      riskFlags: s.riskFlags.slice(0, 1),
    };
  }).filter((x) => x.rr >= 1.2).slice(0, 3);

  const tomorrowPlan: TomorrowPlanSetup[] = top5.map((s) => {
    const atrVal = atr(s.bars, 14) || s.quote.price * 0.02;
    const closes = s.bars.map((x) => x.c);
    const ema20Last = ema(closes, 20).pop() ?? s.quote.price;
    let entryLow: number;
    let entryHigh: number;

    if (s.setup === 'BREAKOUT') {
      const res = Math.max(...s.bars.slice(-10).map((x) => x.h));
      entryLow = res + 0.2 * atrVal;
      entryHigh = res + 0.5 * atrVal;
    } else {
      entryLow = Math.max(s.quote.price - 0.5 * atrVal, ema20Last - 0.5 * atrVal);
      entryHigh = Math.min(s.quote.price + 0.5 * atrVal, ema20Last + 0.5 * atrVal);
    }
    const entryMid = (entryLow + entryHigh) / 2;
    const stop = entryMid - 1.2 * atrVal;
    const sellTarget = entryMid + 1.5 * atrVal;
    const tp1 = entryMid + 1.0 * atrVal;
    const tp2 = entryMid + 2.0 * atrVal;

    const hold = regime === 'BULL' && s.setup === 'TREND' ? '1–3 weeks' : '3–7 days';

    return {
      ticker: s.ticker,
      setup: s.setup,
      entryZone: { low: Math.round(entryLow * 100) / 100, high: Math.round(entryHigh * 100) / 100 },
      sellTarget: Math.round(sellTarget * 100) / 100,
      stopLoss: Math.round(stop * 100) / 100,
      hold,
      confidence: s.confidence,
      why: s.why.slice(0, 2),
      riskFlags: s.riskFlags.slice(0, 1),
      tpDetail: { tp1: Math.round(tp1 * 100) / 100, tp2: Math.round(tp2 * 100) / 100 },
    };
  });

  const trendingStrong: TrendingStock[] = top5.map((s) => ({
    ticker: s.ticker,
    setup: s.setup,
    price: s.quote.price,
    changePercent: s.quote.changePercent,
    summary: s.why[0] ?? 'Strong technicals',
  }));

  const picksWeek = scored.slice(0, 5).map((s) => s.ticker);
  const picksMonth = scored.slice(0, 5).map((s) => s.ticker);
  const picksYear = scored.slice(0, 5).map((s) => s.ticker);

  const newsShocks: string[] = [];
  for (const [t, news] of Object.entries(newsMap)) {
    if (news?.length && news[0]) {
      newsShocks.push(`${t}: ${news[0].title}`);
    }
  }

  const summary5 = [
    `Market regime: ${regime}`,
    `SPY ${spyQuote?.changePercent != null ? spyQuote.changePercent.toFixed(2) : 'N/A'}%`,
    `Top setup: ${tomorrowPlan[0]?.ticker ?? 'N/A'} (${tomorrowPlan[0]?.setup ?? 'N/A'})`,
    `Hold horizon: ${tomorrowPlan[0]?.hold ?? '3–7 days'}`,
    `News items: ${Object.values(newsMap).flat().length}`,
  ];

  return {
    asOfClose: `${ptDateStr}T21:00:00.000Z`,
    regime,
    summary5,
    intradayPlan,
    tomorrowPlan,
    trendingStrong,
    picks: { week: picksWeek, month: picksMonth, year: picksYear },
    newsShocks: newsShocks.slice(0, 5),
  };
}
