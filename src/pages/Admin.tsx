import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  Car, 
  Calendar, 
  Users, 
  Settings, 
  Loader2, 
  ShieldAlert,
  Check,
  X,
  Edit,
  Trash2,
  Plus,
  MapPin,
  Battery,
  Euro,
  Shield,
  Mail,
  UserCircle,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import AdminCharts from '@/components/AdminCharts';

interface Booking {
  id: string;
  vehicle_name: string;
  vehicle_category: string;
  start_time: string;
  end_time: string;
  pickup_address: string;
  total_price: number;
  status: string;
  user_id: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

interface Vehicle {
  id: number;
  name: string;
  category: string;
  price_per_minute: number;
  seats: number;
  range_km: number;
  battery: number;
  available: boolean;
  latitude: number;
  longitude: number;
  address: string;
  image_url: string | null;
}

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  isAdmin: boolean;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: 'Bestätigt', variant: 'default' },
  active: { label: 'Aktiv', variant: 'secondary' },
  completed: { label: 'Abgeschlossen', variant: 'outline' },
  cancelled: { label: 'Storniert', variant: 'destructive' },
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  // Vehicle dialog state
  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    name: '',
    category: 'Limousine',
    price_per_minute: 0.35,
    seats: 5,
    range_km: 400,
    battery: 100,
    available: true,
    latitude: 52.52,
    longitude: 13.405,
    address: '',
  });
  const [savingVehicle, setSavingVehicle] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchBookings();
      fetchVehicles();
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      // First fetch bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Then fetch profiles for all user_ids
      const userIds = [...new Set(bookingsData?.map(b => b.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Combine bookings with profiles
      const bookingsWithProfiles = (bookingsData || []).map(booking => ({
        ...booking,
        profiles: profilesData?.find(p => p.id === booking.user_id) || null
      }));

      setBookings(bookingsWithProfiles);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      toast.error('Fehler beim Laden der Buchungen');
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchVehicles = async () => {
    setLoadingVehicles(true);
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
      toast.error('Fehler beim Laden der Fahrzeuge');
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      // Fetch all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all admin roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      const adminUserIds = new Set(rolesData?.map(r => r.user_id) || []);

      // Combine profiles with admin status
      const usersWithRoles: UserProfile[] = (profilesData || []).map(profile => ({
        ...profile,
        isAdmin: adminUserIds.has(profile.id)
      }));

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error('Fehler beim Laden der Nutzer');
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleAdminRole = async (userId: string, makeAdmin: boolean) => {
    try {
      if (makeAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' as const });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
      }

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, isAdmin: makeAdmin } : u
      ));
      
      toast.success(makeAdmin ? 'Admin-Rechte erteilt' : 'Admin-Rechte entzogen');
    } catch (err) {
      console.error('Error updating role:', err);
      toast.error('Fehler beim Aktualisieren der Rolle');
    }
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
      toast.success('Status aktualisiert');
    } catch (err) {
      console.error('Error updating booking:', err);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('Buchung wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (error) throw error;
      
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      toast.success('Buchung gelöscht');
    } catch (err) {
      console.error('Error deleting booking:', err);
      toast.error('Fehler beim Löschen');
    }
  };

  const openVehicleDialog = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingVehicle(vehicle);
      setVehicleForm({
        name: vehicle.name,
        category: vehicle.category,
        price_per_minute: vehicle.price_per_minute,
        seats: vehicle.seats,
        range_km: vehicle.range_km,
        battery: vehicle.battery,
        available: vehicle.available,
        latitude: vehicle.latitude,
        longitude: vehicle.longitude,
        address: vehicle.address,
      });
    } else {
      setEditingVehicle(null);
      setVehicleForm({
        name: '',
        category: 'Limousine',
        price_per_minute: 0.35,
        seats: 5,
        range_km: 400,
        battery: 100,
        available: true,
        latitude: 52.52,
        longitude: 13.405,
        address: '',
      });
    }
    setVehicleDialogOpen(true);
  };

  const saveVehicle = async () => {
    if (!vehicleForm.name || !vehicleForm.address) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    setSavingVehicle(true);
    try {
      if (editingVehicle) {
        const { error } = await supabase
          .from('vehicles')
          .update(vehicleForm)
          .eq('id', editingVehicle.id);

        if (error) throw error;
        toast.success('Fahrzeug aktualisiert');
      } else {
        const { error } = await supabase
          .from('vehicles')
          .insert(vehicleForm);

        if (error) throw error;
        toast.success('Fahrzeug hinzugefügt');
      }

      setVehicleDialogOpen(false);
      fetchVehicles();
    } catch (err) {
      console.error('Error saving vehicle:', err);
      toast.error('Fehler beim Speichern');
    } finally {
      setSavingVehicle(false);
    }
  };

  const deleteVehicle = async (vehicleId: number) => {
    if (!confirm('Fahrzeug wirklich löschen?')) return;
    
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
      
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      toast.success('Fahrzeug gelöscht');
    } catch (err) {
      console.error('Error deleting vehicle:', err);
      toast.error('Fehler beim Löschen');
    }
  };

  const toggleVehicleAvailability = async (vehicleId: number, available: boolean) => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ available })
        .eq('id', vehicleId);

      if (error) throw error;
      
      setVehicles(prev => prev.map(v => 
        v.id === vehicleId ? { ...v, available } : v
      ));
    } catch (err) {
      console.error('Error updating vehicle:', err);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-full bg-destructive/10 mx-auto mb-6 flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Zugriff verweigert</h1>
            <p className="text-muted-foreground mb-6">
              Du hast keine Berechtigung für den Admin-Bereich.
            </p>
            <Button variant="hero" onClick={() => navigate('/')}>
              Zurück zur Startseite
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Verwalte Buchungen und Fahrzeuge</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Buchungen</span>
              </div>
              <p className="text-2xl font-bold mt-2">{bookings.length}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Car className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Fahrzeuge</span>
              </div>
              <p className="text-2xl font-bold mt-2">{vehicles.length}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Nutzer</span>
              </div>
              <p className="text-2xl font-bold mt-2">{users.length}</p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Aktive</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {bookings.filter(b => b.status === 'active' || b.status === 'confirmed').length}
              </p>
            </div>
            <div className="glass rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Euro className="w-5 h-5 text-primary" />
                <span className="text-muted-foreground">Umsatz</span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (b.total_price || 0), 0).toFixed(2)}€
              </p>
            </div>
          </div>

          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="glass">
              <TabsTrigger value="bookings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Buchungen
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Car className="w-4 h-4 mr-2" />
                Fahrzeuge
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Users className="w-4 h-4 mr-2" />
                Nutzer
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-4 h-4 mr-2" />
                Statistiken
              </TabsTrigger>
            </TabsList>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4">
              {loadingBookings ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Keine Buchungen vorhanden
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking, index) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass rounded-xl p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold">{booking.vehicle_name}</h3>
                            <Badge variant={statusConfig[booking.status]?.variant || 'outline'}>
                              {statusConfig[booking.status]?.label || booking.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                              <Users className="w-4 h-4 inline mr-1" />
                              {booking.profiles?.full_name || booking.profiles?.email || 'Unbekannt'}
                            </p>
                            <p>
                              <Calendar className="w-4 h-4 inline mr-1" />
                              {format(new Date(booking.start_time), "dd.MM.yyyy HH:mm", { locale: de })} - {format(new Date(booking.end_time), "dd.MM.yyyy HH:mm", { locale: de })}
                            </p>
                            <p>
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {booking.pickup_address}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold gradient-text">{booking.total_price?.toFixed(2)}€</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Select 
                              value={booking.status} 
                              onValueChange={(value) => updateBookingStatus(booking.id, value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="confirmed">Bestätigt</SelectItem>
                                <SelectItem value="active">Aktiv</SelectItem>
                                <SelectItem value="completed">Abgeschlossen</SelectItem>
                                <SelectItem value="cancelled">Storniert</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteBooking(booking.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Vehicles Tab */}
            <TabsContent value="vehicles" className="space-y-4">
              <div className="flex justify-end">
                <Button variant="hero" onClick={() => openVehicleDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Fahrzeug hinzufügen
                </Button>
              </div>

              {loadingVehicles ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : vehicles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Keine Fahrzeuge vorhanden
                </div>
              ) : (
                <div className="grid gap-4">
                  {vehicles.map((vehicle, index) => (
                    <motion.div
                      key={vehicle.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass rounded-xl p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full gradient-accent flex items-center justify-center">
                            <Car className="w-7 h-7 text-primary-foreground" />
                          </div>
                          <div>
                            <h3 className="font-bold">{vehicle.name}</h3>
                            <p className="text-sm text-muted-foreground">{vehicle.category}</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Euro className="w-4 h-4" />
                            {vehicle.price_per_minute.toFixed(2)}€/min
                          </span>
                          <span className="flex items-center gap-1">
                            <Battery className="w-4 h-4" />
                            {vehicle.battery}%
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {vehicle.address.substring(0, 25)}...
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={vehicle.available}
                              onCheckedChange={(checked) => toggleVehicleAvailability(vehicle.id, checked)}
                            />
                            <span className="text-sm">
                              {vehicle.available ? 'Verfügbar' : 'Nicht verfügbar'}
                            </span>
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openVehicleDialog(vehicle)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteVehicle(vehicle.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              {loadingUsers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Keine Nutzer vorhanden
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((userProfile, index) => (
                    <motion.div
                      key={userProfile.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="glass rounded-xl p-4"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
                            {userProfile.avatar_url ? (
                              <img 
                                src={userProfile.avatar_url} 
                                alt="" 
                                className="w-14 h-14 rounded-full object-cover"
                              />
                            ) : (
                              <UserCircle className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold">
                                {userProfile.full_name || 'Unbekannt'}
                              </h3>
                              {userProfile.isAdmin && (
                                <Badge variant="default" className="bg-primary">
                                  <Shield className="w-3 h-3 mr-1" />
                                  Admin
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="w-4 h-4" />
                              {userProfile.email || 'Keine E-Mail'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            Registriert: {format(new Date(userProfile.created_at), "dd.MM.yyyy", { locale: de })}
                          </span>
                          <span>
                            Buchungen: {bookings.filter(b => b.user_id === userProfile.id).length}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={userProfile.isAdmin}
                              onCheckedChange={(checked) => toggleAdminRole(userProfile.id, checked)}
                              disabled={userProfile.id === user?.id}
                            />
                            <span className="text-sm">
                              Admin
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <AdminCharts bookings={bookings} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      {/* Vehicle Dialog */}
      <Dialog open={vehicleDialogOpen} onOpenChange={setVehicleDialogOpen}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVehicle ? 'Fahrzeug bearbeiten' : 'Neues Fahrzeug'}
            </DialogTitle>
            <DialogDescription>
              Fülle die Details für das Fahrzeug aus.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={vehicleForm.name}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="z.B. Tesla Model 3"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Select 
                value={vehicleForm.category}
                onValueChange={(value) => setVehicleForm(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kompakt">Kompakt</SelectItem>
                  <SelectItem value="Limousine">Limousine</SelectItem>
                  <SelectItem value="SUV">SUV</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Preis/Min (€)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={vehicleForm.price_per_minute}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, price_per_minute: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="seats">Sitze</Label>
                <Input
                  id="seats"
                  type="number"
                  value={vehicleForm.seats}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, seats: parseInt(e.target.value) || 4 }))}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="range">Reichweite (km)</Label>
                <Input
                  id="range"
                  type="number"
                  value={vehicleForm.range_km}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, range_km: parseInt(e.target.value) || 300 }))}
                />
              </div>
              <div>
                <Label htmlFor="battery">Batterie (%)</Label>
                <Input
                  id="battery"
                  type="number"
                  min="0"
                  max="100"
                  value={vehicleForm.battery}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, battery: parseInt(e.target.value) || 100 }))}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="address">Adresse *</Label>
              <Input
                id="address"
                value={vehicleForm.address}
                onChange={(e) => setVehicleForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="z.B. Alexanderplatz 1, Berlin"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lat">Breitengrad</Label>
                <Input
                  id="lat"
                  type="number"
                  step="0.0001"
                  value={vehicleForm.latitude}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label htmlFor="lng">Längengrad</Label>
                <Input
                  id="lng"
                  type="number"
                  step="0.0001"
                  value={vehicleForm.longitude}
                  onChange={(e) => setVehicleForm(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                checked={vehicleForm.available}
                onCheckedChange={(checked) => setVehicleForm(prev => ({ ...prev, available: checked }))}
              />
              <Label>Verfügbar</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setVehicleDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="hero" onClick={saveVehicle} disabled={savingVehicle}>
              {savingVehicle ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Speichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
