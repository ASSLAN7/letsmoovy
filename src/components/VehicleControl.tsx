import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Loader2, Car, CheckCircle, Volume2, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VehicleControlProps {
  bookingId: string;
  vehicleId: number;
  vehicleName: string;
  isUnlocked: boolean;
  onStatusChange: (unlocked: boolean) => void;
  disabled?: boolean;
}

const VehicleControl = ({ 
  bookingId, 
  vehicleId,
  vehicleName, 
  isUnlocked, 
  onStatusChange,
  disabled = false 
}: VehicleControlProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCommand, setLoadingCommand] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const executeCommand = async (command: 'unlock' | 'lock' | 'horn' | 'flash_lights') => {
    setIsLoading(true);
    setLoadingCommand(command);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Bitte melde dich an');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vehicle-control`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            vehicleId,
            command,
            bookingId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Fehler');
      }

      if (command === 'unlock' || command === 'lock') {
        onStatusChange(command === 'unlock');
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
      
      const messages: Record<string, string> = {
        unlock: `${vehicleName} wurde entsperrt`,
        lock: `${vehicleName} wurde gesperrt`,
        horn: 'Hupe aktiviert',
        flash_lights: 'Lichter blinken',
      };
      
      toast.success(messages[command]);
    } catch (error) {
      console.error('Error executing command:', error);
      toast.error(error instanceof Error ? error.message : 'Fehler beim Steuern des Fahrzeugs');
    } finally {
      setIsLoading(false);
      setLoadingCommand(null);
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
        <p className={`text-lg font-medium mb-6 ${
          isUnlocked ? 'text-green-500' : 'text-muted-foreground'
        }`}>
          {loadingCommand === 'unlock' || loadingCommand === 'lock'
            ? (isUnlocked ? 'Sperren...' : 'Entsperren...') 
            : (isUnlocked ? 'Entsperrt' : 'Gesperrt')
          }
        </p>

        {/* Main Lock/Unlock Button */}
        <Button
          onClick={() => executeCommand(isUnlocked ? 'lock' : 'unlock')}
          disabled={disabled || isLoading}
          size="lg"
          variant={isUnlocked ? 'outline' : 'default'}
          className="w-full max-w-xs mb-4"
        >
          {loadingCommand === 'unlock' || loadingCommand === 'lock' ? (
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

        {/* Additional Controls */}
        <div className="flex gap-3">
          <Button
            onClick={() => executeCommand('horn')}
            disabled={disabled || isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {loadingCommand === 'horn' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Volume2 className="w-4 h-4 mr-2" />
                Hupen
              </>
            )}
          </Button>
          <Button
            onClick={() => executeCommand('flash_lights')}
            disabled={disabled || isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {loadingCommand === 'flash_lights' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Lightbulb className="w-4 h-4 mr-2" />
                Blinken
              </>
            )}
          </Button>
        </div>

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
