import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, MoreVertical, Download, Smartphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedBefore = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedBefore) {
      const dismissedTime = parseInt(dismissedBefore);
      if (Date.now() - dismissedTime < 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    const timer = setTimeout(() => {
      if (!isInstalled && !dismissed) {
        console.log('[PWA] Showing install prompt popup');
        setShowPrompt(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled, dismissed]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (isInstallable) {
      const installed = await promptInstall();
      if (installed) {
        setShowPrompt(false);
      }
    }
  };

  if (isInstalled || dismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 50 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="fixed inset-x-4 bottom-4 z-50 md:left-auto md:right-4 md:w-[380px]"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border/50 shadow-2xl">
          {/* Animated gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-caramel via-accent to-primary animate-pulse" />
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="p-6 pt-8">
            {/* Icon and sparkles */}
            <div className="flex justify-center mb-4">
              <motion.div 
                className="relative"
                animate={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-caramel to-accent flex items-center justify-center shadow-lg">
                  <span className="text-4xl">🧁</span>
                </div>
                <motion.div 
                  className="absolute -top-1 -right-1"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="w-5 h-5 text-caramel" />
                </motion.div>
              </motion.div>
            </div>

            {/* Title and description */}
            <div className="text-center mb-5">
              <h3 className="text-xl font-bold text-foreground mb-2">
                ¡Instala la app gratis!
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Accede más rápido, funciona sin internet y calcula tus precios en segundos
              </p>
            </div>

            {/* Benefits */}
            <div className="flex justify-center gap-4 mb-5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-caramel" />
                <span>Sin descargar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-caramel" />
                <span>100% gratis</span>
              </div>
            </div>

            {isInstallable ? (
              <Button 
                onClick={handleInstall} 
                variant="warm" 
                size="lg" 
                className="w-full text-base font-semibold shadow-lg"
              >
                <Download className="w-5 h-5" />
                Instalar ahora — 1 toque
              </Button>
            ) : isIOS ? (
              <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                <p className="text-sm font-medium text-foreground text-center">Sigue estos 2 pasos:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-background rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-caramel/20 flex items-center justify-center text-sm font-bold text-caramel">1</div>
                    <div className="flex items-center gap-2">
                      <Share className="w-4 h-4 text-caramel" />
                      <span className="text-sm">Toca <strong>Compartir</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-background rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-caramel/20 flex items-center justify-center text-sm font-bold text-caramel">2</div>
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4 text-caramel" />
                      <span className="text-sm">Toca <strong>Agregar a inicio</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ) : isAndroid ? (
              <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                <p className="text-sm font-medium text-foreground text-center">Sigue estos 2 pasos:</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-background rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-caramel/20 flex items-center justify-center text-sm font-bold text-caramel">1</div>
                    <div className="flex items-center gap-2">
                      <MoreVertical className="w-4 h-4 text-caramel" />
                      <span className="text-sm">Toca <strong>⋮ Menú</strong> arriba</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-background rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-caramel/20 flex items-center justify-center text-sm font-bold text-caramel">2</div>
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-caramel" />
                      <span className="text-sm">Toca <strong>Instalar app</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                <p className="text-sm font-medium text-foreground text-center">Para instalar:</p>
                <div className="flex items-center gap-3 bg-background rounded-lg p-3">
                  <Download className="w-5 h-5 text-caramel" />
                  <span className="text-sm">Busca el ícono <strong>⊕</strong> en la barra de direcciones</span>
                </div>
              </div>
            )}

            {/* Skip link */}
            <button 
              onClick={handleDismiss}
              className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Quizás más tarde
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
