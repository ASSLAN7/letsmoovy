import { motion } from "framer-motion";
import { Smartphone, MapPin, Key, Car } from "lucide-react";

const steps = [
  {
    icon: Smartphone,
    title: "1. App herunterladen",
    description: "Lade die MOOVY App herunter und erstelle deinen Account in wenigen Sekunden.",
  },
  {
    icon: MapPin,
    title: "2. Fahrzeug finden",
    description: "Finde verfügbare Fahrzeuge in deiner Nähe auf der interaktiven Karte.",
  },
  {
    icon: Key,
    title: "3. Buchen & Entsperren",
    description: "Buche dein Auto und entsperre es direkt über die App – ganz ohne Schlüssel.",
  },
  {
    icon: Car,
    title: "4. Losfahren & Genießen",
    description: "Fahr los und genieße deine Fahrt. Parke am Ende an einem beliebigen MOOVY-Standort.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider">
            Einfach & Schnell
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            So funktioniert <span className="gradient-text">MOOVY</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            In nur 4 Schritten zum eigenen Fahrzeug – unkompliziert und flexibel.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}

              <div className="glass rounded-2xl p-8 text-center hover:glow transition-all duration-500 h-full">
                <div className="w-20 h-20 rounded-full gradient-accent mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <step.icon className="w-10 h-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
