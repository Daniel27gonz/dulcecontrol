import { useState, useEffect, useCallback, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
  interface Navigator {
    standalone?: boolean;
  }
}

export type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

// Almacenar el evento globalmente para evitar perderlo
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;

// Capturar el evento lo antes posible (antes de que React se monte)
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    console.log('[PWA Global] 🎉 Evento beforeinstallprompt capturado globalmente!');
  }, { once: false });
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstallable, setIsInstallable] = useState(!!globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isSafari, setIsSafari] = useState(false);
  const [isChrome, setIsChrome] = useState(false);
  const [isFirefox, setIsFirefox] = useState(false);
  const [isEdge, setIsEdge] = useState(false);
  const promptShownRef = useRef(false);

  useEffect(() => {
    console.log('[PWA] 🚀 Iniciando detección de PWA...');
    console.log('[PWA] 📦 Prompt global disponible:', !!globalDeferredPrompt);

    // Detectar si ya está instalado
    const checkIfInstalled = (): boolean => {
      // Modo standalone (Android/Desktop)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (isStandalone) {
        console.log('[PWA] ✅ App instalada - modo standalone detectado');
        return true;
      }
      
      // iOS standalone
      if (navigator.standalone === true) {
        console.log('[PWA] ✅ App instalada - iOS standalone detectado');
        return true;
      }
      
      // Modo fullscreen
      const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches;
      if (isFullscreen) {
        console.log('[PWA] ✅ App instalada - modo fullscreen detectado');
        return true;
      }
      
      // Modo minimal-ui
      const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
      if (isMinimalUI) {
        console.log('[PWA] ✅ App instalada - modo minimal-ui detectado');
        return true;
      }

      // Verificar si se accede desde una app instalada (Android TWA)
      if (document.referrer.includes('android-app://')) {
        console.log('[PWA] ✅ App instalada - Android TWA detectado');
        return true;
      }
      
      return false;
    };

    // Detectar plataforma y navegador
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) && !('MSStream' in window);
    const isAndroidDevice = /android/.test(userAgent);
    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isChromeBrowser = /chrome/i.test(navigator.userAgent) && !/edge|edg|opr/i.test(navigator.userAgent);
    const isFirefoxBrowser = /firefox/i.test(navigator.userAgent);
    const isEdgeBrowser = /edg/i.test(navigator.userAgent);
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsSafari(isSafariBrowser);
    setIsChrome(isChromeBrowser);
    setIsFirefox(isFirefoxBrowser);
    setIsEdge(isEdgeBrowser);
    
    // Determinar plataforma
    let detectedPlatform: Platform = 'unknown';
    if (isIOSDevice) {
      detectedPlatform = 'ios';
    } else if (isAndroidDevice) {
      detectedPlatform = 'android';
    } else {
      detectedPlatform = 'desktop';
    }
    setPlatform(detectedPlatform);
    
    console.log('[PWA] 📱 Plataforma detectada:', {
      platform: detectedPlatform,
      isIOS: isIOSDevice,
      isAndroid: isAndroidDevice,
      isSafari: isSafariBrowser,
      isChrome: isChromeBrowser,
      isFirefox: isFirefoxBrowser,
      isEdge: isEdgeBrowser,
      userAgent: userAgent.substring(0, 100)
    });

    // Verificar instalación
    const installed = checkIfInstalled();
    setIsInstalled(installed);
    
    if (installed) {
      console.log('[PWA] 📲 La app ya está instalada');
      return;
    }

    // Si ya tenemos el prompt global, usarlo
    if (globalDeferredPrompt) {
      console.log('[PWA] 📦 Usando prompt global existente');
      setDeferredPrompt(globalDeferredPrompt);
      setIsInstallable(true);
    }

    // Escuchar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      console.log('[PWA] 🎉 Evento beforeinstallprompt capturado en hook!');
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Escuchar instalación exitosa
    const handleAppInstalled = () => {
      console.log('[PWA] 🎉 ¡App instalada exitosamente!');
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
      setIsInstallable(false);
    };

    // Escuchar cambios en display-mode
    const standaloneQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      console.log('[PWA] 🔄 Display mode cambió:', e.matches ? 'standalone' : 'browser');
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        setIsInstallable(false);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    standaloneQuery.addEventListener('change', handleDisplayModeChange);

    console.log('[PWA] ✅ Event listeners registrados');

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      standaloneQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    // Usar el prompt del estado o el global
    const promptToUse = deferredPrompt || globalDeferredPrompt;
    
    if (!promptToUse) {
      console.log('[PWA] ⚠️ No hay prompt diferido disponible');
      console.log('[PWA] 📊 Estado actual:', { 
        deferredPrompt: !!deferredPrompt, 
        globalDeferredPrompt: !!globalDeferredPrompt,
        isInstallable 
      });
      return false;
    }

    // Evitar mostrar el prompt múltiples veces
    if (promptShownRef.current) {
      console.log('[PWA] ⚠️ Prompt ya fue mostrado anteriormente');
      return false;
    }

    try {
      console.log('[PWA] 📲 Mostrando prompt de instalación nativo...');
      promptShownRef.current = true;
      
      await promptToUse.prompt();
      const choiceResult = await promptToUse.userChoice;
      
      console.log('[PWA] 👤 Elección del usuario:', choiceResult.outcome);

      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] ✅ Usuario aceptó la instalación');
        setIsInstalled(true);
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        setIsInstallable(false);
        return true;
      } else {
        console.log('[PWA] ❌ Usuario rechazó la instalación');
        // Resetear para permitir mostrar de nuevo más tarde
        promptShownRef.current = false;
        return false;
      }
    } catch (error) {
      console.error('[PWA] ❌ Error al mostrar prompt:', error);
      promptShownRef.current = false;
      
      // Si el error es porque el prompt ya fue usado, limpiar
      if (error instanceof Error && error.message.includes('already')) {
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        setIsInstallable(false);
      }
      
      return false;
    }
  }, [deferredPrompt, isInstallable]);

  // Verificar si la instalación manual está disponible (para navegadores sin beforeinstallprompt)
  const canShowManualInstall = useCallback((): boolean => {
    // iOS siempre puede mostrar instrucciones manuales en Safari
    if (isIOS && isSafari) return true;
    
    // Android en Chrome puede mostrar instrucciones si no hay prompt automático
    if (isAndroid && isChrome && !isInstallable) return true;
    
    // Desktop en Chrome/Edge puede mostrar instrucciones
    if (platform === 'desktop' && (isChrome || isEdge) && !isInstallable) return true;
    
    return false;
  }, [isIOS, isAndroid, isChrome, isEdge, isSafari, platform, isInstallable]);

  return {
    isInstallable: isInstallable || (isIOS && isSafari),
    isInstalled,
    isIOS,
    isAndroid,
    platform,
    isSafari,
    isChrome,
    isFirefox,
    isEdge,
    promptInstall,
    canShowManualInstall,
    // Exponer si hay prompt nativo disponible
    hasNativePrompt: !!(deferredPrompt || globalDeferredPrompt),
  };
}
