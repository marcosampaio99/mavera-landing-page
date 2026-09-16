import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { LegalContent } from './LegalContent';
import { Landing } from './Landing';

// Configurar o contacto e os URLs dos documentos antes da publicação.
const contactEmail = import.meta.env.VITE_CONTACT_EMAIL || 'app.mavera@gmail.com';
const privacyUrl = import.meta.env.VITE_PRIVACY_URL || '/privacidade';
const termsUrl = import.meta.env.VITE_TERMS_URL || '/termos';

function Mark() {
  // return <svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M7 29V11l13 13 13-13v18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function App() {
  const path = window.location.pathname.replace(/\/$/, '');
  const legalTitle = path === '/privacidade' ? 'Política de Privacidade' : path === '/termos' ? 'Termos' : null;

  return (
    <div className="page">
      <header className="header">
        <a className="brand" href="/" aria-label="Mavera — página inicial"><span className="brand-mark"><Mark /></span><span>Mavera<span className="brand-dot">.</span></span></a>
        <a className="header-login" href="https://app.mavera.pt/login">Entrar no backoffice <span aria-hidden="true">↗</span></a>
      </header>

      <main id="main">
        {legalTitle ? (
          <section className="legal" aria-labelledby="legal-title">
            <a className="back-link" href="/">← Voltar</a>
            <h1 id="legal-title">{legalTitle}</h1>
            <LegalContent privacy={path === '/privacidade'} email={contactEmail} />
          </section>
        ) : (
          <Landing contactEmail={contactEmail} />
        )}
      </main>

      <footer className="footer">
        <span className="location"><span aria-hidden="true" className="location-dot" />Portugal</span>
        <nav aria-label="Informações legais">
          <a href={privacyUrl}>Política de Privacidade</a>
          <a href={termsUrl}>Termos</a>
        </nav>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
