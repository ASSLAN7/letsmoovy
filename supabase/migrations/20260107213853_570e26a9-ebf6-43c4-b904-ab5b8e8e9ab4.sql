-- Verstärke die RLS-Policies für die profiles-Tabelle
-- Entferne bestehende Policies und erstelle neue mit expliziter Authentifizierungsprüfung

-- Lösche bestehende Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Erstelle neue PERMISSIVE Policies mit expliziter Authentifizierungsprüfung
-- Diese Policies erlauben nur authentifizierten Benutzern Zugriff

-- Benutzer können ihr eigenes Profil sehen (nur wenn authentifiziert)
CREATE POLICY "Authenticated users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Benutzer können ihr eigenes Profil erstellen (nur wenn authentifiziert)
CREATE POLICY "Authenticated users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Benutzer können ihr eigenes Profil aktualisieren (nur wenn authentifiziert)
CREATE POLICY "Authenticated users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Admins können alle Profile sehen (nur wenn authentifiziert und Admin)
CREATE POLICY "Authenticated admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin());