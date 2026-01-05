import { motion, AnimatePresence } from 'framer-motion';
import { X, Share, Download, Sparkles, Zap, ShieldCheck, MoreVertical, Plus, Smartphone, Monitor, Chrome, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

const PROMPT_DELAY_MS = 2000;
const COOLDOWN_HOURS = 24;
const STORAGE_KEY = 'pwa_prompt_dismissed';

export function InstallPrompt() {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isAndroid, 
    platform, 
    isSafari, 
    isChrome,
    promptInstall,
    hasNativePrompt
  } = usePWAInstall();
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Log del estado para debugging
  useEffect(() => {
    console.log('[PWA Prompt] 📊 Estado actual:', { 
      isInstallable, 
      isInstalled, 
      isIOS, 
      isAndroid,
      platform,
      isSafari,
      isChrome,
      hasNativePrompt,
      dismissed,
      showPrompt
    });
  }, [isInstallable, isInstalled, isIOS, isAndroid, platform, isSafari, isChrome, hasNativePrompt, dismissed, showPrompt]);

  // Verificar cooldown y mostrar popup
  useEffect(() => {
    // No mostrar si ya está instalado
    if (isInstalled) {
      console.log('[PWA Prompt] 📲 App ya instalada, no mostramos popup');
      return;
    }

    // Verificar cooldown de 24 horas
    const dismissedTime = localStorage.getItem(STORAGE_KEY);
    if (dismissedTime) {
      const hoursSince = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      console.log('[PWA Prompt] ⏰ Horas desde última dismissión:', hoursSince.toFixed(2));
      if (hoursSince < COOLDOWN_HOURS) {
        console.log('[PWA Prompt] ⏸️ Cooldown activo, no mostramos popup');
        setDismissed(true);
        return;
      } else {
        // Limpiar cooldown expirado
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    // Mostrar popup después del delay
    console.log(`[PWA Prompt] ⏳ Iniciando timer de ${PROMPT_DELAY_MS/1000} segundos...`);
    const timer = setTimeout(() => {
      console.log('[PWA Prompt] ⏰ Timer completado!');
      
      if (dismissed) {
        console.log('[PWA Prompt] 🚫 Popup fue dismisseado');
        return;
      }
      
      console.log('[PWA Prompt] ✅ Mostrando popup de instalación!');
      setShowPrompt(true);
    }, PROMPT_DELAY_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [isInstalled, dismissed]);

  const handleDismiss = useCallback(() => {
    console.log('[PWA Prompt] ❌ Usuario cerró el popup');
    setShowPrompt(false);
    setShowInstructions(false);
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  }, []);

  const handleInstall = useCallback(async () => {
    console.log('[PWA Prompt] 🚀 Usuario intentó instalar');
    console.log('[PWA Prompt] 📊 hasNativePrompt:', hasNativePrompt, 'isIOS:', isIOS);
    
    setIsInstalling(true);
    
    try {
      // Si hay prompt nativo disponible, usarlo directamente
      if (hasNativePrompt) {
        console.log('[PWA Prompt] 📲 Ejecutando prompt de instalación nativo...');
        const installed = await promptInstall();
        
        if (installed) {
          console.log('[PWA Prompt] ✅ Instalación exitosa!');
          toast.success('¡App instalada correctamente! 🎉', {
            description: 'Búscala en tu pantalla de inicio',
            duration: 5000
          });
          setShowPrompt(false);
        } else {
          console.log('[PWA Prompt] ⚠️ Usuario canceló el prompt');
          // No cerrar, dejar que el usuario vea las instrucciones manuales si quiere
        }
      } else if (isIOS) {
        // iOS no soporta beforeinstallprompt, mostrar instrucciones
        console.log('[PWA Prompt] 📱 iOS detectado, mostrando instrucciones');
        setShowInstructions(true);
      } else if (isAndroid && !hasNativePrompt) {
        // Android sin prompt nativo
        console.log('[PWA Prompt] 🤖 Android sin prompt nativo, mostrando instrucciones');
        setShowInstructions(true);
      } else {
        // Otros navegadores sin soporte
        console.log('[PWA Prompt] ⚠️ Navegador sin soporte de instalación PWA automática');
        setShowInstructions(true);
      }
    } catch (error) {
      console.error('[PWA Prompt] ❌ Error durante instalación:', error);
      toast.error('Error al intentar instalar', {
        description: 'Intenta desde el menú del navegador'
      });
    } finally {
      setIsInstalling(false);
    }
  }, [hasNativePrompt, isIOS, isAndroid, promptInstall]);

  // Instrucciones específicas por plataforma
  const renderInstructions = () => {
    if (isIOS) {
      return (
        <div className="space-y-4">
          <div className="text-center mb-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <h4 className="font-bold text-lg text-foreground">Instalar en iPhone/iPad</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {isSafari ? 'Sigue estos 3 pasos' : 'Abre esta página en Safari'}
            </p>
          </div>
          
          {!isSafari && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 mb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                ⚠️ Para instalar en iOS, debes abrir esta página en Safari
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-foreground">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Toca el ícono de Compartir
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="p-2 bg-background rounded-lg border">
                    <Share className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">En la barra inferior del navegador</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-foreground">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Busca "Agregar a pantalla de inicio"
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="p-2 bg-background rounded-lg border">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Desliza hacia abajo si no lo ves</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Toca "Agregar" para confirmar
                </p>
                <span className="text-xs text-muted-foreground">¡Listo! La app estará en tu inicio</span>
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
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Smartphone className="w-7 h-7 text-white" />
            </div>
            <h4 className="font-bold text-lg text-foreground">Instalar en Android</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {isChrome ? 'Sigue estos 3 pasos en Chrome' : 'Abre en Chrome para mejor experiencia'}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-foreground">1</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Toca el menú de 3 puntos
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="p-2 bg-background rounded-lg border">
                    <MoreVertical className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Esquina superior derecha</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary-foreground">2</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Selecciona "Instalar aplicación"
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="p-2 bg-background rounded-lg border">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">O "Añadir a pantalla de inicio"</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">3</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  Confirma tocando "Instalar"
                </p>
                <span className="text-xs text-muted-foreground">¡Listo! Búscala en tu pantalla</span>
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
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Monitor className="w-7 h-7 text-white" />
          </div>
          <h4 className="font-bold text-lg text-foreground">Instalar en tu Computadora</h4>
          <p className="text-sm text-muted-foreground mt-1">Disponible en Chrome, Edge y otros</p>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary-foreground">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Busca el ícono de instalación
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="p-2 bg-background rounded-lg border">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">En la barra de direcciones (derecha)</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-white">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Haz clic en "Instalar"
              </p>
              <span className="text-xs text-muted-foreground">Se abrirá como app independiente</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // No mostrar si ya está instalado
  if (isInstalled) {
    return null;
  }

  // No mostrar si fue dismisseado y no está activo el popup
  if (dismissed && !showPrompt) {
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={handleDismiss}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] p-3 sm:p-4 md:bottom-4 md:left-auto md:right-4 md:max-w-[420px]"
          >
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-card border border-border shadow-2xl">
              {/* Header con gradiente */}
              <div className="relative p-5 sm:p-6 text-center overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary">
                {/* Efectos decorativos */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                
                <div className="relative">
                  {/* Icono animado */}
                  <motion.div 
                    className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-2xl sm:rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl border-2 border-white/30"
                    animate={{ 
                      y: [0, -8, 0],
                      rotate: [0, 3, -3, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <span className="text-5xl sm:text-6xl">🧁</span>
                  </motion.div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">
                    ¡Instala CostoPostres!
                  </h3>
                  <p className="text-sm text-white/90 mt-2 max-w-xs mx-auto">
                    Acceso instantáneo desde tu pantalla de inicio
                  </p>
                </div>
                
                {/* Botón cerrar */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-3 right-3 p-2.5 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors border border-white/20"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5 text-white" />
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
                      className="w-full mt-5"
                    >
                      ← Volver
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Beneficios */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                      <motion.div 
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-semibold text-amber-900 dark:text-amber-100">Ultra Rápido</span>
                      </motion.div>
                      
                      <motion.div 
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-semibold text-green-900 dark:text-green-100">Sin Internet</span>
                      </motion.div>
                      
                      <motion.div 
                        className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="w-11 h-11 sm:w-12 sm:h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg">
                          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-semibold text-blue-900 dark:text-blue-100">100% Segura</span>
                      </motion.div>
                    </div>

                    {/* Texto motivacional */}
                    <div className="text-center mb-5 p-3 bg-muted/50 rounded-xl border border-border/50">
                      <p className="text-sm text-muted-foreground">
                        📲 <span className="text-foreground font-medium">¡Instala gratis!</span> Sin ocupar espacio
                      </p>
                    </div>

                    {/* Botón principal */}
                    <Button 
                      onClick={handleInstall} 
                      size="lg" 
                      className="w-full font-bold h-14 rounded-xl shadow-lg hover:shadow-xl transition-all bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary"
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
                          <span>Instalar Ahora — ¡Es Gratis!</span>
                        </>
                      )}
                    </Button>

                    {/* Indicador de plataforma */}
                    <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                      {isIOS && <span className="flex items-center gap-1">🍎 iPhone/iPad</span>}
                      {isAndroid && <span className="flex items-center gap-1">🤖 Android</span>}
                      {!isIOS && !isAndroid && <span className="flex items-center gap-1">💻 Escritorio</span>}
                      {hasNativePrompt && (
                        <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                          • <Zap className="w-3 h-3" /> Un clic
                        </span>
                      )}
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
