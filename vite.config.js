import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Rotas resolvidas no browser (src/main.jsx). Cada uma recebe uma cópia de
// index.html no build, para funcionar em qualquer alojamento estático
// sem regras de reescrita.
const routes = ['solucoes', 'privacidade', 'termos'];

function staticRoutes() {
  let outDir;
  return {
    name: 'mavera-static-routes',
    apply: 'build',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir); },
    closeBundle() {
      for (const route of routes) {
        mkdirSync(resolve(outDir, route), { recursive: true });
        copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, route, 'index.html'));
      }
    },
  };
}

export default defineConfig({
  plugins: [staticRoutes()],
});
