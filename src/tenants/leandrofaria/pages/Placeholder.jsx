import React from 'react';
import { Arrow } from '../components/Layout';
import { paths } from '../tenant';

// Página provisória para rotas cuja funcionalidade ainda não existe.
export function Placeholder({ eyebrow, title, text, items = [], children }) {
  return (
    <section className="placeholder" aria-labelledby="placeholder-title">
      <a className="back-link" href={paths.home}><Arrow direction="left" /> Voltar</a>
      <p className="eyebrow">{eyebrow}</p>
      <h1 id="placeholder-title">{title}</h1>
      <p className="lead">{text}</p>
      {items.length > 0 && (
        <ul className="list">
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )}
      {children}
    </section>
  );
}
