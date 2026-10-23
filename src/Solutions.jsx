import React from 'react';
import { BeforeAfter, Dot, SectionLabel } from './Site';

// Áreas com os nomes e as frases das Soluções no Instagram.
// TODO(conteúdo): o 6.º slide das Soluções no Instagram ainda está por completar.
const areas = [
  {
    id: 'software',
    title: 'Software à medida',
    lead: 'Software pensado para o teu negócio.',
    line: 'Partimos do backoffice da Mavera e adaptamo-lo aos processos que precisam de melhorar. O que ainda não existe, desenvolvemos.',
    items: [
      'Clientes, serviços, equipas e recursos',
      'Reservas e agendamentos',
      'Sessões individuais e coletivas com capacidade',
      'Disponibilidade e horários',
      'Planos e packs',
      'Pagamentos por cartão e MB WAY',
      'Comunicação e automações',
    ],
  },
  {
    id: 'websites',
    title: 'Websites e experiências digitais',
    lead: 'Mais do que estar online.',
    label: 'Marca · Clientes · Operação',
    line: 'Um site que liga a tua marca, os teus clientes e a operação do dia a dia.',
    items: [
      'Criação e modernização de websites',
      'Reserva e pagamento online dentro do site da tua marca',
      'Áreas reservadas para clientes',
      'Presença digital',
    ],
  },
  {
    id: 'automacao',
    title: 'Processos e automação',
    lead: 'Menos tarefas repetitivas.',
    line: 'Identificamos o que é feito à mão todas as semanas e simplificamos esse trabalho.',
    visual: <BeforeAfter />,
  },
  {
    id: 'integracoes',
    title: 'Integrações',
    lead: 'Fazer os sistemas trabalhar em conjunto.',
    line: 'Website, pagamentos e gestão num só fluxo.',
    items: [
      'Pagamentos online por cartão e MB WAY',
      'Faturação',
      'Email e lembretes por mensagem',
      'Ligação a sistemas que já usas',
      'Integrações com serviços externos',
    ],
  },
];

// Os cinco passos do Método no Instagram, pela mesma ordem.
// TODO(conteúdo): o slide 2/2 do Método no Instagram ainda está por completar.
const steps = [
  { name: 'Conversa', lead: 'Percebemos o negócio e os objetivos.', text: 'Contas-nos como trabalhas hoje e o que te está a tirar tempo.' },
  { name: 'Diagnóstico', lead: 'Erros, tarefas repetidas, tempo perdido.', text: 'Vemos onde as marcações se perdem e o que é feito duas vezes.' },
  { name: 'Proposta', lead: 'Só o que o negócio precisa.', text: 'Se o backoffice já resolve, não se desenvolve de novo.' },
  { name: 'Implementação', lead: 'Ferramentas configuradas à medida.', text: 'Serviços, horários, planos, pagamentos e os teus clientes no sistema.' },
  { name: 'Acompanhamento', lead: 'Continuamos ao lado.', text: 'Depois do arranque, continuamos contigo para ajustar o que for preciso.' },
];

export function Solutions() {
  return (
    <>
      <section className="sol-hero" aria-labelledby="sol-title">
        <div className="wrap">
          <SectionLabel>Soluções</SectionLabel>
          <h1 id="sol-title" className="sol-title" data-reveal>
            <span className="line"><span>Cada negócio. </span></span>
            <span className="line"><span><em>Um desafio diferente<Dot className="dot--period" /></em></span></span>
          </h1>
          <p className="sol-lede">Desenvolvemos tecnologia para necessidades reais. Muitas já estão resolvidas no backoffice da Mavera; as outras desenvolvemos contigo.</p>
        </div>
      </section>

      {areas.map((area, i) => (
        <section key={area.id} className={`sol-area sol-area--${area.id}`} id={area.id} aria-labelledby={`${area.id}-title`}>
          <div className="wrap sol-area-grid">
            <div className="sol-area-head">
              <span className="sol-num">0{i + 1}</span>
              <h2 id={`${area.id}-title`}>{area.title}</h2>
              <p className="sol-lead">{area.lead}</p>
              <p>{area.line}</p>
              {area.label && <p className="mono-label sol-label">{area.label}</p>}
            </div>
            {area.items ? (
              <ul className="sol-list">
                {area.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : area.visual}
          </div>
        </section>
      ))}

      <section className="method" id="metodo" aria-labelledby="method-title">
        <div className="wrap method-grid">
          <div className="method-head">
            <SectionLabel>Método</SectionLabel>
            <h2 id="method-title" className="display-title">Como trabalhamos</h2>
          </div>
          <ol className="method-steps">
            {steps.map(({ name, lead, text }, i) => (
              <li key={name}>
                <span className="method-num">0{i + 1}</span>
                <h3>{name}</h3>
                <p><strong>{lead}</strong> {text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
