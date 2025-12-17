import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Aseguramos que process.env.API_KEY esté disponible en el cliente si el entorno lo inyecta así
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  }
});