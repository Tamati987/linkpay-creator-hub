-- Enforce per-user topic authorization on Realtime
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only access their own notif topic" ON realtime.messages;
CREATE POLICY "Users can only access their own notif topic"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'notif-' || auth.uid()::text
);

DROP POLICY IF EXISTS "Users can only send to their own notif topic" ON realtime.messages;
CREATE POLICY "Users can only send to their own notif topic"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = 'notif-' || auth.uid()::text
);
