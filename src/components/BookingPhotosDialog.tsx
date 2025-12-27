import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Camera, Loader2, X, Download, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface BookingPhoto {
  id: string;
  photo_url: string;
  photo_type: string;
  notes: string | null;
  created_at: string;
}

interface BookingPhotosDialogProps {
  bookingId: string | null;
  bookingName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BookingPhotosDialog = ({ bookingId, bookingName, open, onOpenChange }: BookingPhotosDialogProps) => {
  const [photos, setPhotos] = useState<BookingPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (open && bookingId) {
      fetchPhotos();
    }
  }, [open, bookingId]);

  const fetchPhotos = async () => {
    if (!bookingId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('booking_photos')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
    } catch (err) {
      console.error('Error fetching photos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (photoUrl: string, index: number) => {
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rueckgabe-foto-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Rückgabe-Fotos
            </DialogTitle>
            <DialogDescription>
              Fotos für Buchung: {bookingName}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Keine Fotos für diese Buchung vorhanden</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {photos.length} Foto{photos.length !== 1 ? 's' : ''} hochgeladen
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {photos.map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <div 
                      className="aspect-square rounded-lg overflow-hidden cursor-pointer border border-border hover:border-primary transition-colors"
                      onClick={() => setSelectedPhoto(photo.photo_url)}
                    >
                      <img
                        src={photo.photo_url}
                        alt={`Rückgabe-Foto ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedPhoto(photo.photo_url)}
                        className="h-8 w-8"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(photo.photo_url, index)}
                        className="h-8 w-8"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      {format(new Date(photo.created_at), "dd.MM.yyyy HH:mm", { locale: de })}
                    </div>
                    
                    {photo.notes && (
                      <p className="mt-1 text-xs text-foreground bg-secondary/50 rounded p-2">
                        {photo.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-size photo viewer */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-background/95">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-5 h-5" />
          </Button>
          {selectedPhoto && (
            <img
              src={selectedPhoto}
              alt="Foto Vollansicht"
              className="w-full h-auto max-h-[85vh] object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookingPhotosDialog;
