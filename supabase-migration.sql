-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  report_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  asof timestamptz NOT NULL,
  payload jsonb NOT NULL,
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- If table already has UNIQUE(type, report_date), drop it to allow re-create after soft-delete:
-- ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_type_report_date_key;

CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_status_deleted ON reports(status) WHERE deleted_at IS NULL;

-- Partial unique index: one active (non-deleted) report per type+date
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_type_date ON reports(type, report_date) WHERE deleted_at IS NULL;