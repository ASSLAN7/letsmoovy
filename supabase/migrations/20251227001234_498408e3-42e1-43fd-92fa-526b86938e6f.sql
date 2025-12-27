-- Create support_templates table for custom response templates
CREATE TABLE public.support_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Allgemein',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_templates ENABLE ROW LEVEL SECURITY;

-- Only admins can view templates
CREATE POLICY "Admins can view all templates"
ON public.support_templates
FOR SELECT
USING (is_admin());

-- Only admins can create templates
CREATE POLICY "Admins can create templates"
ON public.support_templates
FOR INSERT
WITH CHECK (is_admin());

-- Only admins can update templates
CREATE POLICY "Admins can update templates"
ON public.support_templates
FOR UPDATE
USING (is_admin());

-- Only admins can delete templates
CREATE POLICY "Admins can delete templates"
ON public.support_templates
FOR DELETE
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_support_templates_updated_at
BEFORE UPDATE ON public.support_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();