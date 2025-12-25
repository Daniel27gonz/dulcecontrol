import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Plus, MoreVertical, Download, Smartphone, Monitor, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, isAndroid, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Log estado inicial para debugging
    console.log('[PWA InstallPrompt] Estado inicial:', {
      isInstallable,
      isInstalled,
      isIOS,
      isAndroid,
      userAgent: navigator.userAgent
    });

    // Verificar si fue dismisseado recientemente
    const dismissedBefore = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedBefore) {
      const dismissedTime = parseInt(dismissedBefore);
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60);
      console.log('[PWA InstallPrompt] Horas desde dismiss:', hoursSinceDismissed.toFixed(1));
      
      // Solo mostrar de nuevo después de 24 horas
      if (hoursSinceDismissed < 24) {
        console.log('[PWA InstallPrompt] Prompt aún en cooldown');
        setDismissed(true);
        return;
      }
    }

    // Mostrar popup después de 2 segundos
    const timer = setTimeout(() => {
      if (!isInstalled && !dismissed) {
        console.log('[PWA InstallPrompt] ✅ Mostrando popup de instalación');
        setShowPrompt(true);
      } else {
        console.log('[PWA InstallPrompt] No se muestra popup:', { isInstalled, dismissed });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled, dismissed, isInstallable, isIOS, isAndroid]);

  const handleDismiss = () => {
    console.log('[PWA InstallPrompt] Usuario cerró el popup');
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    console.log('[PWA InstallPrompt] Botón instalar presionado');
    setIsInstalling(true);
    
    try {
      if (isInstallable) {
        console.log('[PWA InstallPrompt] Intentando instalación automática...');
        const installed = await promptInstall();
        console.log('[PWA InstallPrompt] Resultado instalación:', installed);
        
        if (installed) {
          setShowPrompt(false);
        }
      } else {
        console.log('[PWA InstallPrompt] Instalación automática no disponible');
      }
    } catch (error) {
      console.error('[PWA InstallPrompt] Error en instalación:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  // No mostrar si ya está instalado
  if (isInstalled) {
    console.log('[PWA InstallPrompt] App ya instalada - no mostrar prompt');
    return null;
  }

  // No mostrar si fue dismisseado o no es hora de mostrarlo
  if (dismissed || !showPrompt) return null;

  const getPlatformIcon = () => {
    if (isIOS || isAndroid) return <Smartphone className="w-5 h-5" />;
    return <Monitor className="w-5 h-5" />;
  };

  const getPlatformName = () => {
    if (isIOS) return 'iPhone/iPad';
    if (isAndroid) return 'Android';
    return 'tu dispositivo';
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Overlay oscuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40"
            onClick={handleDismiss}
          />
          
          {/* Popup principal */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-4 md:left-auto md:right-4 md:w-[420px]"
          >
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-elevated">
              {/* Encabezado con gradiente */}
              <div className="bg-gradient-to-r from-caramel to-accent p-6 text-center">
                <div className="w-20 h-20 mx-auto mb-3 rounded-2xl bg-card/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <span className="text-5xl">🧁</span>
                </div>
                <h3 className="text-xl font-bold text-primary-foreground">
                  ¡Instala CostoPostres!
                </h3>
                <p className="text-sm text-primary-foreground/80 mt-1">
                  Accede más rápido desde tu pantalla de inicio
                </p>
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
              <div className="p-6">
                {/* Beneficios */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">⚡</span>
                    </div>
                    <span className="text-foreground">Acceso instantáneo sin abrir el navegador</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📱</span>
                    </div>
                    <span className="text-foreground">Funciona como app nativa en {getPlatformName()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">🔒</span>
                    </div>
                    <span className="text-foreground">Tus datos siempre seguros y disponibles</span>
                  </div>
                </div>

                {/* Botón de instalación o instrucciones */}
                {isInstallable ? (
                  <Button 
                    onClick={handleInstall} 
                    variant="warm" 
                    size="lg" 
                    className="w-full text-base font-semibold h-14 rounded-xl"
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
                        Instalar App Gratis
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      {getPlatformIcon()}
                      <span>Instrucciones para {getPlatformName()}</span>
                    </div>
                    
                    {isIOS ? (
                      <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                            <Share className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Paso 1</p>
                            <p className="text-sm text-muted-foreground">Toca el botón <strong>Compartir</strong> en Safari</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                            <Plus className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Paso 2</p>
                            <p className="text-sm text-muted-foreground">Selecciona <strong>"Agregar a inicio"</strong></p>
                          </div>
                        </div>
                      </div>
                    ) : isAndroid ? (
                      <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                            <MoreVertical className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Paso 1</p>
                            <p className="text-sm text-muted-foreground">Abre el <strong>menú</strong> del navegador (⋮)</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                            <Download className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Paso 2</p>
                            <p className="text-sm text-muted-foreground">Toca <strong>"Instalar app"</strong> o <strong>"Agregar a inicio"</strong></p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 bg-muted/50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
                            <Download className="w-5 h-5 text-primary-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground">Instalación</p>
                            <p className="text-sm text-muted-foreground">Busca el ícono de <strong>instalación</strong> en la barra de direcciones del navegador</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Link para cerrar */}
                <button
                  onClick={handleDismiss}
                  className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
