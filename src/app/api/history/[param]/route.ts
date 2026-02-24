import { NextResponse } from 'next/server';
import { hasAuth } from '@/lib/simpleAuth';
import { supabaseAdmin } from '@/lib/supabase';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: Request,
  { params }: { params: { param: string } }
) {
  if (!(await hasAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { param } = params;

  if (!DATE_REGEX.test(param)) {
    return NextResponse.json({ error: 'Invalid date format (use YYYY-MM-DD)' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('type', 'daily')
    .eq('report_date', param)
    .eq('status', 'locked')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { param: string } }
) {
  if (!(await hasAuth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { param } = await params;

  if (!UUID_REGEX.test(param)) {
    return NextResponse.json({ error: 'Invalid id format (use UUID)' }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from('reports')
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', param);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
