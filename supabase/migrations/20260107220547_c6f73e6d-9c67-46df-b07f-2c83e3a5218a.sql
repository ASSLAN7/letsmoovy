-- =====================================================
-- FIX ALL CRITICAL SECURITY VULNERABILITIES
-- Convert RESTRICTIVE policies to PERMISSIVE with explicit auth checks
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE - Fix policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated
USING (is_admin());

-- =====================================================
-- 2. BOOKINGS TABLE - Fix policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated users can delete their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated admins can delete all bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings" 
ON public.bookings FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON public.bookings FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings" 
ON public.bookings FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" 
ON public.bookings FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all bookings" 
ON public.bookings FOR UPDATE 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete all bookings" 
ON public.bookings FOR DELETE 
TO authenticated
USING (is_admin());

-- =====================================================
-- 3. CHAT_CONVERSATIONS TABLE - Fix policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated users can create their own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated admins can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Authenticated admins can update all conversations" ON public.chat_conversations;

CREATE POLICY "Users can view their own conversations" 
ON public.chat_conversations FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" 
ON public.chat_conversations FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversations" 
ON public.chat_conversations FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all conversations" 
ON public.chat_conversations FOR UPDATE 
TO authenticated
USING (is_admin());

-- =====================================================
-- 4. CHAT_MESSAGES TABLE - Fix policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages in their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated admins can view all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Authenticated admins can send messages" ON public.chat_messages;

CREATE POLICY "Users can view messages in their conversations" 
ON public.chat_messages FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM chat_conversations
  WHERE chat_conversations.id = chat_messages.conversation_id
  AND chat_conversations.user_id = auth.uid()
));

CREATE POLICY "Users can send messages in their conversations" 
ON public.chat_messages FOR INSERT 
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

CREATE POLICY "Admins can view all messages" 
ON public.chat_messages FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can send messages" 
ON public.chat_messages FOR INSERT 
TO authenticated
WITH CHECK (sender_type = 'agent' AND is_admin());

-- =====================================================
-- 5. VEHICLE_UNLOCK_LOGS TABLE - Fix policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view their own unlock logs" ON public.vehicle_unlock_logs;
DROP POLICY IF EXISTS "Authenticated users can insert their own unlock logs" ON public.vehicle_unlock_logs;
DROP POLICY IF EXISTS "Authenticated admins can view all unlock logs" ON public.vehicle_unlock_logs;

CREATE POLICY "Users can view their own unlock logs" 
ON public.vehicle_unlock_logs FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = vehicle_unlock_logs.booking_id
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own unlock logs" 
ON public.vehicle_unlock_logs FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = vehicle_unlock_logs.booking_id
    AND bookings.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all unlock logs" 
ON public.vehicle_unlock_logs FOR SELECT 
TO authenticated
USING (is_admin());

-- =====================================================
-- 6. BOOKING_PHOTOS TABLE - Fix policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view their own booking photos" ON public.booking_photos;
DROP POLICY IF EXISTS "Authenticated users can upload photos for their own bookings" ON public.booking_photos;
DROP POLICY IF EXISTS "Authenticated admins can view all booking photos" ON public.booking_photos;
DROP POLICY IF EXISTS "Authenticated admins can delete booking photos" ON public.booking_photos;

CREATE POLICY "Users can view their own booking photos" 
ON public.booking_photos FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = booking_photos.booking_id
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "Users can upload photos for their own bookings" 
ON public.booking_photos FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = booking_photos.booking_id
  AND bookings.user_id = auth.uid()
));

CREATE POLICY "Admins can view all booking photos" 
ON public.booking_photos FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete booking photos" 
ON public.booking_photos FOR DELETE 
TO authenticated
USING (is_admin());

-- =====================================================
-- 7. USER_ROLES TABLE - Fix policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" 
ON public.user_roles FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can manage roles" 
ON public.user_roles FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- 8. SUPPORT_TEMPLATES TABLE - Fix policies
-- =====================================================
DROP POLICY IF EXISTS "Authenticated admins can view all templates" ON public.support_templates;
DROP POLICY IF EXISTS "Authenticated admins can create templates" ON public.support_templates;
DROP POLICY IF EXISTS "Authenticated admins can update templates" ON public.support_templates;
DROP POLICY IF EXISTS "Authenticated admins can delete templates" ON public.support_templates;

CREATE POLICY "Admins can view all templates" 
ON public.support_templates FOR SELECT 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can create templates" 
ON public.support_templates FOR INSERT 
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins can update templates" 
ON public.support_templates FOR UPDATE 
TO authenticated
USING (is_admin());

CREATE POLICY "Admins can delete templates" 
ON public.support_templates FOR DELETE 
TO authenticated
USING (is_admin());

-- =====================================================
-- 9. VEHICLE_REVIEWS TABLE - Fix policies (already has public read)
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view all reviews" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Authenticated users can create reviews for their bookings" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Authenticated users can update their own reviews" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Authenticated users can delete their own reviews" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Authenticated admins can manage all reviews" ON public.vehicle_reviews;

-- Reviews can be publicly viewed (this is intentional for transparency)
CREATE POLICY "Anyone can view reviews" 
ON public.vehicle_reviews FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews for their bookings" 
ON public.vehicle_reviews FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = vehicle_reviews.booking_id
    AND bookings.user_id = auth.uid()
    AND bookings.status = 'completed'
  )
);

CREATE POLICY "Users can update their own reviews" 
ON public.vehicle_reviews FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
ON public.vehicle_reviews FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews" 
ON public.vehicle_reviews FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- =====================================================
-- 10. VEHICLES TABLE - Fix policies (public read is intentional)
-- =====================================================
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated admins can manage vehicles" ON public.vehicles;

-- Vehicles can be publicly viewed (needed for browsing without login)
CREATE POLICY "Anyone can view vehicles" 
ON public.vehicles FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage vehicles" 
ON public.vehicles FOR ALL 
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());