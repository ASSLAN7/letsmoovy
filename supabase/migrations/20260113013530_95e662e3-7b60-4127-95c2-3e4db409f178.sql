-- =============================================
-- booking_photos: Add TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Admins can delete booking photos" ON public.booking_photos;
DROP POLICY IF EXISTS "Admins can view all booking photos" ON public.booking_photos;
DROP POLICY IF EXISTS "Users can upload photos for their own bookings" ON public.booking_photos;
DROP POLICY IF EXISTS "Users can view their own booking photos" ON public.booking_photos;

CREATE POLICY "Admins can delete booking photos" 
ON public.booking_photos FOR DELETE TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view all booking photos" 
ON public.booking_photos FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Users can upload photos for their own bookings" 
ON public.booking_photos FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_photos.booking_id AND bookings.user_id = auth.uid()));

CREATE POLICY "Users can view their own booking photos" 
ON public.booking_photos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_photos.booking_id AND bookings.user_id = auth.uid()));

-- =============================================
-- chat_conversations: Add TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Admins can update all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.chat_conversations;

CREATE POLICY "Admins can update all conversations" 
ON public.chat_conversations FOR UPDATE TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view all conversations" 
ON public.chat_conversations FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Users can create their own conversations" 
ON public.chat_conversations FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own conversations" 
ON public.chat_conversations FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- chat_messages: Add TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Admins can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.chat_messages;

CREATE POLICY "Admins can send messages" 
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (sender_type = 'agent' AND is_admin());

CREATE POLICY "Admins can view all messages" 
ON public.chat_messages FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Users can send messages in their conversations" 
ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (sender_type = 'user' AND sender_id = auth.uid() AND EXISTS (SELECT 1 FROM chat_conversations WHERE chat_conversations.id = chat_messages.conversation_id AND chat_conversations.user_id = auth.uid()));

CREATE POLICY "Users can view messages in their conversations" 
ON public.chat_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM chat_conversations WHERE chat_conversations.id = chat_messages.conversation_id AND chat_conversations.user_id = auth.uid()));

-- =============================================
-- support_templates: Add TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Admins can create templates" ON public.support_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.support_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.support_templates;
DROP POLICY IF EXISTS "Admins can view all templates" ON public.support_templates;

CREATE POLICY "Admins can create templates" 
ON public.support_templates FOR INSERT TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete templates" 
ON public.support_templates FOR DELETE TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update templates" 
ON public.support_templates FOR UPDATE TO authenticated
USING (is_admin());

CREATE POLICY "Admins can view all templates" 
ON public.support_templates FOR SELECT TO authenticated
USING (is_admin());

-- =============================================
-- user_roles: Add TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" 
ON public.user_roles FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- vehicle_reviews: Add TO authenticated (except public view)
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.vehicle_reviews;

CREATE POLICY "Admins can manage all reviews" 
ON public.vehicle_reviews FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Public read access for reviews (intentionally allows anonymous)
CREATE POLICY "Anyone can view reviews" 
ON public.vehicle_reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for their bookings" 
ON public.vehicle_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = vehicle_reviews.booking_id AND bookings.user_id = auth.uid() AND bookings.status = 'completed'));

CREATE POLICY "Users can delete their own reviews" 
ON public.vehicle_reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.vehicle_reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

-- =============================================
-- vehicle_unlock_logs: Add TO authenticated
-- =============================================
DROP POLICY IF EXISTS "Admins can view all unlock logs" ON public.vehicle_unlock_logs;
DROP POLICY IF EXISTS "Users can insert their own unlock logs" ON public.vehicle_unlock_logs;
DROP POLICY IF EXISTS "Users can view their own unlock logs" ON public.vehicle_unlock_logs;

CREATE POLICY "Admins can view all unlock logs" 
ON public.vehicle_unlock_logs FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Users can insert their own unlock logs" 
ON public.vehicle_unlock_logs FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM bookings WHERE bookings.id = vehicle_unlock_logs.booking_id AND bookings.user_id = auth.uid()));

CREATE POLICY "Users can view their own unlock logs" 
ON public.vehicle_unlock_logs FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM bookings WHERE bookings.id = vehicle_unlock_logs.booking_id AND bookings.user_id = auth.uid()));

-- =============================================
-- vehicles: Add TO authenticated (except public view)
-- =============================================
DROP POLICY IF EXISTS "Admins can manage vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Anyone can view vehicles" ON public.vehicles;

CREATE POLICY "Admins can manage vehicles" 
ON public.vehicles FOR ALL TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Public read access for vehicles (intentionally allows anonymous)
CREATE POLICY "Anyone can view vehicles" 
ON public.vehicles FOR SELECT
USING (true);