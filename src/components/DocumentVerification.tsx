import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Shield, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';
import DocumentUpload from './DocumentUpload';

interface DocumentVerificationProps {
  userId: string;
  onVerificationComplete?: () => void;
}

interface UserDocument {
  id: string;
  document_type: string;
  file_path: string;
  ocr_data: unknown;
  ocr_processed_at: string | null;
}

interface ProfileData {
  full_name: string | null;
  driver_license_number: string | null;
  driver_license_expiry: string | null;
  driver_license_issued_date: string | null;
  verification_status: string;
  verification_notes: string | null;
}

const DocumentVerification = ({ userId, onVerificationComplete }: DocumentVerificationProps) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    driver_license_number: '',
    driver_license_expiry: '',
    driver_license_issued_date: '',
  });

  useEffect(() => {
    fetchData();
  }, [userId]);

  const fetchData = async () => {
    try {
      const [docsResult, profileResult] = await Promise.all([
        supabase
          .from('user_documents')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('profiles')
          .select('full_name, driver_license_number, driver_license_expiry, driver_license_issued_date, verification_status, verification_notes')
          .eq('id', userId)
          .single(),
      ]);

      if (docsResult.data) {
        setDocuments(docsResult.data);
      }

      if (profileResult.data) {
        setProfile(profileResult.data);
        setFormData({
          full_name: profileResult.data.full_name || '',
          driver_license_number: profileResult.data.driver_license_number || '',
          driver_license_expiry: profileResult.data.driver_license_expiry || '',
          driver_license_issued_date: profileResult.data.driver_license_issued_date || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOcrExtracted = (data: Record<string, unknown>) => {
    setFormData((prev) => ({
      ...prev,
      full_name: (data.full_name as string) || prev.full_name,
      driver_license_number: (data.driver_license_number as string) || prev.driver_license_number,
      driver_license_expiry: (data.driver_license_expiry as string) || prev.driver_license_expiry,
      driver_license_issued_date: (data.driver_license_issued_date as string) || prev.driver_license_issued_date,
    }));
  };

  const handleSubmitVerification = async () => {
    // Check if at least driver license front is uploaded
    const hasDriverLicenseFront = documents.some((d) => d.document_type === 'driver_license_front');
    if (!hasDriverLicenseFront) {
      toast.error('Bitte lade mindestens die Vorderseite deines Führerscheins hoch');
      return;
    }

    if (!formData.driver_license_number) {
      toast.error('Bitte gib deine Führerscheinnummer ein');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          verification_status: 'submitted',
        })
        .eq('id', userId);

      if (error) throw error;

      toast.success('Verifizierung eingereicht! Wir prüfen deine Dokumente.');
      setProfile((prev) => prev ? { ...prev, verification_status: 'submitted' } : null);
      onVerificationComplete?.();
    } catch (error) {
      console.error('Error submitting verification:', error);
      toast.error('Fehler beim Einreichen der Verifizierung');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    switch (profile?.verification_status) {
      case 'verified':
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verifiziert
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            In Prüfung
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            <XCircle className="h-3 w-3 mr-1" />
            Abgelehnt
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Shield className="h-3 w-3 mr-1" />
            Nicht verifiziert
          </Badge>
        );
    }
  };

  const getDocument = (type: string) => documents.find((d) => d.document_type === type);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Identitätsverifizierung
              </CardTitle>
              <CardDescription>
                Lade deine Dokumente hoch, um Fahrzeuge buchen zu können
              </CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          {profile?.verification_status === 'rejected' && profile.verification_notes && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-600">
                <strong>Ablehnungsgrund:</strong> {profile.verification_notes}
              </p>
            </div>
          )}

          {profile?.verification_status === 'verified' ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium">Dein Konto ist verifiziert!</h3>
              <p className="text-muted-foreground">Du kannst jetzt Fahrzeuge buchen.</p>
            </div>
          ) : (
            <>
              {/* Document Upload Section */}
              <div className="space-y-4 mb-8">
                <h3 className="font-medium">Führerschein</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <DocumentUpload
                    userId={userId}
                    documentType="driver_license_front"
                    label="Führerschein Vorderseite"
                    description="Foto der Vorderseite deines Führerscheins"
                    existingDocument={getDocument('driver_license_front')}
                    onUploadComplete={() => fetchData()}
                    onOcrExtracted={handleOcrExtracted}
                  />
                  <DocumentUpload
                    userId={userId}
                    documentType="driver_license_back"
                    label="Führerschein Rückseite"
                    description="Foto der Rückseite deines Führerscheins"
                    existingDocument={getDocument('driver_license_back')}
                    onUploadComplete={() => fetchData()}
                  />
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="font-medium">Personalausweis (optional)</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <DocumentUpload
                    userId={userId}
                    documentType="id_card_front"
                    label="Ausweis Vorderseite"
                    description="Foto der Vorderseite deines Personalausweises"
                    existingDocument={getDocument('id_card_front')}
                    onUploadComplete={() => fetchData()}
                  />
                  <DocumentUpload
                    userId={userId}
                    documentType="id_card_back"
                    label="Ausweis Rückseite"
                    description="Foto der Rückseite deines Personalausweises"
                    existingDocument={getDocument('id_card_back')}
                    onUploadComplete={() => fetchData()}
                  />
                </div>
              </div>

              {/* Extracted Data Form */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-medium">Deine Daten</h3>
                <p className="text-sm text-muted-foreground">
                  Die Daten wurden automatisch aus deinen Dokumenten erkannt. Bitte überprüfe und korrigiere sie bei Bedarf.
                </p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="full_name">Vollständiger Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="Max Mustermann"
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="driver_license_number">Führerscheinnummer *</Label>
                    <Input
                      id="driver_license_number"
                      value={formData.driver_license_number}
                      onChange={(e) => setFormData({ ...formData, driver_license_number: e.target.value })}
                      placeholder="z.B. B072RRE2I55"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="driver_license_issued_date">Ausstellungsdatum</Label>
                    <Input
                      id="driver_license_issued_date"
                      type="date"
                      value={formData.driver_license_issued_date}
                      onChange={(e) => setFormData({ ...formData, driver_license_issued_date: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="driver_license_expiry">Gültig bis</Label>
                    <Input
                      id="driver_license_expiry"
                      type="date"
                      value={formData.driver_license_expiry}
                      onChange={(e) => setFormData({ ...formData, driver_license_expiry: e.target.value })}
                    />
                  </div>
                </div>

                <Button
                  className="w-full mt-6"
                  onClick={handleSubmitVerification}
                  disabled={submitting || profile?.verification_status === 'submitted'}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Wird eingereicht...
                    </>
                  ) : profile?.verification_status === 'submitted' ? (
                    <>
                      <Clock className="h-4 w-4 mr-2" />
                      Verifizierung in Prüfung
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Zur Verifizierung einreichen
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentVerification;
