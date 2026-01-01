import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Download, Sparkles, Zap, ShieldCheck, MoreVertical, Plus, ArrowUp, Smartphone, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall, Platform } from '@/hooks/usePWAInstall';
import { useState, useEffect } from 'react';

export function InstallPrompt() {
  const { isInstallable, isInstalled, isIOS, isAndroid, platform, isSafari, isChrome, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    console.log('[PWA Prompt] 📊 Estado actual:', { 
      isInstallable, 
      isInstalled, 
      isIOS, 
      isAndroid,
      platform,
      isSafari,
      isChrome,
      dismissed
    });

    // Verificar cooldown de 24 horas
    const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedTime) {
      const hoursSince = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      console.log('[PWA Prompt] ⏰ Horas desde última dismissión:', hoursSince.toFixed(2));
      if (hoursSince < 24) {
        console.log('[PWA Prompt] ⏸️ Cooldown activo, no mostramos popup');
        setDismissed(true);
        return;
      }
    }

    // Mostrar popup después de 2 segundos - SIN condiciones que lo bloqueen
    console.log('[PWA Prompt] ⏳ Iniciando timer de 2 segundos...');
    const timer = setTimeout(() => {
      console.log('[PWA Prompt] ⏰ Timer completado, verificando condiciones...');
      
      if (isInstalled) {
        console.log('[PWA Prompt] 📲 App ya instalada, no mostramos popup');
        return;
      }
      
      if (dismissed) {
        console.log('[PWA Prompt] 🚫 Popup fue dismisseado, no mostramos');
        return;
      }
      
      console.log('[PWA Prompt] ✅ Mostrando popup de instalación!');
      setShowPrompt(true);
    }, 2000);

    return () => {
      console.log('[PWA Prompt] 🧹 Limpiando timer');
      clearTimeout(timer);
    };
  }, [isInstalled, dismissed]);

  const handleDismiss = () => {
    console.log('[PWA Prompt] ❌ Usuario cerró el popup');
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    console.log('[PWA Prompt] 🚀 Usuario intentó instalar');
    setIsInstalling(true);
    
    try {
      if (isInstallable) {
        console.log('[PWA Prompt] 📲 Intentando instalación automática...');
        const installed = await promptInstall();
        if (installed) {
          console.log('[PWA Prompt] ✅ Instalación exitosa!');
          setShowPrompt(false);
        } else {
          console.log('[PWA Prompt] ⚠️ Usuario canceló instalación');
          // No mostrar instrucciones, simplemente cerrar
          setShowPrompt(false);
        }
      } else if (isIOS) {
        // Solo en iOS mostramos instrucciones porque no soporta beforeinstallprompt
        console.log('[PWA Prompt] 📱 iOS detectado, mostrando instrucciones');
        setShowInstructions(true);
      } else {
        // En otros navegadores que no disparan el evento, cerrar
        console.log('[PWA Prompt] ⚠️ No hay prompt nativo disponible');
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('[PWA Prompt] ❌ Error:', error);
      setShowPrompt(false);
    } finally {
      setIsInstalling(false);
    }
  };

  // Instrucciones específicas por plataforma
  const renderInstructions = () => {
    if (isIOS) {
      return (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-foreground">Instalar en iPhone/iPad</h4>
            <p className="text-sm text-muted-foreground">Sigue estos pasos en Safari</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Toca el ícono de <span className="font-semibold">Compartir</span>
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Share className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">(cuadrado con flecha hacia arriba)</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Desliza y toca <span className="font-semibold">"Agregar a pantalla de inicio"</span>
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <Plus className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Add to Home Screen</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-success">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Toca <span className="font-semibold">"Agregar"</span> en la esquina superior
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isAndroid) {
      return (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h4 className="font-bold text-foreground">Instalar en Android</h4>
            <p className="text-sm text-muted-foreground">Sigue estos pasos en Chrome</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Toca el <span className="font-semibold">menú de 3 puntos</span>
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <MoreVertical className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">(esquina superior derecha)</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Busca <span className="font-semibold">"Instalar aplicación"</span> o <span className="font-semibold">"Añadir a pantalla de inicio"</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-success">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground">
                  Toca <span className="font-semibold">"Instalar"</span> para confirmar
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Desktop
    return (
      <div className="space-y-4">
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
            <Monitor className="w-6 h-6 text-white" />
          </div>
          <h4 className="font-bold text-foreground">Instalar en Computadora</h4>
          <p className="text-sm text-muted-foreground">Sigue estos pasos en tu navegador</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Busca el <span className="font-semibold">ícono de instalación</span> en la barra de direcciones
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Download className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">(o el ícono + junto a la URL)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-success">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground">
                Haz clic en <span className="font-semibold">"Instalar"</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // No mostrar si ya está instalado
  if (isInstalled) {
    console.log('[PWA Prompt] 📲 Oculto: App ya instalada');
    return null;
  }

  // No mostrar si fue dismisseado
  if (dismissed && !showPrompt) {
    console.log('[PWA Prompt] 🚫 Oculto: Popup dismisseado');
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-40"
            onClick={handleDismiss}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-[420px]"
          >
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border shadow-2xl">
              {/* Header con gradiente */}
              <div className="relative p-4 sm:p-6 text-center overflow-hidden bg-gradient-to-br from-primary via-caramel to-secondary">
                {/* Efectos decorativos */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                
                <div className="relative">
                  {/* Icono animado */}
                  <motion.div 
                    className="w-18 h-18 sm:w-24 sm:h-24 mx-auto mb-3 sm:mb-4 rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl border-2 border-white/30"
                    style={{ width: '72px', height: '72px' }}
                    animate={{ 
                      y: [0, -5, 0],
                      rotate: [0, 2, -2, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <span className="text-5xl sm:text-6xl drop-shadow-lg">🧁</span>
                  </motion.div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">
                    ¡Instala CostoPostres!
                  </h3>
                  <p className="text-xs sm:text-sm text-white/90 mt-1.5 sm:mt-2 max-w-xs mx-auto">
                    Acceso rápido desde tu pantalla de inicio
                  </p>
                </div>
                
                {/* Botón cerrar */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 sm:p-2.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors border border-white/20"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>
              </div>

              {/* Contenido */}
              <div className="p-4 sm:p-5">
                {showInstructions ? (
                  <>
                    {renderInstructions()}
                    <Button 
                      onClick={() => setShowInstructions(false)}
                      variant="outline"
                      className="w-full mt-4"
                    >
                      Volver
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Beneficios */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-5">
                      <motion.div 
                        className="text-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-amber-900">Ultra Rápido</span>
                      </motion.div>
                      
                      <motion.div 
                        className="text-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-green-900">Sin Internet</span>
                      </motion.div>
                      
                      <motion.div 
                        className="text-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50"
                        whileHover={{ scale: 1.05 }}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-1.5 sm:mb-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-blue-900">100% Segura</span>
                      </motion.div>
                    </div>

                    {/* Texto motivacional */}
                    <div className="text-center mb-4 sm:mb-5 p-2.5 sm:p-3 bg-muted/30 rounded-lg sm:rounded-xl border border-border/50">
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        📲 <span className="text-foreground font-medium">¡Instala gratis!</span> Sin ocupar espacio y siempre actualizada
                      </p>
                    </div>

                    {/* Botón principal */}
                    <Button 
                      onClick={handleInstall} 
                      variant="warm" 
                      size="lg" 
                      className="w-full text-sm sm:text-base font-bold h-12 sm:h-14 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all"
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
                          <span className="hidden sm:inline">Instalar Ahora — ¡Es Gratis!</span>
                          <span className="sm:hidden">Instalar Gratis</span>
                        </>
                      )}
                    </Button>

                    {/* Indicador de plataforma */}
                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                      {isIOS && <span className="flex items-center gap-1">🍎 iPhone/iPad</span>}
                      {isAndroid && <span className="flex items-center gap-1">🤖 Android</span>}
                      {!isIOS && !isAndroid && <span className="flex items-center gap-1">💻 Escritorio</span>}
                      {isInstallable && <span className="text-success font-medium">• Instalación rápida disponible</span>}
                    </div>

                    {/* Link para cerrar */}
                    <button
                      onClick={handleDismiss}
                      className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                    >
                      Quizás más tarde
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
