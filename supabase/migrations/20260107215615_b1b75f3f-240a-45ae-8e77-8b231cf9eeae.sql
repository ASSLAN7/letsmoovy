-- Enable btree_gist extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add exclusion constraint to prevent overlapping bookings for the same vehicle
ALTER TABLE public.bookings 
ADD CONSTRAINT no_booking_overlap 
EXCLUDE USING gist (
  vehicle_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status IN ('confirmed', 'active'));

-- Create atomic booking function that checks and inserts in one transaction
CREATE OR REPLACE FUNCTION public.book_vehicle_atomic(
  p_user_id UUID,
  p_vehicle_id INTEGER,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_vehicle_name TEXT,
  p_vehicle_category TEXT,
  p_pickup_address TEXT,
  p_price_per_minute NUMERIC,
  p_total_price NUMERIC
) RETURNS UUID AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Lock the vehicle row to prevent concurrent bookings
  PERFORM 1 FROM public.vehicles WHERE id = p_vehicle_id FOR UPDATE;
  
  -- Check if vehicle exists and is available
  IF NOT EXISTS (SELECT 1 FROM public.vehicles WHERE id = p_vehicle_id AND available = true) THEN
    RAISE EXCEPTION 'vehicle_not_available' USING HINT = 'Das Fahrzeug ist nicht verfügbar.';
  END IF;
  
  -- Check for overlapping bookings
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE vehicle_id = p_vehicle_id
    AND status IN ('confirmed', 'active')
    AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time)
  ) THEN
    RAISE EXCEPTION 'time_slot_taken' USING HINT = 'Dieser Zeitraum wurde bereits gebucht.';
  END IF;
  
  -- Insert the booking atomically
  INSERT INTO public.bookings (
    user_id,
    vehicle_id,
    start_time,
    end_time,
    vehicle_name,
    vehicle_category,
    pickup_address,
    price_per_minute,
    total_price,
    status
  ) VALUES (
    p_user_id,
    p_vehicle_id,
    p_start_time,
    p_end_time,
    p_vehicle_name,
    p_vehicle_category,
    p_pickup_address,
    p_price_per_minute,
    p_total_price,
    'confirmed'
  ) RETURNING id INTO v_booking_id;
  
  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;