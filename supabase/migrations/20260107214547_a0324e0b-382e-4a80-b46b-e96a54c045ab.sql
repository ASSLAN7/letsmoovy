-- Verstärke die RLS-Policies für die vehicles-Tabelle
-- Nur authentifizierte Benutzer können Fahrzeuge sehen

-- Lösche bestehende Policies
DROP POLICY IF EXISTS "Anyone can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Admins can manage vehicles" ON public.vehicles;

-- Erstelle neue Policies mit expliziter TO authenticated Klausel

-- Authentifizierte Benutzer können alle Fahrzeuge sehen
CREATE POLICY "Authenticated users can view vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (true);

-- Admins können Fahrzeuge vollständig verwalten (nur authentifiziert)
CREATE POLICY "Authenticated admins can manage vehicles"
ON public.vehicles
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());