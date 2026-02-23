-- Run this in Supabase SQL Editor to create the reports table

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  report_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  asof timestamptz NOT NULL,
  payload jsonb NOT NULL,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_status_deleted ON reports(status) WHERE deleted_at IS NULL;
