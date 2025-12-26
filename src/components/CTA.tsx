import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass rounded-3xl p-12 md:p-16 text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2 mb-6"
          >
            <Sparkles size={16} className="text-primary" />
            <span className="text-sm text-primary font-medium">Jetzt kostenlos starten</span>
          </motion.div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Bereit für die Zukunft der{" "}
            <span className="gradient-text">Mobilität?</span>
          </h2>

          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Registriere dich jetzt und erhalte 30 Freiminuten auf deine erste Fahrt. 
            Keine Kreditkarte erforderlich.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl">
              Kostenlos registrieren
              <ArrowRight size={20} />
            </Button>
            <Button variant="glass" size="xl">
              App herunterladen
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Über 100.000 zufriedene Nutzer vertrauen MOOVY
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
