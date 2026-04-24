/*
  # direct_log — store external API JSON response

  The active Direct Enrollment Edge Function (enrollment-api-direct) writes
  audit rows to public.direct_log. The earlier careplus_log create migration
  (20260324120000) is preserved for history; this migration is the
  source-of-truth for direct_log going forward.

  Changes:
  - Create direct_log table IF NOT EXISTS (idempotent; mirrors the schema of
    the legacy careplus_log table so existing query habits keep working).
  - Add a nullable text `response` column that holds the JSON body returned
    from the external enrollment API (SUCCESS, MESSAGES, MEMBER.ID).
  - Enable RLS and grant service_role insert/select (idempotent).
  - Index created_at DESC for recent-rows queries.

  Notes:
  - `response` is nullable on purpose: pre-existing rows (if any) keep their
    state, and rows where the external API was never reached (network error,
    non-JSON response) legitimately have response = NULL.
  - Stored as `text` rather than `jsonb` so we preserve the exact bytes the
    upstream returned, even if the upstream emits non-conforming JSON. Cast
    at read time with `response::jsonb`.
*/

CREATE TABLE IF NOT EXISTS direct_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  log text NOT NULL DEFAULT '{}',
  request_payload text,
  payload_size_bytes integer,
  response text
);

ALTER TABLE direct_log
  ADD COLUMN IF NOT EXISTS response text;

ALTER TABLE direct_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'direct_log'
      AND policyname = 'service_role insert direct_log'
  ) THEN
    CREATE POLICY "service_role insert direct_log"
      ON direct_log
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'direct_log'
      AND policyname = 'service_role select direct_log'
  ) THEN
    CREATE POLICY "service_role select direct_log"
      ON direct_log
      FOR SELECT
      TO service_role
      USING (true);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_direct_log_created_at
  ON direct_log (created_at DESC);

COMMENT ON TABLE direct_log IS
  'Direct Enrollment API audit: outbound request payload and external API response, one row per submission';

COMMENT ON COLUMN direct_log.response IS
  'JSON string of external API response (SUCCESS, MESSAGES, etc.)';
