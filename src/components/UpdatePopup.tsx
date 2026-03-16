import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_VERSION } from '@/config/appVersion';

const LAST_VERSION_KEY = 'postre_app_last_version';

export const UpdatePopup = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Check if there's a new version available
    const lastSeenVersion = localStorage.getItem(LAST_VERSION_KEY);
    
    console.log('[UpdatePopup] Current version:', APP_VERSION);
    console.log('[UpdatePopup] Last seen version:', lastSeenVersion);

    if (lastSeenVersion === null) {
      // First time user - save current version without showing popup
      localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
      console.log('[UpdatePopup] First time user, saving version');
    } else if (lastSeenVersion !== APP_VERSION) {
      // New version available - show popup
      console.log('[UpdatePopup] New version detected, showing popup');
      setShowPopup(true);
    } else {
      console.log('[UpdatePopup] Already on latest version');
    }
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    // Save the new version to localStorage
    localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
    
    try {
      // Unregister all service workers to force fresh content
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(r => r.unregister()));
      }
      
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
    } catch (e) {
      console.warn('[UpdatePopup] Error clearing caches:', e);
    }
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Hard reload bypassing cache
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  };

  const handleLater = () => {
    // Don't save version - popup will show again on next visit
    setShowPopup(false);
  };

  const handleDismissAndSave = () => {
    // Save version so popup won't show again
    localStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
    setShowPopup(false);
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleLater}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 300,
              duration: 0.4 
            }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
          >
            <div className="mx-auto max-w-md bg-card border border-border rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleDismissAndSave}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>

              {/* Content */}
              <div className="p-6 pt-8 text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mb-4 shadow-lg"
                >
                  <Sparkles className="w-8 h-8 text-primary-foreground" />
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold text-foreground mb-2"
                >
                  ¡Nueva actualización disponible!
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground mb-6"
                >
                  Hemos mejorado la app con nuevas funciones y correcciones. 
                  Actualiza ahora para disfrutar de la mejor experiencia.
                </motion.p>

                {/* Version badge */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground mb-6"
                >
                  <span>Versión {APP_VERSION}</span>
                </motion.div>

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col gap-3"
                >
                  <Button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    size="lg"
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  >
                    {isUpdating ? (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                        Actualizando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-5 h-5 mr-2" />
                        Actualizar ahora
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleLater}
                    variant="ghost"
                    size="lg"
                    className="w-full text-muted-foreground hover:text-foreground"
                  >
                    Más tarde
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
