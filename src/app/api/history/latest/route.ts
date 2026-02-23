import { NextResponse } from 'next/server';
import { hasAuth } from '@/lib/simpleAuth';
import { supabaseAdmin } from '@/lib/supabase';

const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return !!url && !url.includes('placeholder');
};

export async function GET() {
  if (!(await hasAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json(null);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('type', 'daily')
      .eq('status', 'locked')
      .is('deleted_at', null)
      .order('report_date', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? null);
  } catch (e) {
    console.error('History latest error:', e);
    return NextResponse.json(null);
  }
}
