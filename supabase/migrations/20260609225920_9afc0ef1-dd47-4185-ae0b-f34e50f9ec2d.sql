DROP POLICY IF EXISTS "Send to connected users" ON public.messages;
CREATE POLICY "Authenticated can send messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = sender_id);