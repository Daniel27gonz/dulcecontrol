import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico", 
        "icon-192.png", 
        "icon-512.png", 
        "robots.txt"
      ],
      manifest: {
        name: "CostoPostres - Calculadora de Costos para Postres",
        short_name: "CostoPostres",
        description: "Calcula el precio correcto de tus postres, gestiona tu negocio y gana lo que realmente vale tu trabajo",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#FDF6F0",
        theme_color: "#5D4037",
        orientation: "portrait-primary",
        lang: "es",
        dir: "ltr",
        categories: ["business", "finance", "food", "productivity"],
        id: "/",
        prefer_related_applications: false,
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ],
        screenshots: [
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
            label: "CostoPostres App"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "wide",
            label: "CostoPostres Desktop"
          }
        ],
        shortcuts: [
          {
            name: "Nueva Receta",
            short_name: "Receta",
            description: "Crear una nueva receta con cálculo de costos",
            url: "/calculator",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "Mis Pedidos",
            short_name: "Pedidos",
            description: "Ver y gestionar pedidos",
            url: "/orders",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "Finanzas",
            short_name: "Finanzas",
            description: "Ver resumen financiero",
            url: "/finances",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          }
        ],
        // Protocol handlers for deep linking
        protocol_handlers: [
          {
            protocol: "web+costopostres",
            url: "/%s"
          }
        ]
      },
      workbox: {
        // Precache de recursos estáticos
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webp,jpg,jpeg}"],
        // Limpiar caches obsoletos
        cleanupOutdatedCaches: true,
        // Tomar control inmediatamente
        clientsClaim: true,
        skipWaiting: true,
        // Estrategias de cache en runtime
        runtimeCaching: [
          {
            // Cache de imágenes
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache-v1",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache de fuentes locales
            urlPattern: /\.(?:woff|woff2|ttf|eot|otf)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache-v1",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache de Google Fonts CSS
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-stylesheets-v1",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 días
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache de Google Fonts archivos
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts-v1",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 año
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // API calls - Network First con fallback a cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache-v1",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60 // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      // Habilitar en desarrollo para testing
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html"
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
