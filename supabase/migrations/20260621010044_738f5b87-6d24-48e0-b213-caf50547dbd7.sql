-- 1. Hide sensitive profile columns from anon/authenticated PostgREST reads.
-- Server code uses service_role (supabaseAdmin) which retains full access via table-level GRANT ALL.
REVOKE SELECT (
  stripe_customer_id,
  stripe_subscription_id,
  stripe_connect_account_id,
  stripe_connect_charges_enabled,
  stripe_connect_payouts_enabled,
  purchased_avatars
) ON public.profiles FROM anon, authenticated;

-- 2. Restrict realtime channel subscriptions so a user can only listen to their own private channels.
-- Existing policy only covered 'notif-<uid>'. Extend coverage to messages and dock channels used by the app.
DROP POLICY IF EXISTS "Users can only access their own notif topic" ON realtime.messages;
DROP POLICY IF EXISTS "Users can only send to their own notif topic" ON realtime.messages;

CREATE POLICY "Users subscribe to own private channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    realtime.topic() = 'notif-' || (auth.uid())::text
    OR realtime.topic() = 'messages:' || (auth.uid())::text
    OR realtime.topic() = 'dock-msgs:' || (auth.uid())::text
    OR realtime.topic() = 'nav-msgs:' || (auth.uid())::text
    OR realtime.topic() LIKE 'window:' || (auth.uid())::text || ':%'
    OR realtime.topic() LIKE 'window:%:' || (auth.uid())::text
  );

CREATE POLICY "Users broadcast on own private channels"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    realtime.topic() = 'notif-' || (auth.uid())::text
    OR realtime.topic() = 'messages:' || (auth.uid())::text
    OR realtime.topic() = 'dock-msgs:' || (auth.uid())::text
    OR realtime.topic() = 'nav-msgs:' || (auth.uid())::text
    OR realtime.topic() LIKE 'window:' || (auth.uid())::text || ':%'
    OR realtime.topic() LIKE 'window:%:' || (auth.uid())::text
  );