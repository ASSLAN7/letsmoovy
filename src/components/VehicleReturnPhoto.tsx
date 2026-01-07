import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Loader2, Check, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface VehicleReturnPhotoProps {
  bookingId: string;
  vehicleName: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const VehicleReturnPhoto = ({
  bookingId,
  vehicleName,
  isOpen,
  onClose,
  onComplete,
}: VehicleReturnPhotoProps) => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 photos
    const newFiles = files.slice(0, 5 - photos.length);
    
    // Create previews
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews((prev) => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPhotos((prev) => [...prev, ...newFiles]);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    if (!user || photos.length === 0) {
      toast.error('Bitte füge mindestens ein Foto hinzu');
      return;
    }

    setUploading(true);

    try {
      const uploadedPaths: string[] = [];

      for (let i = 0; i < photos.length; i++) {
        const file = photos[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${bookingId}/${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Store the file path, not the public URL (bucket is now private)
        uploadedPaths.push(fileName);
      }

      // Save photo records to database with file path (not public URL)
      for (const filePath of uploadedPaths) {
        const { error: dbError } = await supabase.from('booking_photos').insert({
          booking_id: bookingId,
          photo_url: filePath, // Store path, not URL
          photo_type: 'return',
          notes: notes.trim() || null,
        });

        if (dbError) throw dbError;
      }

      // Update booking status to completed
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      toast.success('Fahrzeug erfolgreich zurückgegeben!');
      onComplete();
      handleClose();
    } catch (err) {
      console.error('Error uploading photos:', err);
      toast.error('Fehler beim Hochladen der Fotos');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setPhotos([]);
    setPreviews([]);
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            Fahrzeug zurückgeben
          </DialogTitle>
          <DialogDescription>
            Fotografiere das Fahrzeug <strong>{vehicleName}</strong> von außen, um eventuelle Beschädigungen zu dokumentieren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo Upload Area */}
          <div>
            <Label className="mb-2 block">Fotos (min. 1, max. 5)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Preview Grid */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <AnimatePresence>
                {previews.map((preview, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-lg overflow-hidden border border-border"
                  >
                    <img
                      src={preview}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-destructive-foreground" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Photo Button */}
              {photos.length < 5 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-xs">Hinzufügen</span>
                </button>
              )}
            </div>

            {photos.length === 0 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-8 rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium">Fotos aufnehmen oder auswählen</span>
                <span className="text-xs">JPG, PNG bis 10MB</span>
              </button>
            )}
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Anmerkungen (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="z.B. Kratzer an der Stoßstange vorgefunden..."
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
            <p className="text-foreground">
              <strong>Tipp:</strong> Fotografiere das Fahrzeug von allen Seiten (vorne, hinten, links, rechts), um den Zustand vollständig zu dokumentieren.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={uploading}>
            Abbrechen
          </Button>
          <Button
            onClick={uploadPhotos}
            disabled={photos.length === 0 || uploading}
            className="gradient-accent"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Wird hochgeladen...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Fahrzeug zurückgeben
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleReturnPhoto;
