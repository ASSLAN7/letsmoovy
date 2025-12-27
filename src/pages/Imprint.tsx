import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Imprint = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-32 pb-20">
        <div className="container px-6 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-8 gradient-text">Impressum</h1>
            
            <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Angaben gemäß § 5 TMG</h2>
                <p>
                  MOOVY GmbH<br />
                  Musterstraße 123<br />
                  10115 Berlin<br />
                  Deutschland
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Kontakt</h2>
                <p>
                  Telefon: +49 30 123 456 789<br />
                  E-Mail: hello@moovy.de<br />
                  Website: www.moovy.de
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Vertretungsberechtigte Geschäftsführer</h2>
                <p>
                  Max Mustermann<br />
                  Maria Musterfrau
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Registereintrag</h2>
                <p>
                  Eintragung im Handelsregister<br />
                  Registergericht: Amtsgericht Berlin-Charlottenburg<br />
                  Registernummer: HRB 123456
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Umsatzsteuer-ID</h2>
                <p>
                  Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                  DE 123 456 789
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
                <p>
                  Max Mustermann<br />
                  Musterstraße 123<br />
                  10115 Berlin
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Streitschlichtung</h2>
                <p>
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                  <a href="https://ec.europa.eu/consumers/odr/" className="text-primary hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                    https://ec.europa.eu/consumers/odr/
                  </a>
                </p>
                <p className="mt-4">
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">Haftung für Inhalte</h2>
                <p>
                  Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
                </p>
              </section>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Imprint;