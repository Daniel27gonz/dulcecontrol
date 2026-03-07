import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Lightbulb, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TutorialStep {
  title: string;
  description: string;
  emoji: string;
  tip: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "¡Bienvenida a tu calculadora!",
    description: "Te guiaremos paso a paso para crear tu primera receta y calcular su precio de venta correctamente.",
    emoji: "👋",
    tip: "Este tutorial solo toma 1 minuto y te ahorrará mucho tiempo después."
  },
  {
    title: "Paso 1: Nombre y categoría",
    description: "Primero ponle nombre a tu postre y selecciona la categoría. Esto te ayudará a organizarte cuando tengas muchas recetas.",
    emoji: "🧁",
    tip: "Ejemplo: 'Torta de chocolate 15 personas' es más específico que solo 'Torta'"
  },
  {
    title: "Paso 2: Ingredientes",
    description: "Agrega cada ingrediente con su precio por unidad y la cantidad que usas. El costo se calcula automáticamente.",
    emoji: "📝",
    tip: "Si el kilo de harina cuesta $2,000 y usas 500g, pon precio: $2 por gramo, cantidad: 500g"
  },
  {
    title: "Paso 3: Gastos del mes",
    description: "Aquí van los costos que no son ingredientes: gas, luz, empaque, tu tiempo de trabajo, etc.",
    emoji: "💡",
    tip: "¡No olvides tu mano de obra! Tu tiempo también tiene valor."
  },
  {
    title: "Paso 4: Margen de ganancia",
    description: "Elige cuánto porcentaje quieres ganar sobre tu costo. Recomendamos entre 50-80% para postres elaborados.",
    emoji: "💰",
    tip: "Un margen del 50% significa que si tu costo es $100, venderás a $150"
  },
  {
    title: "¡Listo para empezar!",
    description: "El resultado final te mostrará el precio sugerido de venta y tu ganancia por cada postre.",
    emoji: "🎉",
    tip: "Puedes guardar la receta y usarla después para crear cotizaciones rápidamente."
  }
];

interface RecipeTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function RecipeTutorial({ isOpen, onClose, onComplete }: RecipeTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card rounded-3xl shadow-xl overflow-hidden border border-border"
          >
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 pt-6 pb-2">
              {TUTORIAL_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-6 bg-primary'
                      : index < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="p-6 pt-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="text-center"
                >
                  {/* Emoji */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                    className="text-6xl mb-4"
                  >
                    {step.emoji}
                  </motion.div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h2>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {step.description}
                  </p>

                  {/* Tip box */}
                  <div className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-full bg-primary/20">
                        <Lightbulb className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm text-left text-foreground/80">
                        {step.tip}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 pt-0 flex items-center gap-3">
              {currentStep > 0 ? (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Atrás
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="flex-1 text-muted-foreground"
                >
                  Saltar tutorial
                </Button>
              )}
              
              <Button
                onClick={handleNext}
                className="flex-1"
              >
                {isLastStep ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    ¡Empezar!
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
