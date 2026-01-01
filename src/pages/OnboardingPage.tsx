import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calculator, TrendingUp, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';

const CURRENCIES = [
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano' },
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno' },
];

const ONBOARDING_STEPS = [
  {
    icon: Calculator,
    title: 'Calcula tus costos fácilmente',
    description: 'Ingresa tus ingredientes y gastos, y la app calculará automáticamente cuánto te cuesta hacer cada postre.',
    emoji: '🧮',
  },
  {
    icon: TrendingUp,
    title: 'Define precios rentables',
    description: 'Te sugerimos el precio ideal para que ganes lo que mereces por tu trabajo y creatividad.',
    emoji: '💰',
  },
  {
    icon: Sparkles,
    title: 'Sin conocimientos financieros',
    description: 'No necesitas saber de números ni fórmulas. Todo está diseñado para ser simple y visual.',
    emoji: '✨',
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateSettings } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState<typeof CURRENCIES[0] | null>(null);

  const totalSteps = ONBOARDING_STEPS.length + 1; // +1 for currency selection
  const isLastStep = currentStep === totalSteps - 1;

  const handleNext = () => {
    if (isLastStep && selectedCurrency) {
      updateSettings({
        currency: selectedCurrency.code,
        currencySymbol: selectedCurrency.symbol,
        hasCompletedOnboarding: true,
      });
      navigate('/dashboard');
    } else if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    updateSettings({
      currency: 'USD',
      currencySymbol: '$',
      hasCompletedOnboarding: true,
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-4 sm:p-6 safe-bottom safe-top">
      {/* Progress bar */}
      <div className="flex gap-1.5 mb-6 sm:mb-8 pt-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i <= currentStep ? 'bg-caramel' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {/* Skip button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Omitir
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {currentStep < ONBOARDING_STEPS.length ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="text-center space-y-8"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mx-auto w-24 h-24 sm:w-32 sm:h-32 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center shadow-card"
              >
                <span className="text-5xl sm:text-6xl">{ONBOARDING_STEPS[currentStep].emoji}</span>
              </motion.div>

              {/* Text */}
              <div className="space-y-3 sm:space-y-4 px-2 sm:px-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  {ONBOARDING_STEPS[currentStep].title}
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
                  {ONBOARDING_STEPS[currentStep].description}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="currency"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 sm:space-y-6"
            >
              <div className="text-center space-y-2">
                <span className="text-4xl sm:text-5xl">💱</span>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                  Selecciona tu moneda
                </h2>
                <p className="text-muted-foreground">
                  Usaremos esta moneda para todos tus cálculos
                </p>
              </div>

              <div className="grid gap-2 max-h-[50vh] sm:max-h-80 overflow-y-auto scrollbar-hide px-1">
                {CURRENCIES.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => setSelectedCurrency(currency)}
                    className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedCurrency?.code === currency.code
                        ? 'border-caramel bg-secondary'
                        : 'border-transparent bg-muted hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-card flex items-center justify-center font-bold text-caramel text-sm sm:text-base shrink-0">
                        {currency.symbol}
                      </span>
                      <div className="text-left min-w-0">
                        <p className="font-semibold text-foreground text-sm sm:text-base">{currency.code}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">{currency.name}</p>
                      </div>
                    </div>
                    {selectedCurrency?.code === currency.code && (
                      <Check className="w-5 h-5 text-caramel shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="pt-6 sm:pt-8 pb-2">
        <Button
          onClick={handleNext}
          variant="warm"
          size="lg"
          className="w-full h-12 sm:h-14 text-base"
          disabled={isLastStep && !selectedCurrency}
        >
          {isLastStep ? 'Comenzar' : 'Continuar'}
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
