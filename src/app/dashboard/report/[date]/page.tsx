import { redirect } from 'next/navigation';
import { hasAuth } from '@/lib/simpleAuth';
import { supabaseAdmin } from '@/lib/supabase';
import ReportDetailClient from './ReportDetailClient';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  if (!(await hasAuth())) redirect('/login');

  const { date } = await params;

  let data = null;
  const { data: row } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('type', 'daily')
    .eq('report_date', date)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (row) data = row;

  return <ReportDetailClient date={date} report={data} />;
}
