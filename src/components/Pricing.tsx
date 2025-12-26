import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Flex",
    description: "Perfekt für gelegentliche Fahrten",
    price: "0€",
    period: "/Monat",
    features: [
      "Keine monatliche Grundgebühr",
      "Minutenbasierte Abrechnung",
      "Zugang zu allen Fahrzeugen",
      "24/7 Kundenservice",
    ],
    cta: "Kostenlos starten",
    popular: false,
  },
  {
    name: "Plus",
    description: "Für regelmäßige Nutzer",
    price: "19€",
    period: "/Monat",
    features: [
      "20% Rabatt auf alle Fahrten",
      "60 Freiminuten inklusive",
      "Prioritätsbuchung",
      "Premium Fahrzeuge",
      "Exklusive Angebote",
    ],
    cta: "Jetzt upgraden",
    popular: true,
  },
  {
    name: "Business",
    description: "Für Unternehmen & Teams",
    price: "49€",
    period: "/Monat",
    features: [
      "30% Rabatt auf alle Fahrten",
      "Unbegrenzte Freiminuten",
      "Mehrere Nutzer",
      "Firmenabrechnung",
      "Dedizierter Support",
      "Flottenmanagement",
    ],
    cta: "Kontakt aufnehmen",
    popular: false,
  },
];

const Pricing = () => {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="container px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider">
            Transparente Preise
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Wähle deinen <span className="gradient-text">Plan</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Flexible Tarife für jeden Bedarf – ohne versteckte Kosten.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative glass rounded-2xl p-8 ${
                plan.popular ? "ring-2 ring-primary glow" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-accent text-primary-foreground text-sm font-medium">
                  Beliebt
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2 text-foreground">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold gradient-text">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-primary" />
                    </div>
                    <span className="text-muted-foreground text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.popular ? "hero" : "outline"}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
