import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const Terms = () => {
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
            <h1 className="text-4xl font-bold mb-8 gradient-text">Allgemeine Geschäftsbedingungen</h1>
            
            <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">§ 1 Geltungsbereich</h2>
                <p>
                  Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB") gelten für alle Verträge, die zwischen MOOVY GmbH (nachfolgend „Anbieter") und dem Kunden über die Nutzung des Carsharing-Dienstes geschlossen werden.
                </p>
                <p className="mt-4">
                  Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">§ 2 Registrierung und Vertragsschluss</h2>
                <p>
                  Die Nutzung des Carsharing-Dienstes setzt eine vorherige Registrierung voraus. Der Kunde muss bei der Registrierung wahrheitsgemäße Angaben machen und einen gültigen Führerschein nachweisen.
                </p>
                <p className="mt-4">
                  Der Vertrag kommt zustande, wenn der Anbieter die Registrierung des Kunden bestätigt und ihm Zugang zum Dienst gewährt.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">§ 3 Buchung und Nutzung</h2>
                <p>
                  Die Buchung eines Fahrzeugs erfolgt über die App oder Website des Anbieters. Der Kunde ist verpflichtet, das Fahrzeug pfleglich zu behandeln und alle Verkehrsregeln einzuhalten.
                </p>
                <p className="mt-4">
                  Das Fahrzeug darf nur vom registrierten Kunden geführt werden. Eine Weitergabe an Dritte ist nicht gestattet.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">§ 4 Preise und Zahlung</h2>
                <p>
                  Die aktuellen Preise sind in der Preisliste auf der Website und in der App einsehbar. Die Abrechnung erfolgt minutengenau nach Ende der Fahrt.
                </p>
                <p className="mt-4">
                  Der Kunde ermächtigt den Anbieter, die fälligen Beträge von dem hinterlegten Zahlungsmittel einzuziehen.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">§ 5 Haftung</h2>
                <p>
                  Der Kunde haftet für alle Schäden, die während der Nutzung des Fahrzeugs entstehen, soweit er diese zu vertreten hat. Bei Unfällen ist der Kunde verpflichtet, den Anbieter unverzüglich zu informieren.
                </p>
                <p className="mt-4">
                  Die Haftung des Anbieters für leicht fahrlässig verursachte Schäden ist ausgeschlossen, soweit diese keine vertragswesentlichen Pflichten betreffen.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">§ 6 Kündigung</h2>
                <p>
                  Beide Parteien können das Vertragsverhältnis jederzeit mit einer Frist von 14 Tagen zum Monatsende kündigen. Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-foreground mb-4">§ 7 Schlussbestimmungen</h2>
                <p>
                  Es gilt das Recht der Bundesrepublik Deutschland. Gerichtsstand ist Berlin, sofern der Kunde Kaufmann ist oder keinen allgemeinen Gerichtsstand in Deutschland hat.
                </p>
                <p className="mt-4">
                  Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
                </p>
              </section>

              <p className="text-sm mt-12 pt-8 border-t border-border">
                Stand: Dezember 2024
              </p>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;