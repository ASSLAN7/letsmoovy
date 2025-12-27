-- Create storage bucket for vehicle photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-photos', 'vehicle-photos', true);

-- Create policies for vehicle photos storage
CREATE POLICY "Users can upload their own vehicle photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'vehicle-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view vehicle photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Admins can delete vehicle photos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'vehicle-photos' AND is_admin());

-- Create table to track vehicle return photos
CREATE TABLE public.booking_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  photo_type TEXT NOT NULL DEFAULT 'return' CHECK (photo_type IN ('pickup', 'return')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_photos ENABLE ROW LEVEL SECURITY;

-- Users can view their own booking photos
CREATE POLICY "Users can view their own booking photos"
ON public.booking_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = booking_id AND user_id = auth.uid()
  )
);

-- Users can upload photos for their own bookings
CREATE POLICY "Users can upload photos for their own bookings"
ON public.booking_photos
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = booking_id AND user_id = auth.uid()
  )
);

-- Admins can view all photos
CREATE POLICY "Admins can view all booking photos"
ON public.booking_photos
FOR SELECT
USING (is_admin());

-- Admins can delete photos
CREATE POLICY "Admins can delete booking photos"
ON public.booking_photos
FOR DELETE
USING (is_admin());