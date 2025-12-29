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

export type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);

  useEffect(() => {
    console.log('[PWA] 🚀 Iniciando detección de PWA...');

    // Detectar si ya está instalado
    const checkIfInstalled = () => {
      // Modo standalone (Android/Desktop)
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('[PWA] ✅ App instalada - modo standalone detectado');
        return true;
      }
      
      // iOS standalone
      // @ts-ignore - Safari specific property
      if (window.navigator.standalone === true) {
        console.log('[PWA] ✅ App instalada - iOS standalone detectado');
        return true;
      }
      
      // Verificar si está en modo fullscreen
      if (window.matchMedia('(display-mode: fullscreen)').matches) {
        console.log('[PWA] ✅ App instalada - modo fullscreen detectado');
        return true;
      }
      
      return false;
    };

    // Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    const isAndroidDevice = /android/.test(userAgent);
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChromeBrowser = /chrome/i.test(navigator.userAgent) && !/edge|edg/i.test(navigator.userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsSafari(isSafariBrowser);
    setIsChrome(isChromeBrowser);
    
    // Determinar plataforma
    if (isIOSDevice) {
      setPlatform('ios');
    } else if (isAndroidDevice) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
    
    console.log('[PWA] 📱 Plataforma detectada:', {
      isIOS: isIOSDevice,
      isAndroid: isAndroidDevice,
      isSafari: isSafariBrowser,
      isChrome: isChromeBrowser,
      platform: isIOSDevice ? 'ios' : isAndroidDevice ? 'android' : 'desktop',
      userAgent: userAgent.substring(0, 80) + '...'
    });

    if (checkIfInstalled()) {
      setIsInstalled(true);
      console.log('[PWA] 📲 La app ya está instalada');
      return;
    }

    // Escuchar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('[PWA] 🎉 Evento beforeinstallprompt capturado!');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Escuchar instalación exitosa
    const handleAppInstalled = () => {
      console.log('[PWA] 🎉 ¡App instalada exitosamente!');
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
    };

    // Escuchar cambios en display-mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log('[PWA] 🔄 Display mode cambió:', e.matches ? 'standalone' : 'browser');
      if (e.matches) {
        setIsInstalled(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    console.log('[PWA] ✅ Event listeners registrados');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('[PWA] ⚠️ No hay prompt diferido disponible');
      return false;
    }

    try {
      console.log('[PWA] 📲 Mostrando prompt de instalación nativo...');
      await deferredPrompt.prompt();

      const choiceResult = await deferredPrompt.userChoice;
      console.log('[PWA] 👤 Elección del usuario:', choiceResult.outcome);

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] ✅ Usuario aceptó la instalación');
        setIsInstalled(true);
        setDeferredPrompt(null);
        setIsInstallable(false);
        return true;
      } else {
        console.log('[PWA] ❌ Usuario rechazó la instalación');
        return false;
      }
    } catch (error) {
      console.error('[PWA] ❌ Error al mostrar prompt:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    platform,
    isSafari,
    isChrome,
    promptInstall,
  };
}
