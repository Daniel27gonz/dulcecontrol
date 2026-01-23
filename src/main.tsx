import { createRoot } from "react-dom/client";
import { registerSW } from 'virtual:pwa-register';
import App from "./App.tsx";
import "./index.css";
import { setUpdateFunction, notifyUpdateAvailable } from "./lib/pwaUpdater";

// ============================================
// PWA SERVICE WORKER REGISTRATION
// ============================================

// Registrar Service Worker
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] 🔄 Nueva versión disponible - mostrando notificación');
    // Disparar evento personalizado para mostrar la notificación
    notifyUpdateAvailable();
  },
  onOfflineReady() {
    console.log('[PWA] ✅ App lista para uso offline');
  },
  onRegistered(registration) {
    console.log('[PWA] ✅ Service Worker registrado:', registration?.scope);
    
    // Verificar actualizaciones cada hora
    if (registration) {
      setInterval(() => {
        console.log('[PWA] 🔍 Verificando actualizaciones...');
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('[PWA] ❌ Error al registrar Service Worker:', error);
  }
});

// Registrar la función de actualización para uso global
setUpdateFunction(updateSW);

// ============================================
// PWA DEBUGGING & STATUS
// ============================================

// Detectar modo de ejecución
const displayModes = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];
let currentDisplayMode = 'browser';

for (const mode of displayModes) {
  if (window.matchMedia(`(display-mode: ${mode})`).matches) {
    currentDisplayMode = mode;
    break;
  }
}

// iOS standalone detection
const isIOSStandalone = ('standalone' in navigator) && (navigator as any).standalone;

console.log('[PWA] 🚀 App iniciando...');
console.log('[PWA] 📱 Display mode:', currentDisplayMode);
console.log('[PWA] 🍎 iOS Standalone:', isIOSStandalone);
console.log('[PWA] 🌐 Online:', navigator.onLine);
console.log('[PWA] 📦 Service Worker soportado:', 'serviceWorker' in navigator);

// Detectar cambios en conectividad
window.addEventListener('online', () => {
  console.log('[PWA] 🌐 Conexión restaurada');
});

window.addEventListener('offline', () => {
  console.log('[PWA] 📴 Sin conexión - modo offline activo');
});

// Detectar cambios en display mode
window.matchMedia('(display-mode: standalone)').addEventListener('change', (e) => {
  console.log('[PWA] 🔄 Display mode cambió a:', e.matches ? 'standalone' : 'browser');
});

// ============================================
// RENDER APP
// ============================================

createRoot(document.getElementById("root")!).render(<App />);
