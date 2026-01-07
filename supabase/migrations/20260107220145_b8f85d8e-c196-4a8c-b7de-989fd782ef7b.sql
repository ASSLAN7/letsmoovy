-- Make vehicle-photos bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'vehicle-photos';