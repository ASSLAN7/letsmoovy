-- Add reminder_sent column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN reminder_sent boolean NOT NULL DEFAULT false;

-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;