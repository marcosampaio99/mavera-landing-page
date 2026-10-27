import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Rotas resolvidas no browser (src/main.jsx). Cada uma recebe uma cópia de
// index.html no build, para funcionar em qualquer alojamento estático
// sem regras de reescrita, com título, descrição e URL canónico próprios
// (é o que os crawlers e as pré-visualizações de partilha leem).
const siteUrl = 'https://mavera.pt';
const routes = {
  solucoes: {
    title: 'Soluções — Mavera',
    description: 'Desenvolvemos tecnologia para necessidades reais. Muitas já estão resolvidas no backoffice da Mavera; as outras desenvolvemos contigo.',
  },
  privacidade: { title: 'Política de Privacidade — Mavera' },
  termos: { title: 'Termos — Mavera' },
};

function withRouteMeta(html, route, { title, description }) {
  const url = `${siteUrl}/${route}`;
  const set = (pattern, value) => { html = html.replace(pattern, `$1${value}$2`); };
  set(/(<title>)[^<]*(<\/title>)/, title);
  set(/(<link rel="canonical" href=")[^"]*(")/, url);
  set(/(<meta property="og:url" content=")[^"]*(")/, url);
  set(/(<meta property="og:title" content=")[^"]*(")/, title);
  set(/(<meta name="twitter:title" content=")[^"]*(")/, title);
  if (description) {
    set(/(<meta name="description" content=")[^"]*(")/, description);
    set(/(<meta property="og:description" content=")[^"]*(")/, description);
    set(/(<meta name="twitter:description" content=")[^"]*(")/, description);
  }
  return html;
}

// Frontends de clientes (tenants): entrada HTML própria em <tenant>/index.html,
// isolada do site Mavera. As sub-rotas (src/tenants/<tenant>/tenant.js)
// recebem uma cópia do index.html do tenant.
const tenants = {
  leandrofaria: ['entrar', 'conta'],
};

function staticRoutes() {
  let outDir;
  const copies = [
    ...Object.entries(tenants).flatMap(([tenant, subs]) => subs.map((sub) => [`${tenant}/index.html`, `${tenant}/${sub}`])),
  ];
  return {
    name: 'mavera-static-routes',
    apply: 'build',
    configResolved(config) { outDir = resolve(config.root, config.build.outDir); },
    closeBundle() {
      const html = readFileSync(resolve(outDir, 'index.html'), 'utf8');
      for (const [route, meta] of Object.entries(routes)) {
        mkdirSync(resolve(outDir, route), { recursive: true });
        writeFileSync(resolve(outDir, route, 'index.html'), withRouteMeta(html, route, meta));
      }
      for (const [source, route] of copies) {
        mkdirSync(resolve(outDir, route), { recursive: true });
        copyFileSync(resolve(outDir, source), resolve(outDir, route, 'index.html'));
      }
    },
  };
}

// Em desenvolvimento, serve o index.html do tenant em /<tenant> e em
// qualquer sub-rota, em vez do fallback para o site Mavera.
function tenantDevRoutes() {
  const pattern = new RegExp(`^/(${Object.keys(tenants).join('|')})(/[^.]*)?(\\?.*)?$`);
  return {
    name: 'mavera-tenant-dev-routes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const match = req.url && req.url.match(pattern);
        if (match) req.url = `/${match[1]}/index.html${match[3] || ''}`;
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [staticRoutes(), tenantDevRoutes()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(Object.keys(tenants).map((t) => [t, resolve(import.meta.dirname, `${t}/index.html`)])),
      },
    },
  },
});
