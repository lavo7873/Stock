import { supabaseAdmin } from '@/lib/supabase';
import { runDailyWrap } from '@/lib/wrapEngine';

export interface RunWrapDailyResult {
  inserted: boolean;
  skipped: boolean;
  reason?: string;
  summary?: string[];
}

export async function runWrapDaily(ptDate: string): Promise<RunWrapDailyResult> {
  const { data: existing } = await supabaseAdmin
    .from('reports')
    .select('id')
    .eq('type', 'daily')
    .eq('report_date', ptDate)
    .eq('status', 'locked')
    .is('deleted_at', null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { inserted: false, skipped: true, reason: 'already_exists_locked' };
  }

  const payload = await runDailyWrap(ptDate);
  const { error } = await supabaseAdmin.from('reports').insert({
    type: 'daily',
    report_date: ptDate,
    status: 'locked',
    asof: new Date().toISOString(),
    payload,
  });

  if (error) {
    if (error.code === '23505') {
      return { inserted: false, skipped: true, reason: 'unique_conflict' };
    }
    throw new Error(error.message);
  }
  return { inserted: true, skipped: false, summary: payload.summary5 };
}