-- Create a table for vehicle reviews
CREATE TABLE public.vehicle_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  vehicle_id INTEGER NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_reviews ENABLE ROW LEVEL SECURITY;

-- Users can view all reviews (public)
CREATE POLICY "Anyone can view reviews"
ON public.vehicle_reviews
FOR SELECT
USING (true);

-- Users can create reviews for their own bookings
CREATE POLICY "Users can create reviews for their bookings"
ON public.vehicle_reviews
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = vehicle_reviews.booking_id
    AND bookings.user_id = auth.uid()
    AND bookings.status = 'completed'
  )
);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
ON public.vehicle_reviews
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON public.vehicle_reviews
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.vehicle_reviews
FOR ALL
USING (is_admin());

-- Create index for faster queries
CREATE INDEX idx_vehicle_reviews_vehicle_id ON public.vehicle_reviews(vehicle_id);
CREATE INDEX idx_vehicle_reviews_booking_id ON public.vehicle_reviews(booking_id);

-- Add unique constraint to prevent multiple reviews per booking
ALTER TABLE public.vehicle_reviews ADD CONSTRAINT unique_booking_review UNIQUE (booking_id);