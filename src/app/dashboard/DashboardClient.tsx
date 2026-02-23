'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ReportPayload } from '@/lib/types';

interface ReportRecord {
  id: string;
  report_date: string;
  payload: ReportPayload;
}

function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function DashboardClient() {
  const [latest, setLatest] = useState<ReportRecord | null>(null);
  const [history, setHistory] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 3000);
    async function load() {
      try {
        const [latRes, histRes] = await Promise.all([
          fetch('/api/history/latest', { credentials: 'include' }),
          fetch('/api/history?range=14d', { credentials: 'include' }),
        ]);
        if (cancelled) return;
        if (latRes.status === 401) {
          window.location.href = '/login';
          return;
        }
        if (latRes.ok) {
          const d = await latRes.json();
          if (!cancelled) setLatest(d);
        }
        if (histRes.ok) {
          const arr = await histRes.json();
          if (!cancelled) setHistory(Array.isArray(arr) ? arr : []);
        }
      } finally {
        if (!cancelled) {
          clearTimeout(timer);
          setLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  async function handleRunWrap() {
    if (running) return;
    setRunning(true);
    try {
      const res = await fetch('/api/run-wrap', { method: 'POST', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const msg = data?.message ?? (data?.dryRun
          ? `Wrap OK (dry run) cho ${data?.report_date ?? 'ngày mới'}. Chưa lưu vì Supabase chưa cấu hình.`
          : data?.skipped ? `Report đã tồn tại (đã locked).` : `Đã tạo report cho ${data?.report_date ?? 'ngày mới'}`);
        alert(msg);
        if (data?.dryRun && data?.payload) {
          setLatest({ id: 'dry-run', report_date: data.report_date ?? '', payload: data.payload } as ReportRecord);
        } else {
          window.location.reload();
        }
      } else {
        alert(data?.error ?? 'Lỗi khi chạy wrap');
      }
    } catch {
      alert('Lỗi kết nối');
    } finally {
      setRunning(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Soft delete this report?')) return;
    const res = await fetch(`/api/history/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) {
      setHistory((h) => h.filter((x) => x.id !== id));
      if (latest?.id === id) setLatest(null);
    }
  }

  const payload = latest?.payload;
  const intradayPlan = payload?.intradayPlan ?? [];
  const plan = payload?.tomorrowPlan ?? [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <p className="text-[#8b949e] font-mono">Loading...</p>
      </div>
    );
  }

  const trending = payload?.trendingStrong ?? [];
  const picks = payload?.picks ?? { week: [], month: [], year: [] };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      <header className="border-b border-[#30363d] px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-[#22c55e] font-mono">
          PRIVATE STOCK RADAR
        </h1>
        <div className="flex items-center gap-4">
          <Link
            href="/notes"
            className="text-sm text-[#8b949e] hover:text-[#22c55e] font-mono lg:hidden"
          >
            Notes
          </Link>
          <button
            onClick={handleRunWrap}
            disabled={running}
            className="px-3 py-1.5 bg-[#22c55e] text-[#0d1117] font-mono text-sm font-semibold rounded hover:bg-[#16a34a] disabled:opacity-50"
          >
            {running ? 'Đang chạy...' : 'Run'}
          </button>
          <a
            href="/api/auth/logout"
            className="text-sm text-[#8b949e] hover:text-[#22c55e] font-mono"
          >
            Sign out
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {!latest ? (
          <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-8 text-center">
            <p className="text-[#8b949e] font-mono">No report yet. Cron will generate one after market close.</p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <section>
              <h2 className="text-lg font-semibold text-[#22c55e] mb-3 font-mono">
                Latest · {latest.report_date}
              </h2>
              <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
                <p className="text-[#8b949e] text-sm font-mono mb-2">
                  Regime: <span className="text-[#22c55e]">{payload?.regime ?? '—'}</span>
                </p>
                <ul className="list-disc list-inside text-sm font-mono text-[#c9d1d9] space-y-1">
                  {payload?.summary5?.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Intraday Plan (1–2 days) — Top 3 */}
            {intradayPlan.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-[#22c55e] mb-3 font-mono">
                  INTRADAY (1–2 days) — Top 3
                </h2>
                <div className="space-y-4">
                  {intradayPlan.map((p, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5"
                    >
                      <h3 className="text-[#22c55e] font-mono font-bold text-lg mb-3">
                        {p.ticker}
                      </h3>
                      <div className="grid grid-cols-3 gap-4 mb-3 font-mono text-sm">
                        <div>
                          <span className="text-[#8b949e]">Buy:</span>{' '}
                          {formatPrice(p.entry)}
                        </div>
                        <div>
                          <span className="text-[#8b949e]">Sell:</span>{' '}
                          {formatPrice(p.sellTarget)}
                        </div>
                        <div>
                          <span className="text-[#8b949e]">Stop:</span>{' '}
                          {formatPrice(p.stopLoss)}
                        </div>
                      </div>
                      <p className="text-[#8b949e] text-sm font-mono mb-2">
                        Hold: {p.hold} · R/R: {p.rr} · Confidence: {p.confidence}
                      </p>
                      <ul className="list-disc list-inside text-sm text-[#c9d1d9] mb-1">
                        {p.why.map((w, j) => (
                          <li key={j}>{w}</li>
                        ))}
                      </ul>
                      {p.riskFlags.length > 0 && (
                        <p className="text-amber-400 text-sm font-mono mt-2">
                          Risk: {p.riskFlags.join(' · ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tomorrow Plan */}
            <section>
              <h2 className="text-lg font-semibold text-[#22c55e] mb-3 font-mono">
                Tomorrow Plan (Top 5)
              </h2>
              <div className="space-y-4">
                {plan.map((p, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-[#30363d] bg-[#161b22] p-5"
                  >
                    <h3 className="text-[#22c55e] font-mono font-bold text-lg mb-3">
                      {p.ticker}
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-3 font-mono text-sm">
                      <div>
                        <span className="text-[#8b949e]">Buy:</span>{' '}
                        {formatPrice(p.entryZone.low)}–{formatPrice(p.entryZone.high)}
                      </div>
                      <div>
                        <span className="text-[#8b949e]">Sell:</span>{' '}
                        {formatPrice(p.sellTarget)}
                      </div>
                      <div>
                        <span className="text-[#8b949e]">Stop:</span>{' '}
                        {formatPrice(p.stopLoss)}
                      </div>
                    </div>
                    <p className="text-[#8b949e] text-sm font-mono mb-2">
                      Hold: {p.hold} · Confidence: {p.confidence}
                      {p.tpDetail && (
                        <> · TP1: {formatPrice(p.tpDetail.tp1 ?? 0)} · TP2: {formatPrice(p.tpDetail.tp2 ?? 0)}</>
                      )}
                    </p>
                    <ul className="list-disc list-inside text-sm text-[#c9d1d9] mb-1">
                      {p.why.map((w, j) => (
                        <li key={j}>{w}</li>
                      ))}
                    </ul>
                    {p.riskFlags.length > 0 && (
                      <p className="text-amber-400 text-sm font-mono">
                        Risk: {p.riskFlags.join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Trending / Strong */}
            <section>
              <h2 className="text-lg font-semibold text-[#22c55e] mb-3 font-mono">
                Trending / Strong
              </h2>
              <div className="rounded-lg border border-[#30363d] bg-[#161b22] overflow-hidden">
                <table className="w-full font-mono text-sm">
                  <thead>
                    <tr className="border-b border-[#30363d] text-left">
                      <th className="p-3 text-[#8b949e]">Ticker</th>
                      <th className="p-3 text-[#8b949e]">Setup</th>
                      <th className="p-3 text-[#8b949e]">Price</th>
                      <th className="p-3 text-[#8b949e]">Chg %</th>
                      <th className="p-3 text-[#8b949e]">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trending.map((t, i) => (
                      <tr key={i} className="border-b border-[#30363d]/50">
                        <td className="p-3 text-[#22c55e]">{t.ticker}</td>
                        <td className="p-3">{t.setup}</td>
                        <td className="p-3 font-mono-num">{formatPrice(t.price)}</td>
                        <td className="p-3 font-mono-num text-[#22c55e]">
                          {t.changePercent >= 0 ? '+' : ''}{t.changePercent.toFixed(2)}%
                        </td>
                        <td className="p-3 text-[#8b949e]">{t.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Picks */}
            <section>
              <h2 className="text-lg font-semibold text-[#22c55e] mb-3 font-mono">
                Weekly / Monthly / Year Picks
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
                  <h3 className="text-[#8b949e] text-sm mb-2 font-mono">Week</h3>
                  <p className="font-mono text-[#22c55e]">{picks.week.join(', ') || '—'}</p>
                </div>
                <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
                  <h3 className="text-[#8b949e] text-sm mb-2 font-mono">Month</h3>
                  <p className="font-mono text-[#22c55e]">{picks.month.join(', ') || '—'}</p>
                </div>
                <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
                  <h3 className="text-[#8b949e] text-sm mb-2 font-mono">Year</h3>
                  <p className="font-mono text-[#22c55e]">{picks.year.join(', ') || '—'}</p>
                </div>
              </div>
            </section>

            {/* News shocks */}
            {payload?.newsShocks?.length ? (
              <section>
                <h2 className="text-lg font-semibold text-[#22c55e] mb-3 font-mono">
                  News Shocks
                </h2>
                <ul className="list-disc list-inside text-sm text-[#8b949e] space-y-1 font-mono">
                  {payload.newsShocks.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        )}

        {/* History Grid */}
        <section>
          <h2 className="text-lg font-semibold text-[#22c55e] mb-3 font-mono">
            History (14 days)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {history.slice(0, 14).map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-[#30363d] bg-[#161b22] p-4 hover:border-[#22c55e]/50 transition-colors"
              >
                <p className="font-mono text-[#22c55e] font-semibold">{r.report_date}</p>
                <p className="text-[#8b949e] text-sm font-mono mt-1">
                  {r.payload?.regime ?? '—'}
                </p>
                <p className="text-[#c9d1d9] text-sm font-mono truncate mt-1">
                  #{1}: {r.payload?.tomorrowPlan?.[0]?.ticker ?? '—'}
                </p>
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/dashboard/report/${r.report_date}`}
                    className="text-xs text-[#22c55e] hover:underline font-mono"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="text-xs text-red-400 hover:underline font-mono"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
