import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Car, Calendar, Clock, MapPin, ArrowLeft, 
  Loader2, XCircle, CheckCircle, AlertCircle, Camera, Play, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VehicleReturnPhoto from '@/components/VehicleReturnPhoto';
import VehiclePickupPhoto from '@/components/VehiclePickupPhoto';
import VehicleRating from '@/components/VehicleRating';

interface Booking {
  id: string;
  vehicle_id: number;
  vehicle_name: string;
  vehicle_category: string;
  start_time: string;
  end_time: string;
  pickup_address: string;
  price_per_minute: number;
  total_price: number;
  status: string;
  created_at: string;
  hasReview?: boolean;
}

const statusConfig = {
  confirmed: {
    label: 'Bestätigt',
    icon: CheckCircle,
    className: 'bg-primary/20 text-primary',
  },
  active: {
    label: 'Aktiv',
    icon: AlertCircle,
    className: 'bg-yellow-500/20 text-yellow-500',
  },
  completed: {
    label: 'Abgeschlossen',
    icon: CheckCircle,
    className: 'bg-green-500/20 text-green-500',
  },
  cancelled: {
    label: 'Storniert',
    icon: XCircle,
    className: 'bg-destructive/20 text-destructive',
  },
};

const Bookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      // Fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch existing reviews for these bookings
      const bookingIds = bookingsData?.map(b => b.id) || [];
      const { data: reviewsData } = await supabase
        .from('vehicle_reviews')
        .select('booking_id')
        .in('booking_id', bookingIds);

      const reviewedBookingIds = new Set(reviewsData?.map(r => r.booking_id) || []);

      // Mark bookings that have reviews
      const bookingsWithReviewStatus = (bookingsData || []).map(b => ({
        ...b,
        hasReview: reviewedBookingIds.has(b.id)
      }));

      setBookings(bookingsWithReviewStatus);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Fehler beim Laden der Buchungen');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Buchung storniert');
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Fehler beim Stornieren der Buchung');
    }
  };

  const handleReturnVehicle = (booking: Booking) => {
    setSelectedBooking(booking);
    setReturnDialogOpen(true);
  };

  const handlePickupVehicle = (booking: Booking) => {
    setSelectedBooking(booking);
    setPickupDialogOpen(true);
  };

  const handleRateVehicle = (booking: Booking) => {
    setSelectedBooking(booking);
    setRatingDialogOpen(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // Bookings ready for pickup (confirmed and start time has passed)
  const readyForPickup = bookings.filter(b => 
    b.status === 'confirmed' && 
    new Date(b.start_time) <= new Date() &&
    new Date(b.end_time) >= new Date()
  );

  // Active bookings that can be returned
  const activeBookings = bookings.filter(b => 
    b.status === 'active' && 
    new Date(b.end_time) >= new Date()
  );
  
  const upcomingBookings = bookings.filter(b => 
    b.status === 'confirmed' && new Date(b.start_time) > new Date()
  );
  const pastBookings = bookings.filter(b => 
    b.status === 'completed' || (b.status !== 'cancelled' && new Date(b.end_time) < new Date())
  );
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft size={20} />
              <span>Zurück zur Startseite</span>
            </button>

            <h1 className="text-4xl font-bold mb-2">
              Meine <span className="gradient-text">Buchungen</span>
            </h1>
            <p className="text-muted-foreground">
              Verwalte deine Fahrzeugbuchungen
            </p>
          </motion.div>

          {bookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-12 text-center"
            >
              <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Keine Buchungen</h2>
              <p className="text-muted-foreground mb-6">
                Du hast noch keine Fahrzeuge gebucht.
              </p>
              <Button variant="hero" onClick={() => navigate('/#locations')}>
                Fahrzeug finden
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {/* Ready for Pickup - Need to take photos before starting */}
              {readyForPickup.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" />
                    Bereit zur Abholung
                  </h2>
                  <div className="grid gap-4">
                    {readyForPickup.map((booking, index) => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking} 
                        index={index}
                        onPickup={() => handlePickupVehicle(booking)}
                        showPickup
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Active Bookings - Can be returned */}
              {activeBookings.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    Aktive Buchungen
                  </h2>
                  <div className="grid gap-4">
                    {activeBookings.map((booking, index) => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking} 
                        index={index}
                        onReturn={() => handleReturnVehicle(booking)}
                        showReturn
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Upcoming Bookings */}
              {upcomingBookings.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Anstehende Buchungen</h2>
                  <div className="grid gap-4">
                    {upcomingBookings.map((booking, index) => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking} 
                        index={index}
                        onCancel={() => handleCancelBooking(booking.id)}
                        showCancel
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Past Bookings */}
              {pastBookings.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Vergangene Buchungen</h2>
                  <div className="grid gap-4">
                    {pastBookings.map((booking, index) => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking} 
                        index={index}
                        onRate={() => handleRateVehicle(booking)}
                        showRate={booking.status === 'completed' && !booking.hasReview}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Cancelled Bookings */}
              {cancelledBookings.length > 0 && (
                <section>
                  <h2 className="text-xl font-bold mb-4">Stornierte Buchungen</h2>
                  <div className="grid gap-4">
                    {cancelledBookings.map((booking, index) => (
                      <BookingCard 
                        key={booking.id} 
                        booking={booking} 
                        index={index}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Vehicle Return Photo Dialog */}
      {selectedBooking && (
        <VehicleReturnPhoto
          bookingId={selectedBooking.id}
          vehicleName={selectedBooking.vehicle_name}
          isOpen={returnDialogOpen}
          onClose={() => {
            setReturnDialogOpen(false);
            setSelectedBooking(null);
          }}
          onComplete={fetchBookings}
        />
      )}

      {/* Vehicle Pickup Photo Dialog */}
      {selectedBooking && (
        <VehiclePickupPhoto
          bookingId={selectedBooking.id}
          vehicleName={selectedBooking.vehicle_name}
          isOpen={pickupDialogOpen}
          onClose={() => {
            setPickupDialogOpen(false);
            setSelectedBooking(null);
          }}
          onComplete={fetchBookings}
        />
      )}

      {/* Vehicle Rating Dialog */}
      {selectedBooking && (
        <VehicleRating
          bookingId={selectedBooking.id}
          vehicleId={selectedBooking.vehicle_id}
          vehicleName={selectedBooking.vehicle_name}
          isOpen={ratingDialogOpen}
          onClose={() => {
            setRatingDialogOpen(false);
            setSelectedBooking(null);
          }}
          onComplete={fetchBookings}
        />
      )}
    </div>
  );
};

const BookingCard = ({ 
  booking, 
  index, 
  onCancel,
  onReturn,
  onPickup,
  onRate,
  showCancel = false,
  showReturn = false,
  showPickup = false,
  showRate = false,
}: { 
  booking: Booking; 
  index: number;
  onCancel?: () => void;
  onReturn?: () => void;
  onPickup?: () => void;
  onRate?: () => void;
  showCancel?: boolean;
  showReturn?: boolean;
  showPickup?: boolean;
  showRate?: boolean;
}) => {
  const status = statusConfig[booking.status as keyof typeof statusConfig] || statusConfig.confirmed;
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="glass rounded-xl p-6"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Vehicle Info */}
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full gradient-accent flex items-center justify-center flex-shrink-0">
            <Car className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{booking.vehicle_name}</h3>
            <p className="text-sm text-muted-foreground">{booking.vehicle_category}</p>
          </div>
        </div>

        {/* Date/Time */}
        <div className="flex flex-col md:items-center gap-1 md:px-6">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={14} className="text-primary" />
            <span className="text-foreground">
              {format(new Date(booking.start_time), "dd.MM.yyyy", { locale: de })}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-primary" />
            <span className="text-muted-foreground">
              {format(new Date(booking.start_time), "HH:mm")} - {format(new Date(booking.end_time), "HH:mm")}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm flex-1 md:px-6">
          <MapPin size={14} className="text-primary flex-shrink-0" />
          <span className="text-muted-foreground truncate">{booking.pickup_address}</span>
        </div>

        {/* Price & Status */}
        <div className="flex items-center gap-4">
          <span className="text-xl font-bold gradient-text">
            {booking.total_price?.toFixed(2)}€
          </span>
          
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.className}`}>
            <StatusIcon size={12} />
            {status.label}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {showPickup && onPickup && (
            <Button
              variant="hero"
              size="sm"
              onClick={onPickup}
            >
              <Play className="w-4 h-4 mr-2" />
              Fahrt starten
            </Button>
          )}

          {showReturn && onReturn && (
            <Button
              variant="hero"
              size="sm"
              onClick={onReturn}
            >
              <Camera className="w-4 h-4 mr-2" />
              Zurückgeben
            </Button>
          )}
          
          {showRate && onRate && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRate}
            >
              <Star className="w-4 h-4 mr-2" />
              Bewerten
            </Button>
          )}

          {showCancel && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onCancel}
            >
              Stornieren
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Bookings;
