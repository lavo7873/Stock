'use client';

import Link from 'next/link';
import type { ReportPayload } from '@/lib/types';

interface ReportDetailClientProps {
  date: string;
  report: { payload: ReportPayload } | null;
}

function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function ReportDetailClient({ date, report }: ReportDetailClientProps) {
  if (!report?.payload) {
    return (
      <div className="min-h-screen bg-[#0d1117] p-6">
        <Link href="/dashboard" className="text-[#22c55e] font-mono text-sm hover:underline">
          ← Dashboard
        </Link>
        <p className="mt-8 text-[#8b949e] font-mono">Report not found.</p>
      </div>
    );
  }

  const p = report.payload;
  const plan = p.tomorrowPlan ?? [];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9]">
      <header className="border-b border-[#30363d] px-6 py-4">
        <Link href="/dashboard" className="text-[#22c55e] font-mono text-sm hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-xl font-bold text-[#22c55e] font-mono mt-2">
          Report · {date}
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        <div className="rounded-lg border border-[#30363d] bg-[#161b22] p-4">
          <p className="text-[#8b949e] font-mono mb-2">Regime: <span className="text-[#22c55e]">{p.regime}</span></p>
          <ul className="list-disc list-inside text-sm font-mono space-y-1">
            {p.summary5?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>

        <section>
          <h2 className="text-lg font-semibold text-[#22c55e] mb-4 font-mono">
            Tomorrow Plan (Full Detail)
          </h2>
          <div className="space-y-6">
            {plan.map((item, i) => (
              <div
                key={i}
                className="rounded-lg border border-[#30363d] bg-[#161b22] p-6"
              >
                <h3 className="text-[#22c55e] font-mono font-bold text-xl mb-4">
                  {item.ticker}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-sm mb-4">
                  <div><span className="text-[#8b949e]">Buy:</span> {formatPrice(item.entryZone.low)}–{formatPrice(item.entryZone.high)}</div>
                  <div><span className="text-[#8b949e]">Sell:</span> {formatPrice(item.sellTarget)}</div>
                  <div><span className="text-[#8b949e]">Stop:</span> {formatPrice(item.stopLoss)}</div>
                  <div><span className="text-[#8b949e]">Hold:</span> {item.hold}</div>
                </div>
                {item.tpDetail && (
                  <p className="text-[#8b949e] text-sm font-mono mb-2">
                    TP1: {formatPrice(item.tpDetail.tp1 ?? 0)} · TP2: {formatPrice(item.tpDetail.tp2 ?? 0)}
                  </p>
                )}
                <p className="text-[#8b949e] text-sm font-mono mb-2">Confidence: {item.confidence}</p>
                <ul className="list-disc list-inside text-sm mb-2">
                  {item.why.map((w, j) => (
                    <li key={j}>{w}</li>
                  ))}
                </ul>
                {item.riskFlags.length > 0 && (
                  <p className="text-amber-400 text-sm font-mono">
                    Risk: {item.riskFlags.join(' · ')}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
