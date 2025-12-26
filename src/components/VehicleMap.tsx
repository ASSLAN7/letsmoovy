import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { motion } from 'framer-motion';
import { Car, Battery, MapPin, Clock, X, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Mock vehicle data - in production this would come from your backend
const mockVehicles = [
  {
    id: 1,
    name: 'Urban E',
    category: 'Compact',
    coordinates: [13.405, 52.52] as [number, number],
    battery: 85,
    range: '153 km',
    price: '0,29€/min',
    available: true,
    address: 'Alexanderplatz 1, Berlin'
  },
  {
    id: 2,
    name: 'Luxury S',
    category: 'Sedan',
    coordinates: [13.377, 52.516] as [number, number],
    battery: 72,
    range: '324 km',
    price: '0,49€/min',
    available: true,
    address: 'Brandenburger Tor, Berlin'
  },
  {
    id: 3,
    name: 'Family X',
    category: 'SUV',
    coordinates: [13.429, 52.523] as [number, number],
    battery: 45,
    range: '171 km',
    price: '0,59€/min',
    available: true,
    address: 'Friedrichshain, Berlin'
  },
  {
    id: 4,
    name: 'Urban E',
    category: 'Compact',
    coordinates: [13.390, 52.507] as [number, number],
    battery: 92,
    range: '165 km',
    price: '0,29€/min',
    available: false,
    address: 'Checkpoint Charlie, Berlin'
  },
  {
    id: 5,
    name: 'Luxury S',
    category: 'Sedan',
    coordinates: [13.365, 52.530] as [number, number],
    battery: 100,
    range: '450 km',
    price: '0,49€/min',
    available: true,
    address: 'Hauptbahnhof, Berlin'
  },
  {
    id: 6,
    name: 'Urban E',
    category: 'Compact',
    coordinates: [13.445, 52.510] as [number, number],
    battery: 67,
    range: '120 km',
    price: '0,29€/min',
    available: true,
    address: 'Kreuzberg, Berlin'
  },
];

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

const VehicleMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [isMapReady, setIsMapReady] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(true);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [13.405, 52.52], // Berlin
      zoom: 12,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setIsMapReady(true);
      addVehicleMarkers();
    });
  };

  const addVehicleMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    mockVehicles.forEach((vehicle) => {
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'vehicle-marker';
      el.innerHTML = `
        <div class="relative cursor-pointer transform transition-transform hover:scale-110">
          <div class="${vehicle.available 
            ? 'bg-gradient-to-br from-teal-400 to-cyan-500' 
            : 'bg-gray-500'
          } w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
            vehicle.available ? 'shadow-teal-500/50' : ''
          }">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C1.4 11.5 1 12.2 1 13v3c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <path d="M9 17h6"/>
              <circle cx="17" cy="17" r="2"/>
            </svg>
          </div>
          ${vehicle.available ? `
            <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse"></div>
          ` : ''}
        </div>
      `;

      el.addEventListener('click', () => {
        setSelectedVehicle(vehicle);
        map.current?.flyTo({
          center: vehicle.coordinates,
          zoom: 15,
          pitch: 60,
        });
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat(vehicle.coordinates)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  };

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
      initializeMap(mapboxToken.trim());
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  const availableCount = mockVehicles.filter(v => v.available).length;

  return (
    <section id="locations" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider">
            Fahrzeuge in der Nähe
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Finde dein <span className="gradient-text">MOOVY</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            {availableCount} Fahrzeuge verfügbar in deiner Nähe. Klicke auf ein Fahrzeug für Details.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          {/* Map Container */}
          <div className="relative h-[600px] rounded-2xl overflow-hidden glass">
            {showTokenInput ? (
              <div className="absolute inset-0 flex items-center justify-center bg-card/95 backdrop-blur-sm z-10">
                <div className="max-w-md w-full p-8 text-center">
                  <div className="w-16 h-16 rounded-full gradient-accent mx-auto mb-6 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Mapbox Token benötigt</h3>
                  <p className="text-muted-foreground mb-6">
                    Um die interaktive Karte zu nutzen, benötigst du einen Mapbox Public Token. 
                    Du findest diesen in deinem{' '}
                    <a 
                      href="https://mapbox.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Mapbox Dashboard
                    </a>.
                  </p>
                  <form onSubmit={handleTokenSubmit} className="space-y-4">
                    <Input
                      type="text"
                      placeholder="pk.eyJ1Ijoi..."
                      value={mapboxToken}
                      onChange={(e) => setMapboxToken(e.target.value)}
                      className="bg-secondary border-border"
                    />
                    <Button type="submit" variant="hero" className="w-full">
                      Karte laden
                    </Button>
                  </form>
                </div>
              </div>
            ) : null}
            
            <div ref={mapContainer} className="absolute inset-0" />
            
            {/* Gradient overlays */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/20 via-transparent to-background/40" />
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-background/20 via-transparent to-background/20" />
          </div>

          {/* Vehicle Details Panel */}
          {selectedVehicle && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-4 right-4 w-80 glass rounded-xl p-6 z-20"
            >
              <button
                onClick={() => setSelectedVehicle(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedVehicle.available 
                    ? 'gradient-accent' 
                    : 'bg-muted'
                }`}>
                  <Car className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{selectedVehicle.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedVehicle.category}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm">
                  <MapPin size={16} className="text-primary" />
                  <span className="text-muted-foreground">{selectedVehicle.address}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Battery size={16} className="text-primary" />
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Akku</span>
                      <span className="text-foreground font-medium">{selectedVehicle.battery}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          selectedVehicle.battery > 50 
                            ? 'gradient-accent' 
                            : selectedVehicle.battery > 20 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedVehicle.battery}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Navigation size={16} className="text-primary" />
                  <span className="text-muted-foreground">Reichweite: {selectedVehicle.range}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-primary" />
                  <span className="text-muted-foreground">{selectedVehicle.price}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  selectedVehicle.available
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {selectedVehicle.available ? 'Verfügbar' : 'Gebucht'}
                </span>
                <span className="text-2xl font-bold gradient-text">
                  {selectedVehicle.price.split('/')[0]}
                  <span className="text-sm text-muted-foreground">/min</span>
                </span>
              </div>

              <Button 
                variant={selectedVehicle.available ? "hero" : "secondary"} 
                className="w-full"
                disabled={!selectedVehicle.available}
              >
                {selectedVehicle.available ? 'Jetzt buchen' : 'Nicht verfügbar'}
              </Button>
            </motion.div>
          )}

          {/* Legend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="absolute bottom-4 left-4 glass rounded-lg px-4 py-3 z-10"
          >
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full gradient-accent" />
                <span className="text-muted-foreground">Verfügbar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-muted" />
                <span className="text-muted-foreground">Gebucht</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default VehicleMap;
