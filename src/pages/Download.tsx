import { motion } from "framer-motion";
import { Smartphone, Apple, CheckCircle, Star, Shield, Zap, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import logoImage from "@/assets/logo.png";

const Download = () => {
  const features = [
    {
      icon: Zap,
      title: "Sofort losfahren",
      description: "Fahrzeug in Sekunden buchen und entsperren",
    },
    {
      icon: MapPin,
      title: "Überall verfügbar",
      description: "Finde Fahrzeuge in deiner Nähe",
    },
    {
      icon: Shield,
      title: "Vollkasko inklusive",
      description: "Alle Fahrzeuge sind vollständig versichert",
    },
  ];

  const reviews = [
    {
      name: "Max M.",
      rating: 5,
      text: "Super App! Einfach zu bedienen und die Autos sind immer top gepflegt.",
    },
    {
      name: "Sarah K.",
      rating: 5,
      text: "Endlich flexibles Carsharing ohne Abo. Kann ich nur empfehlen!",
    },
    {
      name: "Thomas B.",
      rating: 5,
      text: "Die beste Carsharing-App in Berlin. Schnell, günstig und zuverlässig.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="py-20 relative overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          </div>

          <div className="container px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6"
                >
                  <Smartphone size={16} className="text-primary" />
                  <span className="text-sm text-primary font-medium">Jetzt kostenlos herunterladen</span>
                </motion.div>

                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  Die <span className="gradient-text">MOOVY App</span> für unterwegs
                </h1>

                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  Lade dir die MOOVY App herunter und erlebe Carsharing der nächsten Generation. 
                  Verfügbar für iOS und Android.
                </p>

                {/* Store Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <a 
                    href="https://apps.apple.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto h-16 px-6 gap-3 bg-black hover:bg-black/90 border-white/20 text-white group-hover:border-primary transition-all duration-300"
                    >
                      <Apple className="w-8 h-8" />
                      <div className="text-left">
                        <div className="text-xs opacity-80">Laden im</div>
                        <div className="text-lg font-semibold -mt-1">App Store</div>
                      </div>
                    </Button>
                  </a>

                  <a 
                    href="https://play.google.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group"
                  >
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full sm:w-auto h-16 px-6 gap-3 bg-black hover:bg-black/90 border-white/20 text-white group-hover:border-primary transition-all duration-300"
                    >
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                      </svg>
                      <div className="text-left">
                        <div className="text-xs opacity-80">Jetzt bei</div>
                        <div className="text-lg font-semibold -mt-1">Google Play</div>
                      </div>
                    </Button>
                  </a>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>100% kostenlos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>Keine Werbung</span>
                  </div>
                </div>
              </motion.div>

              {/* Phone Mockup */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative flex justify-center"
              >
                <div className="relative">
                  {/* Phone Frame */}
                  <div className="relative w-72 h-[580px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-[3rem] p-2 shadow-2xl">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />
                    <div className="w-full h-full bg-gradient-to-b from-background via-background to-primary/10 rounded-[2.5rem] overflow-hidden flex flex-col items-center justify-center">
                      {/* App Content Preview */}
                      <img src={logoImage} alt="MOOVY" className="w-20 h-20 mb-4" />
                      <h3 className="text-2xl font-bold gradient-text mb-2">MOOVY</h3>
                      <p className="text-sm text-muted-foreground mb-6">Mobilität neu gedacht</p>
                      <div className="glass rounded-xl p-4 mx-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">3 Fahrzeuge</p>
                            <p className="text-xs text-muted-foreground">in deiner Nähe</p>
                          </div>
                        </div>
                        <Button variant="hero" size="sm" className="w-full">
                          Jetzt buchen
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/10 rounded-full blur-xl" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-card/30">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Alles in <span className="gradient-text">einer App</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Die MOOVY App bietet dir alles, was du für flexibles Carsharing brauchst.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-6 text-center hover:glow transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-20">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Das sagen unsere <span className="gradient-text">Nutzer</span>
              </h2>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-muted-foreground">4.9 von 5 Sternen im App Store</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-2xl p-6"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-foreground mb-4">"{review.text}"</p>
                  <p className="text-sm text-muted-foreground font-medium">{review.name}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass rounded-3xl p-12 text-center max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Bereit zum <span className="gradient-text">Losfahren?</span>
              </h2>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                Lade die App jetzt herunter und erhalte 30 Freiminuten auf deine erste Fahrt!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="https://apps.apple.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto h-14 px-6 gap-3 bg-black hover:bg-black/90 border-white/20 text-white"
                  >
                    <Apple className="w-6 h-6" />
                    <span>App Store</span>
                  </Button>
                </a>

                <a 
                  href="https://play.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto h-14 px-6 gap-3 bg-black hover:bg-black/90 border-white/20 text-white"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                    </svg>
                    <span>Google Play</span>
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Download;
