import { NextResponse } from 'next/server';
import { getTargetReportDate, isInWrapWindow } from '@/lib/ptDate';
import { runWrapDaily } from '@/lib/runWrapDaily';

function checkAuth(req: Request): boolean {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET) return false;
  const header = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
  const query = new URL(req.url).searchParams.get('secret');
  return header === CRON_SECRET || query === CRON_SECRET;
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const inWindow = isInWrapWindow();
  const ptDate = getTargetReportDate();

  if (!inWindow) {
    return NextResponse.json({
      ok: true,
      ran: false,
      skipped: true,
      reason: 'outside_window',
      inWindow: false,
      ptDate,
    });
  }

  try {
    const result = await runWrapDaily(ptDate);
    return NextResponse.json({
      ok: true,
      ran: true,
      ptDate,
      inWindow: true,
      inserted: result.inserted,
      skipped: result.skipped,
      ...(result.reason && { reason: result.reason }),
    });
  } catch (e) {
    console.error('Wrap error:', e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}