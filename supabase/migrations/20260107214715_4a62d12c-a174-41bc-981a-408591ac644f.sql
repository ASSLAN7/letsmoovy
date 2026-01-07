-- Verstärke die RLS-Policies für vehicle_unlock_logs
-- Entferne bestehende Policies und erstelle neue mit expliziter TO authenticated Klausel

-- Lösche bestehende Policies
DROP POLICY IF EXISTS "Users can view their own unlock logs" ON public.vehicle_unlock_logs;
DROP POLICY IF EXISTS "Users can insert their own unlock logs" ON public.vehicle_unlock_logs;
DROP POLICY IF EXISTS "Admins can view all unlock logs" ON public.vehicle_unlock_logs;

-- Erstelle neue Policies mit expliziter TO authenticated Klausel

-- Benutzer können ihre eigenen Unlock-Logs sehen (nur authentifiziert)
CREATE POLICY "Authenticated users can view their own unlock logs"
ON public.vehicle_unlock_logs
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = vehicle_unlock_logs.booking_id
  AND bookings.user_id = auth.uid()
));

-- Benutzer können ihre eigenen Unlock-Logs erstellen (nur authentifiziert)
CREATE POLICY "Authenticated users can insert their own unlock logs"
ON public.vehicle_unlock_logs
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = vehicle_unlock_logs.booking_id
    AND bookings.user_id = auth.uid()
  )
);

-- Admins können alle Unlock-Logs sehen (nur authentifiziert)
CREATE POLICY "Authenticated admins can view all unlock logs"
ON public.vehicle_unlock_logs
FOR SELECT
TO authenticated
USING (is_admin());

-- === Zusätzlich: Verstärke booking_photos ===
DROP POLICY IF EXISTS "Users can view their own booking photos" ON public.booking_photos;
DROP POLICY IF EXISTS "Users can upload photos for their own bookings" ON public.booking_photos;
DROP POLICY IF EXISTS "Admins can view all booking photos" ON public.booking_photos;
DROP POLICY IF EXISTS "Admins can delete booking photos" ON public.booking_photos;

-- Benutzer können ihre eigenen Buchungsfotos sehen (nur authentifiziert)
CREATE POLICY "Authenticated users can view their own booking photos"
ON public.booking_photos
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = booking_photos.booking_id
  AND bookings.user_id = auth.uid()
));

-- Benutzer können Fotos für ihre eigenen Buchungen hochladen (nur authentifiziert)
CREATE POLICY "Authenticated users can upload photos for their own bookings"
ON public.booking_photos
FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM bookings
  WHERE bookings.id = booking_photos.booking_id
  AND bookings.user_id = auth.uid()
));

-- Admins können alle Buchungsfotos sehen (nur authentifiziert)
CREATE POLICY "Authenticated admins can view all booking photos"
ON public.booking_photos
FOR SELECT
TO authenticated
USING (is_admin());

-- Admins können Buchungsfotos löschen (nur authentifiziert)
CREATE POLICY "Authenticated admins can delete booking photos"
ON public.booking_photos
FOR DELETE
TO authenticated
USING (is_admin());

-- === Zusätzlich: Verstärke vehicle_reviews ===
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Users can create reviews for their bookings" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.vehicle_reviews;
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.vehicle_reviews;

-- Authentifizierte Benutzer können alle Bewertungen sehen
CREATE POLICY "Authenticated users can view all reviews"
ON public.vehicle_reviews
FOR SELECT
TO authenticated
USING (true);

-- Benutzer können Bewertungen für ihre abgeschlossenen Buchungen erstellen (nur authentifiziert)
CREATE POLICY "Authenticated users can create reviews for their bookings"
ON public.vehicle_reviews
FOR INSERT
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

-- Benutzer können ihre eigenen Bewertungen aktualisieren (nur authentifiziert)
CREATE POLICY "Authenticated users can update their own reviews"
ON public.vehicle_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Benutzer können ihre eigenen Bewertungen löschen (nur authentifiziert)
CREATE POLICY "Authenticated users can delete their own reviews"
ON public.vehicle_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins können alle Bewertungen verwalten (nur authentifiziert)
CREATE POLICY "Authenticated admins can manage all reviews"
ON public.vehicle_reviews
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- === Zusätzlich: Verstärke user_roles ===
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Benutzer können ihre eigenen Rollen sehen (nur authentifiziert)
CREATE POLICY "Authenticated users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins können alle Rollen sehen (nur authentifiziert)
CREATE POLICY "Authenticated admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_admin());

-- Admins können Rollen verwalten (nur authentifiziert)
CREATE POLICY "Authenticated admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- === Zusätzlich: Verstärke support_templates ===
DROP POLICY IF EXISTS "Admins can view all templates" ON public.support_templates;
DROP POLICY IF EXISTS "Admins can create templates" ON public.support_templates;
DROP POLICY IF EXISTS "Admins can update templates" ON public.support_templates;
DROP POLICY IF EXISTS "Admins can delete templates" ON public.support_templates;

-- Admins können alle Templates sehen (nur authentifiziert)
CREATE POLICY "Authenticated admins can view all templates"
ON public.support_templates
FOR SELECT
TO authenticated
USING (is_admin());

-- Admins können Templates erstellen (nur authentifiziert)
CREATE POLICY "Authenticated admins can create templates"
ON public.support_templates
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Admins können Templates aktualisieren (nur authentifiziert)
CREATE POLICY "Authenticated admins can update templates"
ON public.support_templates
FOR UPDATE
TO authenticated
USING (is_admin());

-- Admins können Templates löschen (nur authentifiziert)
CREATE POLICY "Authenticated admins can delete templates"
ON public.support_templates
FOR DELETE
TO authenticated
USING (is_admin());