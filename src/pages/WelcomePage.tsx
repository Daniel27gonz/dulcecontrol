import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import heroImage from '@/assets/hero-desserts.jpg';

export default function WelcomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Deliciosos postres"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-6 pb-10 safe-bottom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-caramel to-accent shadow-elevated flex items-center justify-center"
          >
            <span className="text-4xl">🧁</span>
          </motion.div>

          {/* Title */}
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              Calculadora de Costos para Postres
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Calcula el precio correcto de tus postres y{' '}
              <span className="text-caramel font-semibold">gana lo que realmente vale tu trabajo</span>
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-2">
            {['Fácil de usar', 'Sin fórmulas', 'Profesional'].map((feature, i) => (
              <motion.span
                key={feature}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
              >
                ✓ {feature}
              </motion.span>
            ))}
          </div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-3 pt-4"
          >
            <Button
              onClick={() => navigate('/onboarding')}
              variant="hero"
              size="xl"
              className="w-full"
            >
              Crear cuenta gratis
            </Button>
            <Button
              onClick={() => navigate('/onboarding')}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Ya tengo cuenta
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-sm text-muted-foreground pt-2"
          >
            🔒 Tus datos están seguros y privados
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
