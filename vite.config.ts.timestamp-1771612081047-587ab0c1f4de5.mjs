// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
import { componentTagger } from "file:///home/project/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "/home/project";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://sdk.mercadopago.com https://http2.mlstatic.com https://secure.mlstatic.com https://api.mercadopago.com https://www.mercadopago.com https://www.mercadolibre.com https://api.mercadolibre.com https://receiver.posclick.dinamize.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://http2.mlstatic.com https://secure.mlstatic.com; font-src 'self' https://fonts.gstatic.com https://http2.mlstatic.com https://secure.mlstatic.com data:; img-src 'self' data: blob: https: http:; connect-src 'self' https://nfzlbzunttknbpiadtsh.supabase.co https://siwrumbueegavdiwzfnb.supabase.co https://publica.cnpj.ws https://viacep.com.br https://hook.us2.make.com https://api.mercadopago.com https://www.mercadopago.com https://http2.mlstatic.com https://secure.mlstatic.com https://www.mercadolibre.com https://api.mercadolibre.com https://www.google-analytics.com https://www.googletagmanager.com https://receiver.posclick.dinamize.com; frame-src 'self' https://www.googletagmanager.com https://store.rsdata.com.br https://sdk.mercadopago.com https://www.mercadolibre.com; object-src 'self' https://store.rsdata.com.br; base-uri 'self'; form-action 'self' https://api.mercadopago.com; frame-ancestors 'self'; upgrade-insecure-requests;",
      "X-Frame-Options": "SAMEORIGIN",
      "X-Content-Type-Options": "nosniff",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger()
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcblxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+ICh7XG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IFwiOjpcIixcbiAgICBwb3J0OiA4MDgwLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdDb250ZW50LVNlY3VyaXR5LVBvbGljeSc6IFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJyBodHRwczovL3d3dy5nb29nbGV0YWdtYW5hZ2VyLmNvbSBodHRwczovL3Nkay5tZXJjYWRvcGFnby5jb20gaHR0cHM6Ly9odHRwMi5tbHN0YXRpYy5jb20gaHR0cHM6Ly9zZWN1cmUubWxzdGF0aWMuY29tIGh0dHBzOi8vYXBpLm1lcmNhZG9wYWdvLmNvbSBodHRwczovL3d3dy5tZXJjYWRvcGFnby5jb20gaHR0cHM6Ly93d3cubWVyY2Fkb2xpYnJlLmNvbSBodHRwczovL2FwaS5tZXJjYWRvbGlicmUuY29tIGh0dHBzOi8vcmVjZWl2ZXIucG9zY2xpY2suZGluYW1pemUuY29tOyBzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tIGh0dHBzOi8vaHR0cDIubWxzdGF0aWMuY29tIGh0dHBzOi8vc2VjdXJlLm1sc3RhdGljLmNvbTsgZm9udC1zcmMgJ3NlbGYnIGh0dHBzOi8vZm9udHMuZ3N0YXRpYy5jb20gaHR0cHM6Ly9odHRwMi5tbHN0YXRpYy5jb20gaHR0cHM6Ly9zZWN1cmUubWxzdGF0aWMuY29tIGRhdGE6OyBpbWctc3JjICdzZWxmJyBkYXRhOiBibG9iOiBodHRwczogaHR0cDo7IGNvbm5lY3Qtc3JjICdzZWxmJyBodHRwczovL25memxienVudHRrbmJwaWFkdHNoLnN1cGFiYXNlLmNvIGh0dHBzOi8vc2l3cnVtYnVlZWdhdmRpd3pmbmIuc3VwYWJhc2UuY28gaHR0cHM6Ly9wdWJsaWNhLmNucGoud3MgaHR0cHM6Ly92aWFjZXAuY29tLmJyIGh0dHBzOi8vaG9vay51czIubWFrZS5jb20gaHR0cHM6Ly9hcGkubWVyY2Fkb3BhZ28uY29tIGh0dHBzOi8vd3d3Lm1lcmNhZG9wYWdvLmNvbSBodHRwczovL2h0dHAyLm1sc3RhdGljLmNvbSBodHRwczovL3NlY3VyZS5tbHN0YXRpYy5jb20gaHR0cHM6Ly93d3cubWVyY2Fkb2xpYnJlLmNvbSBodHRwczovL2FwaS5tZXJjYWRvbGlicmUuY29tIGh0dHBzOi8vd3d3Lmdvb2dsZS1hbmFseXRpY3MuY29tIGh0dHBzOi8vd3d3Lmdvb2dsZXRhZ21hbmFnZXIuY29tIGh0dHBzOi8vcmVjZWl2ZXIucG9zY2xpY2suZGluYW1pemUuY29tOyBmcmFtZS1zcmMgJ3NlbGYnIGh0dHBzOi8vd3d3Lmdvb2dsZXRhZ21hbmFnZXIuY29tIGh0dHBzOi8vc3RvcmUucnNkYXRhLmNvbS5iciBodHRwczovL3Nkay5tZXJjYWRvcGFnby5jb20gaHR0cHM6Ly93d3cubWVyY2Fkb2xpYnJlLmNvbTsgb2JqZWN0LXNyYyAnc2VsZicgaHR0cHM6Ly9zdG9yZS5yc2RhdGEuY29tLmJyOyBiYXNlLXVyaSAnc2VsZic7IGZvcm0tYWN0aW9uICdzZWxmJyBodHRwczovL2FwaS5tZXJjYWRvcGFnby5jb207IGZyYW1lLWFuY2VzdG9ycyAnc2VsZic7IHVwZ3JhZGUtaW5zZWN1cmUtcmVxdWVzdHM7XCIsXG4gICAgICAnWC1GcmFtZS1PcHRpb25zJzogJ1NBTUVPUklHSU4nLFxuICAgICAgJ1gtQ29udGVudC1UeXBlLU9wdGlvbnMnOiAnbm9zbmlmZicsXG4gICAgICAnWC1YU1MtUHJvdGVjdGlvbic6ICcxOyBtb2RlPWJsb2NrJyxcbiAgICAgICdSZWZlcnJlci1Qb2xpY3knOiAnc3RyaWN0LW9yaWdpbi13aGVuLWNyb3NzLW9yaWdpbicsXG4gICAgICAnUGVybWlzc2lvbnMtUG9saWN5JzogJ2NhbWVyYT0oKSwgbWljcm9waG9uZT0oKSwgZ2VvbG9jYXRpb249KCksIGludGVyZXN0LWNvaG9ydD0oKSdcbiAgICB9XG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICByZWFjdCgpLFxuICAgIG1vZGUgPT09ICdkZXZlbG9wbWVudCcgJiZcbiAgICBjb21wb25lbnRUYWdnZXIoKSxcbiAgXS5maWx0ZXIoQm9vbGVhbiksXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbn0pKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssT0FBTztBQUFBLEVBQ3pDLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNQLDJCQUEyQjtBQUFBLE1BQzNCLG1CQUFtQjtBQUFBLE1BQ25CLDBCQUEwQjtBQUFBLE1BQzFCLG9CQUFvQjtBQUFBLE1BQ3BCLG1CQUFtQjtBQUFBLE1BQ25CLHNCQUFzQjtBQUFBLElBQ3hCO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFDVCxnQkFBZ0I7QUFBQSxFQUNsQixFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
