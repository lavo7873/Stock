import { NextResponse } from 'next/server';
import { hasAuth } from '@/lib/simpleAuth';
import { supabaseAdmin } from '@/lib/supabase';
import { runDailyWrap } from '@/lib/wrapEngine';

function getTargetReportDate(): string {
  const pt = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const day = pt.getDay(); // 0=Sun, 6=Sat
  if (day === 0) {
    pt.setDate(pt.getDate() + 1);
  } else if (day === 6) {
    pt.setDate(pt.getDate() + 2);
  }
  return pt.toISOString().slice(0, 10);
}

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  return !!(url && key && !url.includes('placeholder') && key !== 'placeholder');
}

export async function POST() {
  if (!(await hasAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseOk = isSupabaseConfigured();

  try {
    const reportDate = getTargetReportDate();
    const payload = await runDailyWrap(reportDate);

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
