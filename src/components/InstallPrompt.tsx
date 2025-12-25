import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
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
      // Only show if automatic installation is supported
      if (!isInstalled && !dismissed && isInstallable) {
        console.log('[PWA] beforeinstallprompt available - showing install button');
        setShowPrompt(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled, dismissed, isInstallable]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    console.log('[PWA] Install button clicked - triggering native prompt');
    const installed = await promptInstall();
    if (installed) {
      console.log('[PWA] Installation successful');
      setShowPrompt(false);
    }
  };

  // Only render if: not installed, not dismissed, prompt should show, AND automatic install is available
  if (isInstalled || dismissed || !showPrompt || !isInstallable) {
    return null;
  }

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
                Accede más rápido y funciona sin internet
              </p>
            </div>

            {/* Single install button - triggers native browser prompt directly */}
            <Button 
              onClick={handleInstall} 
              variant="warm" 
              size="lg" 
              className="w-full text-base font-semibold shadow-lg"
            >
              <Download className="w-5 h-5" />
              Instalar App
            </Button>

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
