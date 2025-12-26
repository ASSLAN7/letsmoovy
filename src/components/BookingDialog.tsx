import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addHours, differenceInMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, Clock, MapPin, X, Car, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface Vehicle {
  id: number;
  name: string;
  category: string;
  coordinates: [number, number];
  battery: number;
  range: string;
  price: string;
  available: boolean;
  address: string;
}

interface BookingDialogProps {
  vehicle: Vehicle;
  isOpen: boolean;
  onClose: () => void;
}

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

const BookingDialog = ({ vehicle, isOpen, onClose }: BookingDialogProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  
  const [startDate, setStartDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>();
  const [endDate, setEndDate] = useState<Date>();
  const [endTime, setEndTime] = useState<string>();

  const pricePerMinute = parseFloat(vehicle.price.replace(',', '.').replace('€/min', ''));

  const calculateTotalPrice = () => {
    if (!startDate || !startTime || !endDate || !endTime) return null;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const start = new Date(startDate);
    start.setHours(startHour, startMinute, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(endHour, endMinute, 0, 0);
    
    const minutes = differenceInMinutes(end, start);
    if (minutes <= 0) return null;
    
    return (minutes * pricePerMinute).toFixed(2);
  };

  const totalPrice = calculateTotalPrice();

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Bitte melde dich an, um zu buchen');
      navigate('/auth');
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime || !totalPrice) {
      toast.error('Bitte fülle alle Felder aus');
      return;
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    setIsSubmitting(true);
    
    try {
      const { error } = await supabase.from('bookings').insert({
        user_id: user.id,
        vehicle_id: vehicle.id,
        vehicle_name: vehicle.name,
        vehicle_category: vehicle.category,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        pickup_address: vehicle.address,
        price_per_minute: pricePerMinute,
        total_price: parseFloat(totalPrice),
        status: 'confirmed'
      });

      if (error) throw error;

      // Send confirmation email
      try {
        const { error: emailError } = await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            email: user.email,
            userName: user.user_metadata?.full_name || user.email?.split('@')[0],
            vehicleName: vehicle.name,
            vehicleCategory: vehicle.category,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            pickupAddress: vehicle.address,
            totalPrice: parseFloat(totalPrice),
          },
        });
        
        if (emailError) {
          console.error('Email sending failed:', emailError);
        }
      } catch (emailErr) {
        console.error('Email function error:', emailErr);
      }

      setBookingComplete(true);
      toast.success('Buchung erfolgreich!');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error('Fehler bei der Buchung. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setStartDate(undefined);
    setStartTime(undefined);
    setEndDate(undefined);
    setEndTime(undefined);
    setBookingComplete(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="glass rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              {bookingComplete ? 'Buchung bestätigt!' : 'Fahrzeug buchen'}
            </h2>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {bookingComplete ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 rounded-full gradient-accent mx-auto mb-6 flex items-center justify-center">
                <Check className="w-10 h-10 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">Deine Buchung ist bestätigt</h3>
              <p className="text-muted-foreground mb-6">
                Du kannst deine Buchung unter "Meine Buchungen" verwalten.
              </p>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  Schließen
                </Button>
                <Button 
                  variant="hero" 
                  className="flex-1"
                  onClick={() => {
                    handleClose();
                    navigate('/bookings');
                  }}
                >
                  Meine Buchungen
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Vehicle Info */}
              <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl mb-6">
                <div className="w-14 h-14 rounded-full gradient-accent flex items-center justify-center">
                  <Car className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-foreground">{vehicle.name}</h3>
                  <p className="text-sm text-muted-foreground">{vehicle.category}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold gradient-text">{vehicle.price}</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-3 mb-6 text-sm">
                <MapPin size={18} className="text-primary" />
                <span className="text-muted-foreground">{vehicle.address}</span>
              </div>

              {/* Date/Time Selection */}
              <div className="space-y-4 mb-6">
                {/* Start Date & Time */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Start
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "dd.MM.yyyy", { locale: de }) : "Datum"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <Clock className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Uhrzeit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {timeSlots.map((time) => (
                          <SelectItem key={`start-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* End Date & Time */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Ende
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "dd.MM.yyyy", { locale: de }) : "Datum"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 glass" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => date < (startDate || new Date())}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <Clock className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Uhrzeit" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {timeSlots.map((time) => (
                          <SelectItem key={`end-${time}`} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              {totalPrice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-primary/10 rounded-xl mb-6"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Geschätzter Preis</span>
                    <span className="text-2xl font-bold gradient-text">{totalPrice}€</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Basierend auf {vehicle.price}
                  </p>
                </motion.div>
              )}

              {/* Submit Button */}
              <Button
                variant="hero"
                className="w-full"
                onClick={handleSubmit}
                disabled={!startDate || !startTime || !endDate || !endTime || !totalPrice || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Jetzt buchen'
                )}
              </Button>

              {!user && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  <button 
                    onClick={() => navigate('/auth')}
                    className="text-primary hover:underline"
                  >
                    Melde dich an
                  </button>
                  {' '}um zu buchen
                </p>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BookingDialog;
