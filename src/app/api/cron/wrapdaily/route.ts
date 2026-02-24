import { NextResponse } from 'next/server';
import { getTargetReportDate, isInWrapWindow } from '@/lib/ptDate';
import { runWrapDaily } from '@/lib/runWrapDaily';

function checkAuth(req: Request): boolean {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '');
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isInWrapWindow()) {
    return NextResponse.json({
      skipped: true,
      reason: 'Outside wrap window (PT 1:05pmâ€“1:25pm)',
    });
  }

  try {
    const ptDateStr = getTargetReportDate();
    const result = await runWrapDaily(ptDateStr);
    if (result.skipped) {
      return NextResponse.json({ skipped: true, reason: result.reason ?? 'already exists locked' });
    }
    return NextResponse.json({ ok: true, report_date: ptDateStr, summary: result.summary });
  } catch (e) {
    console.error('Wrap error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    inWindow: isInWrapWindow(),
    ptDate: getTargetReportDate(),
  });
}