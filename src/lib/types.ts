export interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  open?: number;
  high?: number;
  low?: number;
  prevClose?: number;
}

export interface Bar {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
  t: number;
}

export interface NewsItem {
  title: string;
  url: string;
  publishedAt: string;
  source?: string;
  summary?: string;
  sentiment?: number;
}

export interface EntryZone {
  low: number;
  high: number;
}

export interface TPDetail {
  tp1?: number;
  tp2?: number;
}

export interface IntradayPlanSetup {
  ticker: string;
  setup: 'BREAKOUT' | 'PULLBACK' | 'NEWS-DRIVEN';
  entry: number;
  sellTarget: number;
  stopLoss: number;
  hold: string;
  rr: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  why: string[];
  riskFlags: string[];
}

export interface TomorrowPlanSetup {
  ticker: string;
  setup: 'TREND' | 'PULLBACK' | 'BREAKOUT';
  entryZone: EntryZone;
  sellTarget: number;
  stopLoss: number;
  hold: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  why: string[];
  riskFlags: string[];
  tpDetail?: TPDetail;
}

export interface TrendingStock {
  ticker: string;
  setup: string;
  price: number;
  changePercent: number;
  summary: string;
}

export interface ReportPayload {
  asOfClose: string;
  regime: string;
  summary5: string[];
  intradayPlan: IntradayPlanSetup[];
  tomorrowPlan: TomorrowPlanSetup[];
  trendingStrong: TrendingStock[];
  picks: {
    week: string[];
    month: string[];
    year: string[];
  };
  newsShocks: string[];
}

export interface ReportRecord {
  id: string;
  type: string;
  report_date: string;
  status: string;
  asof: string;
  payload: ReportPayload;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export const STOCK_UNIVERSE = [
  'SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD',
  'INTC', 'CRM', 'ADBE', 'NFLX', 'PYPL', 'UBER', 'COIN', 'SHOP', 'SQ', 'PLTR',
];
