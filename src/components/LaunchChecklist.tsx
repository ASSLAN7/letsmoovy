import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, Circle, Car, Cpu, Key, MapPin, 
  CreditCard, Mail, Shield, Rocket, ExternalLink 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  status: 'done' | 'pending' | 'manual';
  category: 'backend' | 'hardware' | 'config' | 'legal';
  link?: string;
}

const LaunchChecklist = () => {
  const [items] = useState<ChecklistItem[]>([
    // Backend - Done
    {
      id: 'supabase',
      title: 'Datenbank eingerichtet',
      description: 'Supabase mit allen Tabellen, RLS-Policies und Funktionen',
      status: 'done',
      category: 'backend',
    },
    {
      id: 'auth',
      title: 'Authentifizierung aktiv',
      description: 'Login/Registrierung mit E-Mail-Bestätigung',
      status: 'done',
      category: 'backend',
    },
    {
      id: 'booking',
      title: 'Buchungssystem funktioniert',
      description: 'Verfügbarkeitsprüfung, Buchung, Stornierung',
      status: 'done',
      category: 'backend',
    },
    {
      id: 'emails',
      title: 'E-Mail-Benachrichtigungen',
      description: 'Buchungsbestätigung, Erinnerungen, Stornierung',
      status: 'done',
      category: 'backend',
    },
    {
      id: 'admin',
      title: 'Admin-Dashboard',
      description: 'Verwaltung von Fahrzeugen, Buchungen, Nutzern',
      status: 'done',
      category: 'backend',
    },
    {
      id: 'vehicle-control',
      title: 'Fahrzeugsteuerungs-API',
      description: 'Edge Function für Entsperren/Sperren/Hupen/Blinken',
      status: 'done',
      category: 'backend',
    },
    
    // Hardware - Pending
    {
      id: 'telematic-hardware',
      title: 'Telematik-Hardware bestellen',
      description: 'Telematik-Boxen für jedes Fahrzeug (z.B. Invers, Geotab, Autopi)',
      status: 'manual',
      category: 'hardware',
      link: 'https://invers.com',
    },
    {
      id: 'telematic-install',
      title: 'Hardware in Fahrzeugen installieren',
      description: 'Telematik-Box mit CAN-Bus verbinden',
      status: 'manual',
      category: 'hardware',
    },
    {
      id: 'telematic-api',
      title: 'Telematik-API-Zugang einrichten',
      description: 'API-Key und Endpoint vom Anbieter erhalten',
      status: 'pending',
      category: 'hardware',
    },
    
    // Config - Pending
    {
      id: 'telematic-secrets',
      title: 'Telematik-Secrets konfigurieren',
      description: 'TELEMATIC_PROVIDER, TELEMATIC_API_URL, TELEMATIC_API_KEY',
      status: 'pending',
      category: 'config',
    },
    {
      id: 'vehicles-db',
      title: 'Fahrzeuge in Datenbank eintragen',
      description: 'Name, Standort, Preis, Hardware-ID für jedes Fahrzeug',
      status: 'pending',
      category: 'config',
    },
    {
      id: 'mapbox',
      title: 'Mapbox-Token konfiguriert',
      description: 'Kartenansicht für Fahrzeugstandorte',
      status: 'done',
      category: 'config',
    },
    {
      id: 'resend',
      title: 'E-Mail-Service (Resend) konfiguriert',
      description: 'API-Key für E-Mail-Versand',
      status: 'done',
      category: 'config',
    },
    
    // Legal - Manual
    {
      id: 'insurance',
      title: 'Versicherung abschließen',
      description: 'Kfz-Haftpflicht und Kaskoversicherung für Carsharing',
      status: 'manual',
      category: 'legal',
    },
    {
      id: 'agb',
      title: 'AGB und Nutzungsbedingungen',
      description: 'Rechtliche Dokumente für Carsharing-Dienst',
      status: 'manual',
      category: 'legal',
    },
    {
      id: 'payment',
      title: 'Zahlungsanbieter integrieren',
      description: 'Stripe oder anderer Payment Provider',
      status: 'pending',
      category: 'config',
    },
  ]);

  const categoryLabels = {
    backend: { label: 'Backend', icon: Cpu },
    hardware: { label: 'Hardware', icon: Car },
    config: { label: 'Konfiguration', icon: Key },
    legal: { label: 'Rechtliches', icon: Shield },
  };

  const doneCount = items.filter(i => i.status === 'done').length;
  const progress = (doneCount / items.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Rocket className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Launch-Checkliste</h2>
            <p className="text-muted-foreground">
              {doneCount} von {items.length} Aufgaben erledigt
            </p>
          </div>
        </div>
        
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Checklist by Category */}
      {Object.entries(categoryLabels).map(([category, { label, icon: Icon }]) => {
        const categoryItems = items.filter(i => i.category === category);
        const categoryDone = categoryItems.filter(i => i.status === 'done').length;
        
        return (
          <div key={category} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Icon className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">{label}</h3>
              <Badge variant={categoryDone === categoryItems.length ? 'default' : 'secondary'}>
                {categoryDone}/{categoryItems.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    item.status === 'done' 
                      ? 'bg-green-500/10' 
                      : item.status === 'manual'
                      ? 'bg-yellow-500/10'
                      : 'bg-muted/50'
                  }`}
                >
                  {item.status === 'done' ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${
                        item.status === 'done' ? 'text-green-500' : 'text-foreground'
                      }`}>
                        {item.title}
                      </span>
                      {item.status === 'manual' && (
                        <Badge variant="outline" className="text-xs">Manuell</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {item.link && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Next Steps */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Nächste Schritte
        </h3>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. Telematik-Hardware bestellen und in Fahrzeugen installieren</li>
          <li>2. API-Zugangsdaten vom Telematik-Anbieter erhalten</li>
          <li>3. Secrets im Backend konfigurieren (TELEMATIC_PROVIDER, etc.)</li>
          <li>4. Fahrzeuge mit Hardware-IDs in der Datenbank eintragen</li>
          <li>5. Zahlungsanbieter (Stripe) integrieren</li>
          <li>6. Testfahrt durchführen</li>
          <li>7. 🚀 Launch!</li>
        </ol>
      </div>
    </div>
  );
};

export default LaunchChecklist;
