-- Function to check if a vehicle is available for a given time range
CREATE OR REPLACE FUNCTION public.check_vehicle_availability(
  p_vehicle_id INTEGER,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE vehicle_id = p_vehicle_id
      AND status IN ('confirmed', 'active')
      AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
      AND (
        (p_start_time >= start_time AND p_start_time < end_time)
        OR (p_end_time > start_time AND p_end_time <= end_time)
        OR (p_start_time <= start_time AND p_end_time >= end_time)
      )
  );
END;
$$;

-- Function to get overlapping bookings for a vehicle
CREATE OR REPLACE FUNCTION public.get_vehicle_bookings(
  p_vehicle_id INTEGER,
  p_from_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
  id UUID,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT b.id, b.start_time, b.end_time, b.status
  FROM public.bookings b
  WHERE b.vehicle_id = p_vehicle_id
    AND b.status IN ('confirmed', 'active')
    AND b.end_time >= p_from_date
  ORDER BY b.start_time;
END;
$$;

-- Enable realtime for bookings table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;