import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, MoreVertical, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Show prompt after 2 seconds if not installed and not dismissed
    const dismissedBefore = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedBefore) {
      const dismissedTime = parseInt(dismissedBefore);
      // Only show again after 24 hours
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
    console.log('[PWA] Install button clicked, isInstallable:', isInstallable);
    if (isInstallable) {
      const installed = await promptInstall();
      console.log('[PWA] Install result:', installed);
      if (installed) {
        setShowPrompt(false);
      }
    }
  };

  if (isInstalled || dismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
        >
          <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-elevated p-5">
            {/* Decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-caramel to-accent" />
            
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">🧁</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground mb-1">
                  Instalar CostoPostres
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Accede más rápido desde tu pantalla de inicio
                </p>

                {isInstallable ? (
                  <Button onClick={handleInstall} variant="warm" size="sm" className="w-full">
                    <Download className="w-4 h-4" />
                    Instalar ahora
                  </Button>
                ) : isIOS ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Para instalar en iPhone/iPad:</p>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <Share className="w-3.5 h-3.5" />
                      </div>
                      <span>Toca el botón Compartir</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <span>Selecciona "Agregar a inicio"</span>
                    </div>
                  </div>
                ) : isAndroid ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Para instalar en Android:</p>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </div>
                      <span>Abre el menú del navegador</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <span>Selecciona "Instalar app"</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Para instalar:</p>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <Download className="w-3.5 h-3.5" />
                      </div>
                      <span>Busca el ícono de instalación en la barra de direcciones</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
