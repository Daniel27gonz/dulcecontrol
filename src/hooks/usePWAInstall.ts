import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    console.log('[PWA Hook] Iniciando detección de PWA...');

    // Detectar si ya está instalado
    const checkIfInstalled = () => {
      // Modo standalone (Android/Desktop)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA Hook] ✅ App instalada - modo standalone detectado');
        return true;
      }
      
      // iOS standalone
      // @ts-ignore - Safari specific property
      if (window.navigator.standalone === true) {
        console.log('[PWA Hook] ✅ App instalada - iOS standalone detectado');
        return true;
      }
      
      // Verificar si está en modo fullscreen
      if (window.matchMedia('(display-mode: fullscreen)').matches) {
        console.log('[PWA Hook] ✅ App instalada - modo fullscreen detectado');
        return true;
      }
      
      return false;
    };

    // Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    
    console.log('[PWA Hook] Plataforma detectada:', {
      isIOS: isIOSDevice,
      isAndroid: isAndroidDevice,
      isSafari,
      userAgent: userAgent.substring(0, 100) + '...'
    });

    if (checkIfInstalled()) {
      setIsInstalled(true);
      return;
    }

    // Escuchar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('[PWA Hook] 🎉 Evento beforeinstallprompt capturado!');
      e.preventDefault(); // Prevenir el prompt automático
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Escuchar instalación exitosa
    const handleAppInstalled = () => {
      console.log('[PWA Hook] 🎉 App instalada exitosamente!');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    // Escuchar cambios en display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log('[PWA Hook] Display mode cambió:', e.matches ? 'standalone' : 'browser');
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    console.log('[PWA Hook] Event listeners registrados');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('[PWA Hook] ⚠️ No hay prompt diferido disponible');
      return false;
    }

    try {
      console.log('[PWA Hook] Mostrando prompt de instalación nativo...');
      await deferredPrompt.prompt();

      const choiceResult = await deferredPrompt.userChoice;
      console.log('[PWA Hook] Elección del usuario:', choiceResult.outcome);

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA Hook] ✅ Usuario aceptó la instalación');
        setIsInstalled(true);
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      } else {
        console.log('[PWA Hook] ❌ Usuario rechazó la instalación');
        return false;
      }
    } catch (error) {
      console.error('[PWA Hook] Error al mostrar prompt:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall,
  };
}
