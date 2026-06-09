
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(body) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (sender_id <> recipient_id)
);

CREATE INDEX idx_messages_pair_created ON public.messages (
  LEAST(sender_id, recipient_id), GREATEST(sender_id, recipient_id), created_at DESC
);
CREATE INDEX idx_messages_recipient_unread ON public.messages (recipient_id) WHERE read_at IS NULL;
CREATE INDEX idx_messages_sender_created ON public.messages (sender_id, created_at DESC);
CREATE INDEX idx_messages_recipient_created ON public.messages (recipient_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Read messages where you're participant
CREATE POLICY "Participants read messages" ON public.messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Send a message only if you follow recipient OR recipient follows you
CREATE POLICY "Send to connected users" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.follows f
      WHERE (f.follower_id = auth.uid() AND f.following_id = recipient_id)
         OR (f.follower_id = recipient_id AND f.following_id = auth.uid())
    )
  );

-- Recipient can mark messages as read (update read_at only)
CREATE POLICY "Recipient marks read" ON public.messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
