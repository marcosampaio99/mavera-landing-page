import React from 'react';
import { Dot, SectionLabel } from './Site';

const areas = [
  {
    id: 'software',
    title: 'Software & Gestão',
    line: 'O backoffice da Mavera, configurado para a forma como trabalhas.',
    items: [
      'Gestão de clientes, serviços, equipas e recursos',
      'Reservas e agendamentos',
      'Sessões individuais e coletivas',
      'Disponibilidade e operação',
      'Planos, packs e gestão de clientes',
      'Comunicação e automações',
    ],
  },
  {
    id: 'websites',
    title: 'Websites & Experiências Digitais',
    line: 'A presença digital da tua marca, com a reserva dentro dela.',
    items: [
      'Criação e modernização de websites',
      'Reserva e pagamento online integrados na tua marca',
      'Áreas reservadas',
      'Presença digital',
      'Interfaces e experiências à medida',
    ],
  },
  {
    id: 'integracoes',
    title: 'Integrações & Automação',
    line: 'As ferramentas que já usas, ligadas ao resto da operação.',
    items: [
      'Integrações com serviços externos',
      'Pagamentos online por cartão e MB WAY',
      'Faturação',
      'Email e lembretes por mensagem',
      'Automatização de processos',
      'Soluções personalizadas',
    ],
  },
];

const steps = [
  { word: 'Perceber', text: 'Olhamos para a operação, os clientes e o trabalho que hoje é feito à mão.' },
  { word: 'Construir', text: 'Configuramos a Mavera, ligamos o que é preciso e adaptamos tudo à tua marca.' },
  { word: 'Evoluir', text: 'Acompanhamos o negócio e a solução cresce com ele.' },
];

export function Solutions() {
  return (
    <>
      <section className="sol-hero" aria-labelledby="sol-title">
        <div className="wrap">
          <SectionLabel>Soluções</SectionLabel>
          <h1 id="sol-title" className="sol-title" data-reveal>
            <span className="line"><span>Três áreas.</span></span>
            <span className="line"><span><em>Um sistema<Dot className="dot--period" /></em></span></span>
          </h1>
          <p className="sol-lede" data-reveal>Tecnologia própria e desenvolvimento à medida quando a tua empresa precisa de algo que ainda não existe.</p>
        </div>
      </section>

      {areas.map((area, i) => (
        <section key={area.id} className={`sol-area sol-area--${area.id}`} id={area.id} aria-labelledby={`${area.id}-title`}>
          <div className="wrap sol-area-grid" data-reveal>
            <div className="sol-area-head">
              <span className="sol-num">0{i + 1}</span>
              <h2 id={`${area.id}-title`}>{area.title}</h2>
              <p>{area.line}</p>
            </div>
            <ul className="sol-list">
              {area.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </section>
      ))}

      <section className="process" aria-labelledby="process-title">
        <div className="wrap">
          <SectionLabel>Como trabalhamos</SectionLabel>
          <h2 id="process-title" className="sr-only">Como trabalhamos</h2>
          <ol className="process-steps" data-reveal>
            {steps.map(({ word, text }, i) => (
              <li key={word} style={{ '--i': i }}>
                <span className="process-word">{word}<Dot /></span>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
