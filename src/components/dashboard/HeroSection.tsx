import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Users, Cake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

export function HeroSection() {
  const navigate = useNavigate();
  const { user } = useApp();

  const userName = user?.name || 'Repostero/a';

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-b from-secondary via-background to-background rounded-2xl p-6 sm:p-8 text-center"
    >
      <div className="space-y-5">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-accent/40 text-accent-foreground rounded-full text-sm font-medium shadow-soft"
        >
          <Cake className="w-4 h-4" />
          <span>Calculadora para Reposteros</span>
        </motion.div>

        {/* Main Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-1"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
            Calculadora de Costos
          </h1>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight tracking-tight">
            <span className="text-gradient">para Postres</span>
          </h2>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto leading-relaxed"
        >
          Calcula el costo real de tus recetas, conoce tu ganancia exacta y genera cotizaciones profesionales en minutos.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col gap-3 max-w-sm mx-auto"
        >
          <Button
            onClick={() => navigate('/quotations')}
            variant="hero"
            size="xl"
            className="w-full shadow-elevated hover:shadow-glow transition-all duration-300"
          >
            <FileText className="w-5 h-5" />
            Crear Cotización
          </Button>

          <Button
            onClick={() => window.open('https://chat.whatsapp.com/FiRIRAYs1G7KX8kLNFxYTL', '_blank')}
            variant="outline"
            size="lg"
            className="w-full border-2 border-accent hover:bg-accent/20 transition-all duration-300"
          >
            <Users className="w-4 h-4" />
            Únete a nuestra comunidad privada 🎀
          </Button>
        </motion.div>

        {/* Personalized Greeting */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="pt-4 border-t border-border/50"
        >
          <p className="text-lg sm:text-xl font-bold text-foreground">
            ¡Hola, {userName}! 👋
          </p>
          <p className="text-sm text-muted-foreground">
            Tu resumen financiero de hoy
          </p>
        </motion.div>
      </div>
    </motion.section>
  );
}
