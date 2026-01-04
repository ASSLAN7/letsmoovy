-- Add vehicle lock state to bookings
ALTER TABLE public.bookings 
ADD COLUMN vehicle_unlocked boolean NOT NULL DEFAULT false;

-- Add unlock history table for security tracking
CREATE TABLE public.vehicle_unlock_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('unlock', 'lock')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_unlock_logs ENABLE ROW LEVEL SECURITY;

-- Users can log their own unlock actions
CREATE POLICY "Users can insert their own unlock logs"
ON public.vehicle_unlock_logs
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = vehicle_unlock_logs.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Users can view their own unlock logs
CREATE POLICY "Users can view their own unlock logs"
ON public.vehicle_unlock_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = vehicle_unlock_logs.booking_id 
    AND bookings.user_id = auth.uid()
  )
);

-- Admins can view all logs
CREATE POLICY "Admins can view all unlock logs"
ON public.vehicle_unlock_logs
FOR SELECT
USING (is_admin());