-- Verstärke die RLS-Policies für chat_messages und chat_conversations
-- Entferne bestehende Policies und erstelle neue mit expliziter TO authenticated Klausel

-- === CHAT_MESSAGES ===
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can send messages" ON public.chat_messages;

-- Benutzer können Nachrichten in ihren Konversationen sehen (nur authentifiziert)
CREATE POLICY "Authenticated users can view messages in their conversations"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM chat_conversations
  WHERE chat_conversations.id = chat_messages.conversation_id
  AND chat_conversations.user_id = auth.uid()
));

-- Benutzer können Nachrichten in ihren Konversationen senden (nur authentifiziert)
CREATE POLICY "Authenticated users can send messages in their conversations"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  sender_type = 'user'
  AND sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id
    AND chat_conversations.user_id = auth.uid()
  )
);

-- Admins können alle Nachrichten sehen (nur authentifiziert)
CREATE POLICY "Authenticated admins can view all messages"
ON public.chat_messages
FOR SELECT
TO authenticated
USING (is_admin());

-- Admins können Nachrichten senden (nur authentifiziert)
CREATE POLICY "Authenticated admins can send messages"
ON public.chat_messages
FOR INSERT
TO authenticated
WITH CHECK (sender_type = 'agent' AND is_admin());

-- === CHAT_CONVERSATIONS ===
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can update all conversations" ON public.chat_conversations;

-- Benutzer können ihre eigenen Konversationen sehen (nur authentifiziert)
CREATE POLICY "Authenticated users can view their own conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Benutzer können ihre eigenen Konversationen erstellen (nur authentifiziert)
CREATE POLICY "Authenticated users can create their own conversations"
ON public.chat_conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins können alle Konversationen sehen (nur authentifiziert)
CREATE POLICY "Authenticated admins can view all conversations"
ON public.chat_conversations
FOR SELECT
TO authenticated
USING (is_admin());

-- Admins können alle Konversationen aktualisieren (nur authentifiziert)
CREATE POLICY "Authenticated admins can update all conversations"
ON public.chat_conversations
FOR UPDATE
TO authenticated
USING (is_admin());