import { NextResponse } from 'next/server';
import { hasAuth } from '@/lib/simpleAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { runDailyWrap } from '@/lib/wrapEngine';
import { getTargetReportDate, getTodayPtDate } from '@/lib/ptDate';

/** Allow up to 60s for wrap (market/news API calls). Vercel Hobby: max 60s, Pro: up to 300s. */
export const maxDuration = 60;

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return !!(url && key && !url.includes('placeholder') && key !== 'placeholder');
}

export async function POST(req: Request) {
  if (!(await hasAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let reportDate: string;
  let quick = false;
  try {
    const body = await req.json().catch(() => ({}));
    const target = body?.target === 'today' ? 'today' : 'tomorrow';
    reportDate = target === 'today' ? getTodayPtDate() : getTargetReportDate();
    quick = body?.quick === true;
  } catch {
    reportDate = getTargetReportDate();
  }

  const supabaseOk = isSupabaseConfigured();

  try {
    const payload = await runDailyWrap(reportDate, quick);

    if (!supabaseOk) {
      const isDemo = payload.summary5?.[0]?.includes('(demo)');
      return NextResponse.json({
        ok: true,
        dryRun: true,
        report_date: reportDate,
        summary: payload.summary5,
        payload,
        message: isDemo
          ? 'Đã tạo demo report. Thêm POLYGON_API_KEY hoặc FINNHUB_API_KEY vào .env.local để lấy data thật.'
          : 'Wrap chạy thành công (dry run). Để lưu: cấu hình Supabase và chạy supabase-migration.sql',
      });
    }

    const { data: existing } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('type', 'daily')
      .eq('report_date', reportDate)
      .is('deleted_at', null)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        report_date: reportDate,
        message: 'Report đã tồn tại cho ngày này (đã locked)',
      });
    }

    const { error } = await supabaseAdmin.from('reports').insert({
      type: 'daily',
      report_date: reportDate,
      status: 'locked',
      asof: new Date().toISOString(),
      payload,
    });

    if (error) {
      console.error('Run wrap insert error:', error);
      const msg = error.message.includes('relation')
        ? 'Chưa tạo bảng reports trong Supabase. Chạy supabase-migration.sql'
        : error.message;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      report_date: reportDate,
      summary: payload.summary5,
    });
  } catch (e) {
    console.error('Run wrap error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
