import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Loader2, Send } from 'lucide-react';
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

interface VehicleRatingProps {
  bookingId: string;
  vehicleId: number;
  vehicleName: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const VehicleRating = ({
  bookingId,
  vehicleId,
  vehicleName,
  isOpen,
  onClose,
  onComplete,
}: VehicleRatingProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast.error('Bitte wähle eine Bewertung aus');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from('vehicle_reviews').insert({
        booking_id: bookingId,
        vehicle_id: vehicleId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.error('Du hast diese Buchung bereits bewertet');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Danke für deine Bewertung!');
      onComplete();
      handleClose();
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error('Fehler beim Speichern der Bewertung');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    onClose();
  };

  const displayRating = hoveredRating || rating;

  const ratingLabels = ['', 'Schlecht', 'Mäßig', 'Gut', 'Sehr gut', 'Ausgezeichnet'];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="glass max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Fahrzeug bewerten
          </DialogTitle>
          <DialogDescription>
            Wie war deine Erfahrung mit <strong>{vehicleName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="text-center">
            <Label className="mb-4 block text-base">Deine Bewertung</Label>
            <div className="flex justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 focus:outline-none"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= displayRating
                        ? 'fill-yellow-500 text-yellow-500'
                        : 'text-muted-foreground'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            {displayRating > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-muted-foreground"
              >
                {ratingLabels[displayRating]}
              </motion.p>
            )}
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="review-comment">Kommentar (optional)</Label>
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Erzähle uns mehr über deine Erfahrung..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Später
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className="gradient-accent"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Wird gesendet...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Bewertung abgeben
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleRating;
