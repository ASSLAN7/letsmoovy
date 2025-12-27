import { useMemo } from 'react';
import { format, subDays, startOfDay, eachDayOfInterval, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { TrendingUp, Euro, Calendar, Car } from 'lucide-react';

interface Booking {
  id: string;
  vehicle_name: string;
  vehicle_category: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  created_at: string;
}

interface AdminChartsProps {
  bookings: Booking[];
}

const AdminCharts = ({ bookings }: AdminChartsProps) => {
  // Calculate data for last 30 days
  const chartData = useMemo(() => {
    const today = startOfDay(new Date());
    const thirtyDaysAgo = subDays(today, 29);
    
    const days = eachDayOfInterval({ start: thirtyDaysAgo, end: today });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayBookings = bookings.filter(b => {
        const bookingDate = format(parseISO(b.created_at), 'yyyy-MM-dd');
        return bookingDate === dayStr && b.status !== 'cancelled';
      });
      
      return {
        date: format(day, 'dd.MM', { locale: de }),
        fullDate: format(day, 'dd. MMMM', { locale: de }),
        buchungen: dayBookings.length,
        umsatz: dayBookings.reduce((sum, b) => sum + (b.total_price || 0), 0),
      };
    });
  }, [bookings]);

  // Calculate category distribution
  const categoryData = useMemo(() => {
    const categories: Record<string, { count: number; revenue: number }> = {};
    
    bookings
      .filter(b => b.status !== 'cancelled')
      .forEach(booking => {
        const cat = booking.vehicle_category || 'Sonstige';
        if (!categories[cat]) {
          categories[cat] = { count: 0, revenue: 0 };
        }
        categories[cat].count++;
        categories[cat].revenue += booking.total_price || 0;
      });
    
    return Object.entries(categories).map(([name, data]) => ({
      name,
      buchungen: data.count,
      umsatz: data.revenue,
    }));
  }, [bookings]);

  // Calculate totals for last 30 days vs previous 30 days
  const stats = useMemo(() => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const sixtyDaysAgo = subDays(today, 60);
    
    const recentBookings = bookings.filter(b => {
      const date = parseISO(b.created_at);
      return date >= thirtyDaysAgo && b.status !== 'cancelled';
    });
    
    const previousBookings = bookings.filter(b => {
      const date = parseISO(b.created_at);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo && b.status !== 'cancelled';
    });
    
    const recentRevenue = recentBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const previousRevenue = previousBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    
    const revenueChange = previousRevenue > 0 
      ? ((recentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : recentRevenue > 0 ? '100' : '0';
    
    const bookingsChange = previousBookings.length > 0
      ? ((recentBookings.length - previousBookings.length) / previousBookings.length * 100).toFixed(1)
      : recentBookings.length > 0 ? '100' : '0';
    
    return {
      recentRevenue,
      previousRevenue,
      revenueChange: parseFloat(revenueChange),
      recentBookings: recentBookings.length,
      previousBookings: previousBookings.length,
      bookingsChange: parseFloat(bookingsChange),
    };
  }, [bookings]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass rounded-lg p-3 border border-border">
          <p className="text-sm font-medium mb-1">{payload[0]?.payload?.fullDate || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'umsatz' ? 'Umsatz' : 'Buchungen'}: {entry.name === 'umsatz' ? `${entry.value.toFixed(2)}€` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
                <Euro className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-muted-foreground">Umsatz (30 Tage)</span>
            </div>
            <div className={`flex items-center gap-1 text-sm ${stats.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className={`w-4 h-4 ${stats.revenueChange < 0 ? 'rotate-180' : ''}`} />
              {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
            </div>
          </div>
          <p className="text-3xl font-bold gradient-text">{stats.recentRevenue.toFixed(2)}€</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vorperiode: {stats.previousRevenue.toFixed(2)}€
          </p>
        </div>
        
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-accent flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-muted-foreground">Buchungen (30 Tage)</span>
            </div>
            <div className={`flex items-center gap-1 text-sm ${stats.bookingsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <TrendingUp className={`w-4 h-4 ${stats.bookingsChange < 0 ? 'rotate-180' : ''}`} />
              {stats.bookingsChange >= 0 ? '+' : ''}{stats.bookingsChange}%
            </div>
          </div>
          <p className="text-3xl font-bold gradient-text">{stats.recentBookings}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Vorperiode: {stats.previousBookings}
          </p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Euro className="w-5 h-5 text-primary" />
          Umsatzentwicklung (30 Tage)
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorUmsatz" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174 72% 50%)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(174 72% 50%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(215 20% 65%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215 20% 65%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="umsatz"
                stroke="hsl(174 72% 50%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUmsatz)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bookings Trend Chart */}
      <div className="glass rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Buchungstrend (30 Tage)
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(215 20% 65%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(215 20% 65%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="buchungen"
                stroke="hsl(174 72% 50%)"
                strokeWidth={2}
                dot={{ fill: 'hsl(174 72% 50%)', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: 'hsl(174 72% 50%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Distribution */}
      {categoryData.length > 0 && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-primary" />
            Umsatz nach Fahrzeugkategorie
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 16% 18%)" horizontal={false} />
                <XAxis 
                  type="number"
                  stroke="hsl(215 20% 65%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}€`}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  stroke="hsl(215 20% 65%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const value = payload[0]?.value;
                      const formattedValue = typeof value === 'number' ? value.toFixed(2) : value;
                      return (
                        <div className="glass rounded-lg p-3 border border-border">
                          <p className="text-sm font-medium">{payload[0]?.payload?.name}</p>
                          <p className="text-sm text-primary">Umsatz: {formattedValue}€</p>
                          <p className="text-sm text-muted-foreground">Buchungen: {payload[0]?.payload?.buchungen}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="umsatz" 
                  fill="hsl(174 72% 50%)" 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCharts;
