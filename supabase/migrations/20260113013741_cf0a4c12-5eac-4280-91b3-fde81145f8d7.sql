-- Create user_documents table for document storage
CREATE TABLE public.user_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('driver_license_front', 'driver_license_back', 'id_card_front', 'id_card_back')),
  file_path TEXT NOT NULL,
  ocr_data JSONB,
  ocr_processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, document_type)
);

-- Add verification status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending' 
CHECK (verification_status IN ('pending', 'submitted', 'verified', 'rejected'));

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Enable RLS on user_documents
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_documents
CREATE POLICY "Users can view their own documents" 
ON public.user_documents FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents" 
ON public.user_documents FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.user_documents FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.user_documents FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents" 
ON public.user_documents FOR SELECT TO authenticated
USING (is_admin());

CREATE POLICY "Admins can update all documents" 
ON public.user_documents FOR UPDATE TO authenticated
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_user_documents_updated_at
BEFORE UPDATE ON public.user_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for user documents (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-documents bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all user documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-documents' AND is_admin());

CREATE POLICY "Admins can delete user documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-documents' AND is_admin());