import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Download, Sparkles, Zap, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    console.log('[PWA] Estado:', { isInstallable, isInstalled, isIOS });

    // Verificar cooldown de 24 horas
    const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedTime) {
      const hoursSince = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        setDismissed(true);
        return;
      }
    }

    // Mostrar popup después de 2 segundos
    const timer = setTimeout(() => {
      if (!isInstalled && !dismissed) {
        setShowPrompt(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled, dismissed, isInstallable, isIOS]);

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    
    try {
      if (isInstallable) {
        const installed = await promptInstall();
        if (installed) {
          setShowPrompt(false);
        }
      }
    } catch (error) {
      console.error('[PWA] Error:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // No mostrar si ya está instalado o dismisseado
  if (isInstalled || dismissed || !showPrompt) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-40"
            onClick={handleDismiss}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:w-[400px]"
          >
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-elevated">
              {/* Header con gradiente */}
              <div className="gradient-warm p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
                <div className="relative">
                  <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-card/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                    <span className="text-5xl">🧁</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary-foreground">
                    ¡Instala Postres Rentables!
                  </h3>
                  <p className="text-sm text-primary-foreground/90 mt-1">
                    Tu negocio de postres en un clic
                  </p>
                </div>
              </div>
              
              {/* Botón cerrar */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-2 rounded-full bg-card/20 backdrop-blur-sm hover:bg-card/40 transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-primary-foreground" />
              </button>

              {/* Contenido */}
              <div className="p-5">
                {/* Beneficios compactos */}
                <div className="flex justify-around mb-5 py-3 bg-muted/30 rounded-xl">
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-caramel/10 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-caramel" />
                    </div>
                    <span className="text-xs text-muted-foreground">Rápido</span>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-success/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-xs text-muted-foreground">Offline</span>
                  </div>
                  <div className="text-center">
                    <div className="w-10 h-10 mx-auto mb-1 rounded-full bg-primary/10 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">Seguro</span>
                  </div>
                </div>

                {/* Botón de instalación o instrucciones simplificadas */}
                {isInstallable ? (
                  <Button 
                    onClick={handleInstall} 
                    variant="warm" 
                    size="lg" 
                    className="w-full text-base font-bold h-14 rounded-xl shadow-lg"
                    disabled={isInstalling}
                  >
                    {isInstalling ? (
                      <>
                        <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                        Instalando...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Instalar App — 1 Clic
                      </>
                    )}
                  </Button>
                ) : isIOS ? (
                  // Instrucciones simplificadas para iOS
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Share className="w-5 h-5 text-primary" />
                      <span className="text-sm font-semibold text-foreground">Safari</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Toca <span className="font-semibold text-foreground">Compartir</span> → <span className="font-semibold text-foreground">"Agregar a inicio"</span>
                    </p>
                  </div>
                ) : (
                  // Para Android cuando no hay prompt automático (raro)
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Busca <span className="font-semibold text-foreground">"Instalar app"</span> en el menú del navegador
                    </p>
                  </div>
                )}

                {/* Link para cerrar */}
                <button
                  onClick={handleDismiss}
                  className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  Ahora no, gracias
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
