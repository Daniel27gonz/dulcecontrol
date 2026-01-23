// ============================================
// PWA UPDATE MANAGER
// ============================================

type UpdateCallback = (reloadPage?: boolean) => Promise<void>;

let updateSWFunction: UpdateCallback | null = null;

export const setUpdateFunction = (fn: UpdateCallback) => {
  updateSWFunction = fn;
  console.log('[PWA Updater] Función de actualización registrada');
};

export const triggerAppUpdate = () => {
  if (updateSWFunction) {
    console.log('[PWA Updater] 🔄 Ejecutando actualización...');
    updateSWFunction(true);
  } else {
    console.warn('[PWA Updater] ⚠️ No hay función de actualización disponible');
    // Fallback: recargar la página
    window.location.reload();
  }
};

export const notifyUpdateAvailable = () => {
  console.log('[PWA Updater] 📢 Notificando actualización disponible');
  window.dispatchEvent(new CustomEvent('pwa-update-available'));
};
