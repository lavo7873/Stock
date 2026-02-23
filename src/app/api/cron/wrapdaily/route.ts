import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { runDailyWrap } from '@/lib/wrapEngine';

function getPTDate(): string {
  const pt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  return pt.toISOString().slice(0, 10);
}

function isInWrapWindow(): boolean {
  const pt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const hours = pt.getHours();
  const mins = pt.getMinutes();
  const totalMins = hours * 60 + mins;
  // 1:05pm = 785, 1:25pm = 805
  return totalMins >= 785 && totalMins <= 805;
}

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
      reason: 'Outside wrap window (PT 1:05pm–1:25pm)',
    });
  }

  try {
    const ptDate = getPTDate();
    const payload = await runDailyWrap(ptDate);

    const { error } = await supabaseAdmin.from('reports').insert({
      type: 'daily',
      report_date: ptDate,
      status: 'locked',
      asof: new Date().toISOString(),
      payload,
    });

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      report_date: ptDate,
      summary: payload.summary5,
    });
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
  if (!isInWrapWindow()) {
    return NextResponse.json({ skipped: true, reason: 'Outside wrap window (PT 1:05pm–1:25pm)' });
  }
  try {
    const ptDate = getPTDate();
    const payload = await runDailyWrap(ptDate);
    const { error } = await supabaseAdmin.from('reports').insert({
      type: 'daily',
      report_date: ptDate,
      status: 'locked',
      asof: new Date().toISOString(),
      payload,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, report_date: ptDate, summary: payload.summary5 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
