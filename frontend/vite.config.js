import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Allows the server to be accessible outside the container
    port: 3000, // Matches the internal port in your docker-compose
    watch: {
      usePolling: true, // Necessary for Hot Module Replacement (HMR) to work on Windows/Docker
    },
  },
});
