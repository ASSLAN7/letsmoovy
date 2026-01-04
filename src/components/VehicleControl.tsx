import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Loader2, Car, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VehicleControlProps {
  bookingId: string;
  vehicleName: string;
  isUnlocked: boolean;
  onStatusChange: (unlocked: boolean) => void;
  disabled?: boolean;
}

const VehicleControl = ({ 
  bookingId, 
  vehicleName, 
  isUnlocked, 
  onStatusChange,
  disabled = false 
}: VehicleControlProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleToggleLock = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Bitte melde dich an');
        return;
      }

      const newState = !isUnlocked;
      const action = newState ? 'unlock' : 'lock';

      // Simulate hardware delay (in real app, this would be IoT API call)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Update booking state
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ vehicle_unlocked: newState })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Log the action
      const { error: logError } = await supabase
        .from('vehicle_unlock_logs')
        .insert({
          booking_id: bookingId,
          user_id: user.id,
          action: action
        });

      if (logError) console.error('Failed to log action:', logError);

      onStatusChange(newState);
      setShowSuccess(true);
      
      toast.success(
        newState 
          ? `${vehicleName} wurde entsperrt` 
          : `${vehicleName} wurde gesperrt`
      );

      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('Fehler beim Steuern des Fahrzeugs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Car className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">Fahrzeugsteuerung</h3>
          <p className="text-sm text-muted-foreground">{vehicleName}</p>
        </div>
      </div>

      <div className="flex flex-col items-center">
        {/* Lock Status Indicator */}
        <motion.div
          className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 ${
            isUnlocked 
              ? 'bg-green-500/20 border-2 border-green-500' 
              : 'bg-muted border-2 border-border'
          }`}
          animate={{
            scale: isLoading ? [1, 1.05, 1] : 1,
            boxShadow: isUnlocked 
              ? '0 0 30px rgba(34, 197, 94, 0.3)' 
              : '0 0 0px transparent'
          }}
          transition={{ 
            scale: { repeat: isLoading ? Infinity : 0, duration: 1 },
            boxShadow: { duration: 0.3 }
          }}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </motion.div>
            ) : showSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <CheckCircle className="w-12 h-12 text-green-500" />
              </motion.div>
            ) : isUnlocked ? (
              <motion.div
                key="unlocked"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Unlock className="w-12 h-12 text-green-500" />
              </motion.div>
            ) : (
              <motion.div
                key="locked"
                initial={{ opacity: 0, rotate: 180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -180 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <Lock className="w-12 h-12 text-muted-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Status Text */}
        <p className={`text-lg font-medium mb-4 ${
          isUnlocked ? 'text-green-500' : 'text-muted-foreground'
        }`}>
          {isLoading 
            ? (isUnlocked ? 'Sperren...' : 'Entsperren...') 
            : (isUnlocked ? 'Entsperrt' : 'Gesperrt')
          }
        </p>

        {/* Action Button */}
        <Button
          onClick={handleToggleLock}
          disabled={disabled || isLoading}
          size="lg"
          variant={isUnlocked ? 'outline' : 'default'}
          className="w-full max-w-xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {isUnlocked ? 'Sperren...' : 'Entsperren...'}
            </>
          ) : isUnlocked ? (
            <>
              <Lock className="w-5 h-5 mr-2" />
              Fahrzeug sperren
            </>
          ) : (
            <>
              <Unlock className="w-5 h-5 mr-2" />
              Fahrzeug entsperren
            </>
          )}
        </Button>

        {disabled && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Nur während der Buchungszeit verfügbar
          </p>
        )}
      </div>
    </div>
  );
};

export default VehicleControl;
