-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.is_admin());

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (public.is_admin());

-- Allow admins to update all bookings
CREATE POLICY "Admins can update all bookings"
ON public.bookings
FOR UPDATE
USING (public.is_admin());

-- Allow admins to delete all bookings
CREATE POLICY "Admins can delete all bookings"
ON public.bookings
FOR DELETE
USING (public.is_admin());

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

-- Create vehicles table for admin management
CREATE TABLE public.vehicles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_per_minute NUMERIC NOT NULL,
  seats INTEGER NOT NULL DEFAULT 4,
  range_km INTEGER NOT NULL DEFAULT 300,
  battery INTEGER NOT NULL DEFAULT 100,
  available BOOLEAN NOT NULL DEFAULT true,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  address TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Everyone can view vehicles
CREATE POLICY "Anyone can view vehicles"
ON public.vehicles
FOR SELECT
USING (true);

-- Only admins can manage vehicles
CREATE POLICY "Admins can manage vehicles"
ON public.vehicles
FOR ALL
USING (public.is_admin());

-- Trigger for updating vehicles updated_at
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample vehicles
INSERT INTO public.vehicles (name, category, price_per_minute, seats, range_km, battery, available, latitude, longitude, address, image_url)
VALUES 
  ('Tesla Model 3', 'Limousine', 0.35, 5, 450, 92, true, 52.5200, 13.4050, 'Alexanderplatz 1, Berlin', null),
  ('VW ID.4', 'SUV', 0.42, 5, 380, 85, true, 52.5170, 13.3889, 'Brandenburger Tor, Berlin', null),
  ('BMW i3', 'Kompakt', 0.28, 4, 260, 78, true, 52.5234, 13.4114, 'Fernsehturm, Berlin', null);