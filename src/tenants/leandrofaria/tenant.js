// Link privado de marcações que o Leandro partilha com os clientes (não indexado).
// A administração (planos, horários, clientes) é feita no backoffice Mavera.
export const tenant = {
  id: '25d0df29-5e2e-4ddb-a4fc-72003c59f8e7',
  slug: 'leandro-faria',
  basePath: '/leandrofaria',
  name: 'Leandro Faria',
  role: 'Personal Trainer',
  photo: '/leandrofaria/avatar.jpg',
  contacts: {
    whatsapp: 'https://wa.me/351911812859',
    instagram: 'https://www.instagram.com/leandrofaria_pt/',
  },
};

export const paths = {
  home: tenant.basePath,
  signIn: `${tenant.basePath}/entrar`,
  signUp: `${tenant.basePath}/entrar?modo=registo`,
  account: `${tenant.basePath}/conta`,
};

// Sub-rotas resolvidas no browser. Cada uma (exceto '') tem de constar
// também em `tenants` no vite.config.js para funcionar com refresh direto.
export const routes = {
  '': { id: 'home', title: `Marcações — ${tenant.name}` },
  '/entrar': { id: 'entrar', title: `Entrar — ${tenant.name}` },
  '/conta': { id: 'conta', title: `Área de cliente — ${tenant.name}` },
};
