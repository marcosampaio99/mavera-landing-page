import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Layout } from './components/Layout';
import { Account } from './pages/Account';
import { Home } from './pages/Home';
import { Placeholder } from './pages/Placeholder';
import { SignIn } from './pages/SignIn';
import { routes, tenant } from './tenant';
import { AuthProvider } from './auth';

const pages = { home: Home, entrar: SignIn, conta: Account };

function NotFound() {
  return <Placeholder eyebrow="404" title="Página não encontrada" text="Esta página não existe ou mudou de endereço." />;
}

function App() {
  const path = window.location.pathname.replace(/\/+$/, '').slice(tenant.basePath.length);
  const route = routes[path];
  const Page = route ? pages[route.id] : NotFound;

  useEffect(() => {
    document.title = route?.title || `Página não encontrada — ${tenant.name}`;
  }, [route]);

  return (
    <Layout wide={route?.id === 'conta'}>
      {route && route.id !== 'home' ? <AuthProvider><Page /></AuthProvider> : <Page />}
    </Layout>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
