import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInMinutes } from 'date-fns';
import { de } from 'date-fns/locale';
import { Calendar, Clock, MapPin, X, Car, Loader2, Check, AlertTriangle } from 'lucide-react';
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

interface ExistingBooking {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  
  const [startDate, setStartDate] = useState<Date>();
  const [startTime, setStartTime] = useState<string>();
  const [endDate, setEndDate] = useState<Date>();
  const [endTime, setEndTime] = useState<string>();

  const pricePerMinute = parseFloat(vehicle.price.replace(',', '.').replace('€/min', ''));

  // Fetch existing bookings for the vehicle
  const fetchExistingBookings = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_vehicle_bookings', {
      p_vehicle_id: vehicle.id,
      p_from_date: new Date().toISOString()
    });
    
    if (!error && data) {
      setExistingBookings(data);
    }
  }, [vehicle.id]);

  // Set up realtime subscription for booking changes
  useEffect(() => {
    if (!isOpen) return;

    fetchExistingBookings();

    const channel = supabase
      .channel(`vehicle-bookings-${vehicle.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `vehicle_id=eq.${vehicle.id}`
        },
        () => {
          fetchExistingBookings();
          // Re-check availability if dates are selected
          if (startDate && startTime && endDate && endTime) {
            checkAvailability();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, vehicle.id, fetchExistingBookings]);

  // Check availability when dates change
  const checkAvailability = useCallback(async () => {
    if (!startDate || !startTime || !endDate || !endTime) {
      setIsAvailable(null);
      return;
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    if (endDateTime <= startDateTime) {
      setIsAvailable(null);
      return;
    }

    setIsCheckingAvailability(true);

    try {
      const { data, error } = await supabase.rpc('check_vehicle_availability', {
        p_vehicle_id: vehicle.id,
        p_start_time: startDateTime.toISOString(),
        p_end_time: endDateTime.toISOString()
      });

      if (error) {
        console.error('Availability check error:', error);
        setIsAvailable(null);
      } else {
        setIsAvailable(data);
      }
    } catch (err) {
      console.error('Availability check failed:', err);
      setIsAvailable(null);
    } finally {
      setIsCheckingAvailability(false);
    }
  }, [startDate, startTime, endDate, endTime, vehicle.id]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

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

    // Final availability check before booking
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date(startDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    setIsSubmitting(true);
    
    try {
      // Use atomic booking function to prevent race conditions
      const { data: bookingId, error: bookingError } = await supabase.rpc('book_vehicle_atomic', {
        p_user_id: user.id,
        p_vehicle_id: vehicle.id,
        p_start_time: startDateTime.toISOString(),
        p_end_time: endDateTime.toISOString(),
        p_vehicle_name: vehicle.name,
        p_vehicle_category: vehicle.category,
        p_pickup_address: vehicle.address,
        p_price_per_minute: pricePerMinute,
        p_total_price: parseFloat(totalPrice)
      });

      if (bookingError) {
        // Handle specific error types
        if (bookingError.message?.includes('time_slot_taken') || bookingError.message?.includes('no_booking_overlap')) {
          toast.error('Dieser Zeitraum wurde soeben von jemand anderem gebucht. Bitte wähle einen anderen Zeitraum.');
          setIsAvailable(false);
          await fetchExistingBookings();
          setIsSubmitting(false);
          return;
        }
        if (bookingError.message?.includes('vehicle_not_available')) {
          toast.error('Das Fahrzeug ist nicht verfügbar.');
          setIsSubmitting(false);
          return;
        }
        throw bookingError;
      }

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
    } catch (error: any) {
      console.error('Booking error:', error);
      toast.error('Fehler bei der Buchung. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStartDate(undefined);
    setStartTime(undefined);
    setEndDate(undefined);
    setEndTime(undefined);
    setBookingComplete(false);
    setIsAvailable(null);
    onClose();
  };

  // Format existing bookings for display
  const formatBookingTime = (isoString: string) => {
    return format(new Date(isoString), "dd.MM. HH:mm", { locale: de });
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

              {/* Existing Bookings Warning */}
              {existingBookings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-muted/50 rounded-lg mb-4 text-sm"
                >
                  <p className="font-medium text-foreground mb-2">Bereits gebuchte Zeiträume:</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {existingBookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="text-muted-foreground text-xs">
                        {formatBookingTime(booking.start_time)} - {formatBookingTime(booking.end_time)}
                      </div>
                    ))}
                    {existingBookings.length > 5 && (
                      <div className="text-muted-foreground text-xs">
                        + {existingBookings.length - 5} weitere
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

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

              {/* Availability Status */}
              {(startDate && startTime && endDate && endTime) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-lg mb-4 flex items-center gap-2",
                    isCheckingAvailability && "bg-muted/50",
                    isAvailable === true && "bg-primary/10",
                    isAvailable === false && "bg-destructive/10"
                  )}
                >
                  {isCheckingAvailability ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Verfügbarkeit wird geprüft...</span>
                    </>
                  ) : isAvailable === true ? (
                    <>
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary">Fahrzeug ist verfügbar</span>
                    </>
                  ) : isAvailable === false ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-sm text-destructive">Zeitraum bereits gebucht</span>
                    </>
                  ) : null}
                </motion.div>
              )}

              {/* Price Summary */}
              {totalPrice && isAvailable && (
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
                disabled={!startDate || !startTime || !endDate || !endTime || !totalPrice || isSubmitting || isAvailable !== true}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isAvailable === false ? (
                  'Zeitraum nicht verfügbar'
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
