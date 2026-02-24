import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { runDailyWrap } from '@/lib/wrapEngine';
import { getTargetReportDate, isInWrapWindow } from '@/lib/ptDate';

function checkAuth(req: Request): boolean {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('authorization')?.replace('Bearer ', '');
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

async function doWrap(ptDateStr: string) {
  const { data: existing } = await supabaseAdmin
    .from('reports')
    .select('id')
    .eq('type', 'daily')
    .eq('report_date', ptDateStr)
    .eq('status', 'locked')
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { skipped: true, reason: 'already exists locked' };
  }

  const payload = await runDailyWrap(ptDateStr);
  const { error } = await supabaseAdmin.from('reports').insert({
    type: 'daily',
    report_date: ptDateStr,
    status: 'locked',
    asof: new Date().toISOString(),
    payload,
  });

  if (error) {
    if (error.code === '23505') {
      return { skipped: true, reason: 'already exists locked' };
    }
    throw new Error(error.message);
  }
  return { ok: true, report_date: ptDateStr, summary: payload.summary5 };
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
    const ptDateStr = getTargetReportDate();
    const result = await doWrap(ptDateStr);
    if ('skipped' in result) {
      return NextResponse.json(result);
    }
    return NextResponse.json(result);
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
