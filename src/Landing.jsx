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
  const talkHref = `mailto:${contactEmail}?subject=${encodeURIComponent('Conhecer a Mavera para o meu negócio')}`;

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <p className="eyebrow">Adaptado ao teu negócio, não o contrário</p>
        <h1 id="hero-title">Cada negócio marca e organiza<br /><span>à sua maneira. O teu também.</span></h1>
        <div className="hero-bottom">
          <a className="text-link" href="#produto">Conhecer o produto <ArrowIcon direction="down" /></a>
          <div className="hero-intro">
            <p>Não é um sistema genérico de marcações — é construído à volta de como o teu negócio realmente funciona: os teus serviços, a tua equipa e os teus horários.</p>
            <a className="button primary" href={talkHref}>Falar sobre o meu negócio <ArrowIcon /></a>
          </div>
        </div>
      </section>

      <section className="agenda-section" id="produto" aria-labelledby="agenda-title">
        <div className="agenda-heading">
          <h2 id="agenda-title">O dia à vista.<br />A semana sob controlo.</h2>
          <p>Consulta a agenda por dia, semana ou mês. Marcações individuais e aulas de grupo, com os horários e profissionais certos.</p>
        </div>
        <figure className="agenda-figure">
          <ProductShot file="agenda.png" alt="Agenda semanal da Mavera com marcações de massagem e sessões de mobilidade, Pilates e treino funcional" width={2160} height={1673} eager />
          <figcaption><span>01 / Agenda semanal</span><span>Produto real · dados de demonstração</span></figcaption>
        </figure>
      </section>

      <section className="session-section" aria-labelledby="session-title">
        <figure className="session-figure">
          <ProductShot file="sessao.png" alt="Detalhe de uma sessão de Mobilidade: horário, profissional, capacidade de sete lugares e três participantes confirmados" width={1815} height={1335} />
          <figcaption>02 / Uma sessão, todos os detalhes</figcaption>
        </figure>
        <div className="session-copy">
          <p className="eyebrow">Uma pessoa ou um grupo</p>
          <h2 id="session-title">Cada sessão tem o seu lugar.</h2>
          <p>Define aulas ou sessões recorrentes, ajusta a capacidade e consulta quem está inscrito. Para atendimentos individuais, gere cada marcação na mesma agenda.</p>
          {/* <a className="text-link" href={talkHref}>Ver a Mavera com o meu caso <ArrowIcon /></a> */}
        </div>
      </section>

      <section className="operation-section" aria-labelledby="operation-title">
        <div className="operation-intro">
          <p className="eyebrow">Tudo ligado</p>
          <h2 id="operation-title">Por trás de cada marcação,<br />uma operação organizada.</h2>
          <p>Para estúdios, clínicas, terapeutas, ginásios e outros negócios que trabalham com marcações.</p>
        </div>
        <dl className="capabilities">
          <div><dt>Clientes</dt><dd>Contactos e histórico de marcações, sempre à mão.</dd></div>
          <div><dt>Serviços e recursos</dt><dd>Define o que ofereces e associa os profissionais, espaços ou equipamentos.</dd></div>
          <div><dt>Disponibilidade</dt><dd>Organiza horários recorrentes e bloqueia períodos de indisponibilidade.</dd></div>
          <div><dt>Notificações</dt><dd>Configura as notificações de marcações para manter as pessoas informadas.</dd></div>
        </dl>
      </section>

      <section className="contact-section" aria-labelledby="contact-title">
        <h2 id="contact-title">Vamos organizar<br />o teu próximo dia?</h2>
        <div><p>Conta-nos como funciona o teu negócio.<br />Mostramos-te como a Mavera se encaixa.</p><a className="button primary" href={talkHref}>Falar sobre o meu negócio <ArrowIcon /></a></div>
      </section>
    </>
  );
}
