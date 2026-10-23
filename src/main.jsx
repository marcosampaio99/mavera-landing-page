import React, { useEffect } from 'react';
import { ArrowIcon } from './ArrowIcon';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { LegalContent } from './LegalContent';
import { Landing } from './Landing';
import { Solutions } from './Solutions';
import { Closing, SiteFooter, SiteHeader, useReveal } from './Site';

// Configurar o contacto e os URLs dos documentos antes da publicação.
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'app.mavera@gmail.com';
const privacyUrl = import.meta.env.VITE_PRIVACY_URL || '/privacidade';
const termsUrl = import.meta.env.VITE_TERMS_URL || '/termos';

const routes = {
  '': { id: 'home' },
  '/solucoes': { id: 'solucoes', title: 'Soluções — Mavera' },
  '/privacidade': { id: 'legal', title: 'Política de Privacidade — Mavera', legalTitle: 'Política de Privacidade' },
  '/termos': { id: 'legal', title: 'Termos — Mavera', legalTitle: 'Termos' },
};

function App() {
  const path = window.location.pathname.replace(/\/$/, '');
  const route = routes[path] || routes[''];
  const hasContact = route.id !== 'legal';

  useReveal();
  useEffect(() => { if (route.title) document.title = route.title; }, [route.title]);

  return (
    <div className={`page page--${route.id}`}>
      <a className="skip-link" href="#main">Saltar para o conteúdo</a>
      <SiteHeader current={route.id} hasContact={hasContact} />

      <main id="main" tabIndex={-1}>
        {route.id === 'legal' && (
          <section className="legal wrap" aria-labelledby="legal-title">
            <a className="back-link" href="/"><ArrowIcon direction="left" /> Voltar</a>
            <h1 id="legal-title">{route.legalTitle}</h1>
            <LegalContent privacy={path === '/privacidade'} email={contactEmail} />
          </section>
        )}
        {route.id === 'home' && <Landing />}
        {route.id === 'solucoes' && <Solutions contactEmail={contactEmail} />}
        {hasContact && <Closing contactEmail={contactEmail} />}
      </main>

      <SiteFooter privacyUrl={privacyUrl} termsUrl={termsUrl} />
    </div>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
