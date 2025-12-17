import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Plugin to copy files from root to dist
const copyFiles = () => ({
  name: 'copy-files',
  closeBundle() {
    const files = ['service-worker.js', 'manifest.json'];
    const distDir = path.resolve('dist');
    
    if (!fs.existsSync(distDir)) return;

    files.forEach(file => {
      const src = path.resolve(file);
      const dest = path.join(distDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${file} to dist`);
      }
    });
  }
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyFiles()],
  define: {
    // Aseguramos que process.env.API_KEY esté disponible en el cliente si el entorno lo inyecta así
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  }
});