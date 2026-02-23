import { NextResponse } from 'next/server';
import { hasAuth } from '@/lib/simpleAuth';
import { supabaseAdmin } from '@/lib/supabase';

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return !!url && !url.includes('placeholder');
};

export async function GET(req: Request) {
  if (!(await hasAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json([]);
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get('range') ?? '30d';
  const days = range === '14d' ? 14 : range === '30d' ? 30 : 14;

  const from = new Date();
  from.setDate(from.getDate() - days);

  try {
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('id, type, report_date, status, asof, payload, created_at')
      .eq('type', 'daily')
      .eq('status', 'locked')
      .is('deleted_at', null)
      .gte('report_date', from.toISOString().slice(0, 10))
      .order('report_date', { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data ?? []);
  } catch (e) {
    console.error('History error:', e);
    return NextResponse.json([]);
  }
}
