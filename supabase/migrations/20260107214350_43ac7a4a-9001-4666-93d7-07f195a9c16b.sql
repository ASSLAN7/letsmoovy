-- Verstärke die RLS-Policies für die bookings-Tabelle
-- Entferne bestehende Policies und erstelle neue mit expliziter TO authenticated Klausel

-- Lösche bestehende Policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON public.bookings;

-- Erstelle neue Policies mit expliziter TO authenticated Klausel

-- Benutzer können ihre eigenen Buchungen sehen (nur authentifiziert)
CREATE POLICY "Authenticated users can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Benutzer können ihre eigenen Buchungen erstellen (nur authentifiziert)
CREATE POLICY "Authenticated users can create their own bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Benutzer können ihre eigenen Buchungen aktualisieren (nur authentifiziert)
CREATE POLICY "Authenticated users can update their own bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Benutzer können ihre eigenen Buchungen löschen (nur authentifiziert)
CREATE POLICY "Authenticated users can delete their own bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins können alle Buchungen sehen (nur authentifiziert)
CREATE POLICY "Authenticated admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (is_admin());

-- Admins können alle Buchungen aktualisieren (nur authentifiziert)
CREATE POLICY "Authenticated admins can update all bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (is_admin());

-- Admins können alle Buchungen löschen (nur authentifiziert)
CREATE POLICY "Authenticated admins can delete all bookings"
ON public.bookings
FOR DELETE
TO authenticated
USING (is_admin());