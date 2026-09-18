import React from 'react';
import { ArrowIcon } from './ArrowIcon';

function ProductShot({ file, alt, width, height, eager = false }) {
  return (
    <a className="product-shot" href={`/screenshots/${file}`} target="_blank" rel="noreferrer" aria-label={`${alt} — abrir imagem em tamanho completo (novo separador)`}>
      <img src={`/screenshots/${file}`} alt={alt} width={width} height={height} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : 'auto'} />
    </a>
  );
}

export function Landing({ contactEmail }) {
  const talkHref = `mailto:${contactEmail}?subject=${encodeURIComponent('Pedir uma demonstração da Mavera')}`;
  const integrationHref = `mailto:${contactEmail}?subject=${encodeURIComponent('Integrar a infraestrutura da Mavera')}`;

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">Infraestrutura de marcações · Mavera</p>
        <h1 id="hero-title">A base da tua operação.<br /><span>À maneira do teu negócio.</span></h1>
        <div className="hero-bottom">
          <div className="hero-context"><p>Do primeiro horário<br />à próxima marcação.</p><a className="text-link" href="#produto">Explorar o produto <ArrowIcon direction="down" /></a></div>
          <div className="hero-intro">
            <p>A infraestrutura que liga marcações, disponibilidade, clientes e planos. Com um backoffice para gerir o dia a dia e uma base comum para integrar no teu produto.</p>
            <a className="button primary" href={talkHref}>Pedir uma demonstração <ArrowIcon /></a>
          </div>
        </div>
      </section>

      <section className="agenda-section" id="produto" aria-labelledby="agenda-title">
        <div className="agenda-heading">
          <div><p className="eyebrow">01 / Visão da operação</p><h2 id="agenda-title">Tudo começa<br />numa agenda ligada.</h2></div>
          <p>Marcações individuais e sessões de grupo, lado a lado. Vê quem vem, com que profissional e em que espaço — por dia, semana ou mês.</p>
        </div>
        <figure className="agenda-figure">
          <ProductShot file="agenda.png" alt="Agenda semanal da Mavera com marcações de massagem e sessões de mobilidade, Pilates e treino funcional" width={2160} height={1673} eager />
          <figcaption><span>Agenda semanal · backoffice Mavera</span><span>Produto real · dados de demonstração · clicar para ampliar ↗</span></figcaption>
        </figure>
      </section>

      <section className="session-section" aria-labelledby="session-title">
        <figure className="session-figure">
          <ProductShot file="sessao.png" alt="Detalhe de uma sessão de Mobilidade: horário, profissional, capacidade de sete lugares e três participantes confirmados" width={1815} height={1335} />
          <figcaption>Detalhe de sessão · produto real · clicar para ampliar ↗</figcaption>
        </figure>
        <div className="session-copy">
          <p className="eyebrow">02 / Marcações e sessões</p>
          <h2 id="session-title">Um atendimento.<br />Uma turma inteira.<br />A mesma base.</h2>
          <p>Cada formato tem as suas regras. Gere horários e profissionais nas marcações individuais; nas sessões de grupo, define também a capacidade e acompanha os participantes.</p>
          <ul className="feature-notes">
            <li>Horários e profissionais associados</li>
            <li>Capacidade e participantes à vista</li>
          </ul>
        </div>
      </section>

      <section className="plans-section" aria-labelledby="plans-title">
        <div className="plans-copy">
          <p className="eyebrow">03 / Continuidade do cliente</p>
          <h2 id="plans-title">Da primeira sessão<br />à próxima renovação.</h2>
          <p>Uma marcação faz parte de uma relação. Liga cada cliente ao seu plano ou pack, com a validade, os serviços incluídos e as utilizações disponíveis no mesmo lugar.</p>
        </div>
        <figure className="plans-figure">
          <ProductShot file="planos&packs.png" alt="Gestão de planos e packs da Mavera com preços, utilizações incluídas, validade e estado de cada plano" width={1370} height={872} />
          <figcaption>Planos e packs · produto real · clicar para ampliar ↗</figcaption>
        </figure>
      </section>

      <section className="operation-section" aria-labelledby="operation-title">
        <div className="operation-intro">
          <p className="eyebrow">À medida da tua operação</p>
          <h2 id="operation-title">Por trás de cada marcação,<br />uma operação organizada.</h2>
          <p>Os horários, as pessoas e as regras do teu negócio fazem parte da mesma estrutura. Para quem gere um estúdio, uma clínica ou uma equipa de profissionais.</p>
        </div>
        <dl className="capabilities">
          <div><dt>Clientes</dt><dd>Contactos, histórico de marcações e planos associados, sempre à mão.</dd></div>
          <div><dt>Serviços e recursos</dt><dd>Define o que ofereces e associa os profissionais, espaços ou equipamentos.</dd></div>
          <div><dt>Disponibilidade</dt><dd>Organiza horários recorrentes, sessões e períodos de indisponibilidade.</dd></div>
          <div><dt>Planos e packs</dt><dd>Mensalidades, utilizações e regras de acesso aos serviços.</dd></div>
          <div><dt>Localizações</dt><dd>Mais do que um espaço físico, geridos sob a mesma conta.</dd></div>
          <div><dt>Notificações</dt><dd>Cliente e negócio avisados a cada marcação, confirmação ou alteração.</dd></div>
        </dl>
      </section>

      <section className="platform-section" id="infraestrutura" aria-labelledby="platform-title">
        <div className="platform-copy">
          <p className="eyebrow">Do backoffice ao teu produto</p>
          <h2 id="platform-title">Uma operação.<br />Uma base comum.<br /><span>Várias formas de a usar.</span></h2>
          <p>No backoffice, a tua equipa gere a operação. Por baixo, a Mavera reúne disponibilidade, marcações, clientes e planos numa estrutura comum.</p>
          <a className="text-link" href={integrationHref}>Falar sobre <ArrowIcon /></a>
        </div>
        <div className="coherence-visual" role="img" aria-label="Diagrama: backoffice e produto próprio ligados à infraestrutura Mavera, que reúne disponibilidade, marcações, clientes e planos">
          <div className="coherence-row">
            <span className="coherence-chip">Disponibilidade</span>
            <span className="coherence-chip">Marcações</span>
            <span className="coherence-chip">Clientes</span>
            <span className="coherence-chip">Planos</span>
          </div>
          <span className="coherence-connector" aria-hidden="true" />
          <div className="coherence-core">mavera<span className="brand-dot" aria-hidden="true" /></div>
          <span className="coherence-connector" aria-hidden="true" />
          <div className="coherence-row coherence-row--output">
            <span className="coherence-chip coherence-chip--output">Backoffice</span>
            <span className="coherence-chip coherence-chip--output">O teu produto</span>
          </div>
        </div>
      </section>

      <section className="contact-section" aria-labelledby="contact-title">
        <div><p className="eyebrow">O próximo passo</p><h2 id="contact-title">O teu negócio tem<br />uma forma de funcionar.<br /><span>Vamos conhecê-la.</span></h2></div>
        <div>
          <p>Mostra-nos como organizas os horários, a equipa e os clientes. Exploramos contigo como essa operação pode funcionar na Mavera.</p>
          <a className="button primary" href={talkHref}>Pedir uma demonstração <ArrowIcon /></a>
          <p className="contact-note">Uma conversa sobre a tua operação. Sem compromisso.</p>
        </div>
      </section>
    </>
  );
}
