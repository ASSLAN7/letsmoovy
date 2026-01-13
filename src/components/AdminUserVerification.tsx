import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Loader2,
  User,
  FileText,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface PendingUser {
  id: string;
  email: string | null;
  full_name: string | null;
  driver_license_number: string | null;
  driver_license_expiry: string | null;
  driver_license_issued_date: string | null;
  verification_status: string;
  verification_notes: string | null;
  created_at: string;
}

interface UserDocument {
  id: string;
  document_type: string;
  file_path: string;
  ocr_data: unknown;
  created_at: string;
}

const AdminUserVerification = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('verification_status', ['submitted', 'pending', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDocuments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      setDocuments(data || []);

      // Generate signed URLs for documents
      const urls: Record<string, string> = {};
      for (const doc of data || []) {
        const { data: signedUrlData } = await supabase.storage
          .from('user-documents')
          .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

        if (signedUrlData?.signedUrl) {
          urls[doc.document_type] = signedUrlData.signedUrl;
        }
      }
      setDocumentUrls(urls);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleViewUser = async (user: PendingUser) => {
    setSelectedUser(user);
    setRejectionNotes('');
    await fetchUserDocuments(user.id);
    setDialogOpen(true);
  };

  const handleVerify = async () => {
    if (!selectedUser) return;

    setProcessing(true);
    try {
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'verified',
          verification_notes: null,
          verified_at: new Date().toISOString(),
          verified_by: adminUser?.id,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('Benutzer erfolgreich verifiziert');
      setDialogOpen(false);
      fetchPendingUsers();
    } catch (error) {
      console.error('Error verifying user:', error);
      toast.error('Fehler bei der Verifizierung');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedUser) return;

    if (!rejectionNotes.trim()) {
      toast.error('Bitte gib einen Ablehnungsgrund ein');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          verification_status: 'rejected',
          verification_notes: rejectionNotes,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast.success('Verifizierung abgelehnt');
      setDialogOpen(false);
      fetchPendingUsers();
    } catch (error) {
      console.error('Error rejecting verification:', error);
      toast.error('Fehler beim Ablehnen');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
            Eingereicht
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
            Ausstehend
          </Badge>
        );
    }
  };

  const getDocumentLabel = (type: string) => {
    const labels: Record<string, string> = {
      driver_license_front: 'Führerschein Vorderseite',
      driver_license_back: 'Führerschein Rückseite',
      id_card_front: 'Ausweis Vorderseite',
      id_card_back: 'Ausweis Rückseite',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Benutzerverifizierung
        </CardTitle>
        <CardDescription>
          Prüfe und verifiziere Benutzeridentitäten
        </CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine ausstehenden Verifizierungen</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Benutzer</TableHead>
                <TableHead>Führerscheinnummer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Eingereicht am</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{user.full_name || 'Kein Name'}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {user.driver_license_number || '-'}
                    </code>
                  </TableCell>
                  <TableCell>{getStatusBadge(user.verification_status)}</TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'dd.MM.yyyy', { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewUser(user)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Prüfen
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Benutzer verifizieren
              </DialogTitle>
              <DialogDescription>
                Prüfe die hochgeladenen Dokumente und Benutzerdaten
              </DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                {/* User Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={selectedUser.full_name || '-'} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>E-Mail</Label>
                    <Input value={selectedUser.email || '-'} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Führerscheinnummer</Label>
                    <Input value={selectedUser.driver_license_number || '-'} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Gültig bis</Label>
                    <Input 
                      value={selectedUser.driver_license_expiry 
                        ? format(new Date(selectedUser.driver_license_expiry), 'dd.MM.yyyy')
                        : '-'
                      } 
                      readOnly 
                    />
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Hochgeladene Dokumente
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {documents.length === 0 ? (
                      <p className="text-muted-foreground col-span-2">Keine Dokumente hochgeladen</p>
                    ) : (
                      documents.map((doc) => (
                        <Card key={doc.id} className="overflow-hidden">
                          <CardHeader className="py-3">
                            <CardTitle className="text-sm">
                              {getDocumentLabel(doc.document_type)}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-0">
                            {documentUrls[doc.document_type] ? (
                              <a
                                href={documentUrls[doc.document_type]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={documentUrls[doc.document_type]}
                                  alt={getDocumentLabel(doc.document_type)}
                                  className="w-full aspect-[3/2] object-cover hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ) : (
                              <div className="w-full aspect-[3/2] bg-muted flex items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Rejection Notes */}
                {selectedUser.verification_status !== 'verified' && (
                  <div className="space-y-2">
                    <Label htmlFor="rejection_notes">Ablehnungsgrund (bei Ablehnung)</Label>
                    <Textarea
                      id="rejection_notes"
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="z.B. Dokument nicht lesbar, Daten stimmen nicht überein..."
                      rows={3}
                    />
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Ablehnen
              </Button>
              <Button
                onClick={handleVerify}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Verifizieren
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminUserVerification;
