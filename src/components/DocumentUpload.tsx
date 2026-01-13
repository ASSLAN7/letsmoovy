import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Camera, Upload, Loader2, CheckCircle, FileText, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  userId: string;
  documentType: 'driver_license_front' | 'driver_license_back' | 'id_card_front' | 'id_card_back';
  label: string;
  description: string;
  existingDocument?: {
    file_path: string;
    ocr_data: unknown;
  } | null;
  onUploadComplete: (ocrData: Record<string, unknown> | null) => void;
  onOcrExtracted?: (data: Record<string, unknown>) => void;
}

const DocumentUpload = ({
  userId,
  documentType,
  label,
  description,
  existingDocument,
  onUploadComplete,
  onOcrExtracted,
}: DocumentUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wähle eine Bilddatei aus');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Das Bild darf maximal 10MB groß sein');
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${documentType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Save document record
      const { error: dbError } = await supabase
        .from('user_documents')
        .upsert({
          user_id: userId,
          document_type: documentType,
          file_path: fileName,
        }, {
          onConflict: 'user_id,document_type',
        });

      if (dbError) throw dbError;

      toast.success('Dokument erfolgreich hochgeladen');
      
      // Process OCR
      setProcessing(true);
      
      // Convert file to base64 for OCR
      const base64Reader = new FileReader();
      base64Reader.onloadend = async () => {
        const base64 = (base64Reader.result as string).split(',')[1];
        
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-document`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionData.session?.access_token}`,
              },
              body: JSON.stringify({
                imageBase64: base64,
                documentType,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            if (response.status === 429) {
              toast.error('Zu viele Anfragen. Bitte versuche es später erneut.');
            } else if (response.status === 402) {
              toast.error('AI-Kontingent erschöpft. Bitte kontaktiere den Support.');
            } else {
              throw new Error(errorData.error || 'OCR fehlgeschlagen');
            }
          } else {
            const ocrResult = await response.json();
            
            if (ocrResult.success && ocrResult.ocrData) {
              // Update document with OCR data
              await supabase
                .from('user_documents')
                .update({
                  ocr_data: ocrResult.ocrData,
                  ocr_processed_at: new Date().toISOString(),
                })
                .eq('user_id', userId)
                .eq('document_type', documentType);

              toast.success('Daten wurden automatisch erkannt');
              onOcrExtracted?.(ocrResult.ocrData);
              onUploadComplete(ocrResult.ocrData);
            } else {
              onUploadComplete(null);
            }
          }
        } catch (ocrError) {
          console.error('OCR error:', ocrError);
          toast.error('Automatische Texterkennung fehlgeschlagen. Bitte Daten manuell eingeben.');
          onUploadComplete(null);
        } finally {
          setProcessing(false);
        }
      };
      base64Reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen des Dokuments');
      setProcessing(false);
    } finally {
      setUploading(false);
    }
  };

  const isDriverLicense = documentType.includes('driver_license');
  const Icon = isDriverLicense ? CreditCard : FileText;

  return (
    <Card className={cn(
      "border-2 border-dashed transition-colors",
      existingDocument ? "border-green-500/50 bg-green-500/5" : "border-muted-foreground/25"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {label}
          {existingDocument && <CheckCircle className="h-4 w-4 text-green-500" />}
        </CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(previewUrl || existingDocument) && (
            <div className="relative aspect-[3/2] rounded-lg overflow-hidden bg-muted">
              <img
                src={previewUrl || undefined}
                alt={label}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              {processing && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm text-muted-foreground">Analysiere Dokument...</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || processing}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Fotografieren
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.removeAttribute('capture');
                  fileInputRef.current.click();
                  fileInputRef.current.setAttribute('capture', 'environment');
                }
              }}
              disabled={uploading || processing}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Hochladen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUpload;
