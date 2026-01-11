import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Users, Battery } from "lucide-react";
import { Button } from "@/components/ui/button";
import BookingDialog from "@/components/BookingDialog";
import carSuv from "@/assets/car-suv.jpg";
import carSedan from "@/assets/car-sedan.jpg";
import carCompact from "@/assets/car-compact.jpg";
import fordTransit from "@/assets/ford-transit-moovy.jpg";

const cars = [
  {
    id: 1,
    name: "Urban E",
    category: "Compact",
    price: "0,29€/min",
    priceDisplay: "0,29€",
    unit: "/min",
    image: carCompact,
    seats: 2,
    range: "180 km",
    battery: 85,
    available: true,
    coordinates: [6.7763, 51.2277] as [number, number],
    address: "Königsallee 1, Düsseldorf",
  },
  {
    id: 2,
    name: "Luxury S",
    category: "Sedan",
    price: "0,49€/min",
    priceDisplay: "0,49€",
    unit: "/min",
    image: carSedan,
    seats: 5,
    range: "450 km",
    battery: 72,
    available: true,
    coordinates: [6.7735, 51.2330] as [number, number],
    address: "Altstadt, Düsseldorf",
  },
  {
    id: 3,
    name: "Family X",
    category: "SUV",
    price: "0,59€/min",
    priceDisplay: "0,59€",
    unit: "/min",
    image: carSuv,
    seats: 7,
    range: "380 km",
    battery: 45,
    available: true,
    coordinates: [6.7950, 51.2200] as [number, number],
    address: "Medienhafen, Düsseldorf",
  },
  {
    id: 10,
    name: "Ford Transit Custom",
    category: "Transporter",
    price: "0,45€/min",
    priceDisplay: "0,45€",
    unit: "/min",
    image: fordTransit,
    seats: 3,
    range: "280 km",
    battery: 95,
    available: true,
    coordinates: [13.3761, 52.5096] as [number, number],
    address: "Potsdamer Platz 1, Berlin",
  },
];

const CarShowcase = () => {
  const [selectedCar, setSelectedCar] = useState<typeof cars[0] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleBookClick = (car: typeof cars[0]) => {
    setSelectedCar(car);
    setIsDialogOpen(true);
  };

  return (
    <section id="cars" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider">
            Unsere Flotte
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Finde dein perfektes <span className="gradient-text">Fahrzeug</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Von kompakt bis SUV – wähle das Fahrzeug, das zu deinem Abenteuer passt.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cars.map((car, index) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group glass rounded-2xl overflow-hidden hover:glow transition-all duration-500"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={car.image}
                  alt={car.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      car.available
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {car.available ? "Verfügbar" : "Gebucht"}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{car.category}</p>
                    <h3 className="text-xl font-bold text-foreground">{car.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold gradient-text">{car.priceDisplay}</span>
                    <span className="text-sm text-muted-foreground">{car.unit}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="flex gap-4 mb-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users size={16} className="text-primary" />
                    <span>{car.seats} Sitze</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Battery size={16} className="text-primary" />
                    <span>{car.range}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap size={16} className="text-primary" />
                    <span>Elektro</span>
                  </div>
                </div>

                <Button
                  variant={car.available ? "default" : "secondary"}
                  className="w-full"
                  disabled={!car.available}
                  onClick={() => handleBookClick(car)}
                >
                  {car.available ? "Jetzt buchen" : "Nicht verfügbar"}
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Booking Dialog */}
      {selectedCar && (
        <BookingDialog
          vehicle={selectedCar}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </section>
  );
};

export default CarShowcase;
