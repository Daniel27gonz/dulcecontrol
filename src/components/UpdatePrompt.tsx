import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface UpdatePromptProps {
  onUpdate: () => void;
}

export const UpdatePrompt = ({ onUpdate }: UpdatePromptProps) => {
  const [show, setShow] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Escuchar el evento personalizado de actualización disponible
    const handleUpdateAvailable = () => {
      console.log('[UpdatePrompt] Nueva actualización detectada');
      setShow(true);
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    
    return () => {
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    console.log('[UpdatePrompt] Iniciando actualización...');
    
    try {
      onUpdate();
    } catch (error) {
      console.error('[UpdatePrompt] Error al actualizar:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 z-[100] p-3 safe-area-top"
        >
          <div className="mx-auto max-w-md">
            <div className="bg-primary text-primary-foreground rounded-xl shadow-2xl p-4 flex items-center gap-3 border border-primary/20">
              <div className="flex-shrink-0">
                <motion.div
                  animate={isUpdating ? { rotate: 360 } : {}}
                  transition={{ duration: 1, repeat: isUpdating ? Infinity : 0, ease: 'linear' }}
                >
                  <RefreshCw className="h-5 w-5" />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  ¡Nueva versión disponible!
                </p>
                <p className="text-xs opacity-90">
                  Actualiza para obtener las últimas mejoras
                </p>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  size="sm"
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-primary-foreground border-0 text-xs font-semibold"
                >
                  {isUpdating ? 'Actualizando...' : 'Actualizar'}
                </Button>
                
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
