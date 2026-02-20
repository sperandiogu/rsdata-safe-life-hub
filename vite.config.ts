import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://sdk.mercadopago.com https://http2.mlstatic.com https://secure.mlstatic.com https://api.mercadopago.com https://www.mercadopago.com https://www.mercadolibre.com https://api.mercadolibre.com https://receiver.posclick.dinamize.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://http2.mlstatic.com https://secure.mlstatic.com; font-src 'self' https://fonts.gstatic.com https://http2.mlstatic.com https://secure.mlstatic.com data:; img-src 'self' data: blob: https: http:; connect-src 'self' https://nfzlbzunttknbpiadtsh.supabase.co https://siwrumbueegavdiwzfnb.supabase.co https://publica.cnpj.ws https://viacep.com.br https://hook.us2.make.com https://api.mercadopago.com https://www.mercadopago.com https://http2.mlstatic.com https://secure.mlstatic.com https://www.mercadolibre.com https://api.mercadolibre.com https://www.google-analytics.com https://www.googletagmanager.com https://receiver.posclick.dinamize.com; frame-src 'self' https://www.googletagmanager.com https://store.rsdata.com.br https://sdk.mercadopago.com https://www.mercadolibre.com; object-src 'self' https://store.rsdata.com.br; base-uri 'self'; form-action 'self' https://api.mercadopago.com; frame-ancestors 'self'; upgrade-insecure-requests;",
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
