import React from 'react';
import { paths, tenant } from '../tenant';

export function Arrow({ direction = 'right' }) {
  return (
    <svg className={`arrow arrow--${direction}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4 12h16m-6-6 6 6-6 6" />
    </svg>
  );
}

export function ButtonLink({ href, children, variant = 'solid' }) {
  return (
    <a className={`btn btn--${variant}`} href={href}>
      <span>{children}</span>
      <Arrow />
    </a>
  );
}

const icons = {
  whatsapp: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z',
  instagram: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4ZM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4ZM12 3.8c2.7 0 3 0 4 .1 2.7.1 4 1.4 4.1 4.1.1 1 .1 1.3.1 4s0 3-.1 4c-.1 2.7-1.4 4-4.1 4.1-1 .1-1.3.1-4 .1s-3 0-4-.1c-2.7-.1-4-1.4-4.1-4.1-.1-1-.1-1.3-.1-4s0-3 .1-4C4 5.3 5.3 4 8 3.9c1-.1 1.3-.1 4-.1ZM12 2c-2.7 0-3.1 0-4.1.1C4.3 2.2 2.2 4.3 2.1 7.9 2 8.9 2 9.3 2 12s0 3.1.1 4.1c.1 3.6 2.2 5.7 5.8 5.8 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c3.6-.1 5.7-2.2 5.8-5.8.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-3.6-2.2-5.7-5.8-5.8C15.1 2 14.7 2 12 2Z',
};

function Brand() {
  return (
    <a className="brand" href={paths.home}>
      <img className="avatar" src={tenant.photo} alt="" width="52" height="52" />
      <span className="brand-text">
        <span className="brand-name">{tenant.name}</span>
        <span className="brand-role">{tenant.role}</span>
      </span>
    </a>
  );
}

function Contacts() {
  const links = [
    { id: 'whatsapp', href: tenant.contacts.whatsapp, label: `Falar com ${tenant.name} no WhatsApp` },
    { id: 'instagram', href: tenant.contacts.instagram, label: `Instagram de ${tenant.name}` },
  ];
  return (
    <ul className="contacts">
      {links.map(({ id, href, label }) => (
        <li key={id}>
          <a className="contact" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d={icons[id]} /></svg>
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Layout({ children, wide = false }) {
  return (
    <div className={`shell${wide ? ' shell--dashboard' : ''}`}>
      <a className="skip-link" href="#main">Saltar para o conteúdo</a>
      <div className="panel">
        <header className="panel-header">
          <Brand />
          {wide ? <a className="account-access" href="#account-session">Conta</a> : <Contacts />}
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
      </div>
      <footer className="footer">
        <p>Marcações com <a href="/">Mavera</a></p>
      </footer>
    </div>
  );
}
