import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Registrar Service Worker para PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/"
      });
      
      console.log("[PWA] Service Worker registrado exitosamente:", registration.scope);
      
      // Manejar actualizaciones del SW
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        console.log("[PWA] Nueva versión del Service Worker encontrada");
        
        newWorker?.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            console.log("[PWA] Nueva versión disponible - recarga para actualizar");
          }
        });
      });
    } catch (error) {
      console.log("[PWA] Error al registrar Service Worker:", error);
    }
  });
}

// Log para debugging de PWA
console.log("[PWA] App iniciando...");
console.log("[PWA] Display mode:", window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser");

createRoot(document.getElementById("root")!).render(<App />);
