CREATE POLICY "Sender must be self" ON public.messages
AS RESTRICTIVE FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);