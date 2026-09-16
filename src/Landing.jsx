import React, { useState } from 'react';

// Screenshots reais ficam em /public/screenshots/<file>. Enquanto o ficheiro
// não existir, mostra-se o placeholder com a especificação de captura.
function ProductShot({ file, alt, spec, tags }) {
  const [pending, setPending] = useState(false);

  return (
    <figure className="shot-frame">
      <div className="shot-chrome" aria-hidden="true"><span /><span /><span /></div>
      {pending ? (
        <div className="shot-pending" role="img" aria-label={alt}>
          <p className="shot-pending-label">Screenshot a capturar</p>
          <p className="shot-pending-spec">{spec}</p>
        </div>
      ) : (
        <img src={`/screenshots/${file}`} alt={alt} loading="lazy" onError={() => setPending(true)} />
      )}
      {/* {tags ? (
        <figcaption className="shot-tags">
          {tags.map((tag) => <span className="shot-tag" key={tag}>{tag}</span>)}
        </figcaption>
      ) : null} */}
    </figure>
  );
}

export function Landing({ contactEmail }) {
  const talkHref = `mailto:${contactEmail}?subject=${encodeURIComponent('A minha box')}`;

  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <span className="eyebrow hero-eyebrow">Gestão de aulas e reservas para estúdios</span>
        <h1 id="hero-title" className="hero-title">Sabe quem vem treinar antes da aula começar.</h1>
        <p className="hero-subtitle">Os teus alunos consultam as próximas aulas e reservam a sua vaga em segundos. A tua equipa acompanha horários, capacidade e participantes num único lugar.</p>
        <div className="hero-actions">
          <a className="button" href="#produto">Ver como funciona</a>
          <a className="button secondary" href={talkHref}>Falar sobre o meu negócio</a>
        </div>
        <div className="flow-strip" aria-label="Como funciona uma reserva, do início ao fim">
          <span className="flow-step">Aula publicada</span>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <span className="flow-step">Aluno reserva</span>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <span className="flow-step">Vaga confirmada</span>
          <span className="flow-arrow" aria-hidden="true">→</span>
          <span className="flow-step">Lista atualizada</span>
        </div>
      </section>

      <section className="section" id="produto" aria-labelledby="agenda-title">
        <div className="section-head">
          <h2 id="agenda-title" className="section-title">A agenda do teu estúdio, e organizada.</h2>
          <p className="section-text">Vê as próximas aulas, acompanha a lotação e abre qualquer sessão para saber exatamente quem confirmou presença.</p>
        </div>
        <div className="product">
          <ProductShot
            file="agenda.png"
            alt="Agenda semanal do backoffice Mavera com as próximas aulas"
            spec="Backoffice — Agenda/Sessões, vista de semana ou dia. Mostrar várias aulas com horário, nome da aula, treinador/recurso e capacidade ou nº de participantes por sessão. Usar dados de demonstração (ex.: “Cross Training 18:00”, “Open Box”, “Mobility”), nunca clientes reais."
          />
        </div>
      </section>

      <section className="section" aria-labelledby="aula-title">
        <div className="section-head">
          <h2 id="aula-title" className="section-title">Antes da aula começar, já sabes quem vem.</h2>
          <p className="section-text">Abre qualquer aula e consulta os participantes inscritos, as vagas disponíveis e os detalhes da sessão. Sem listas paralelas, mensagens espalhadas ou confirmações manuais.</p>
        </div>
        <div className="product">
          <ProductShot
            file="sessao.png"
            alt="Detalhe de uma aula no backoffice Mavera com a lista de participantes"
            spec="Backoffice — Detalhe de uma Session/aula. Mostrar nome da aula, dia e hora, capacidade, nº de inscritos, lista de participantes e estado da sessão. Anonimizar ou usar dados de demonstração — sem nomes, telefones ou emails reais de alunos."
            tags={['Horário', 'Capacidade', 'Participantes', 'Estado da sessão']}
          />
        </div>
      </section>

      <section className="section" aria-labelledby="aluno-title">
        <div className="section-head">
          <h2 id="aluno-title" className="section-title">Para o aluno, confirmar que vai deve demorar segundos.</h2>
        </div>
        <ol className="numbered-flow">
          <li>
            <span className="num">1</span>
            <h3>Consulta as próximas aulas</h3>
            <p>O aluno vê os horários e as sessões disponíveis.</p>
          </li>
          <li>
            <span className="num">2</span>
            <h3>Escolhe a aula</h3>
            <p>Consulta a disponibilidade e reserva a sua vaga.</p>
          </li>
          <li>
            <span className="num">3</span>
            <h3>Está feito</h3>
            <p>A reserva fica associada ao aluno e aparece imediatamente na agenda.</p>
          </li>
        </ol>
      </section>

      <section className="section" aria-labelledby="funciona-title">
        <div className="section-head">
          <h2 id="funciona-title" className="section-title">Como funciona</h2>
        </div>
        <ul className="steps-grid">
          <li>
            <p className="step-index">01</p>
            <h3>Cria o horário uma vez</h3>
            <p>Define as aulas recorrentes, horários, capacidade e restante configuração.</p>
          </li>
          <li>
            <p className="step-index">02</p>
            <h3>Os alunos escolhem quando vão</h3>
            <p>Consultam as próximas aulas e reservam a sua vaga.</p>
          </li>
          <li>
            <p className="step-index">03</p>
            <h3>A lotação atualiza-se automaticamente</h3>
            <p>Cada inscrição fica associada à sessão certa.</p>
          </li>
          <li>
            <p className="step-index">04</p>
            <h3>A equipa sabe quem esperar</h3>
            <p>Antes da aula, basta abrir a sessão e consultar os participantes.</p>
          </li>
        </ul>
      </section>

      <section className="section" aria-labelledby="beneficios-title">
        <div className="section-head">
          <h2 id="beneficios-title" className="section-title">Menos gestão à volta da aula. Mais tempo para o teu negócio.</h2>
        </div>
        <ul className="benefits-grid">
          <li>
            <h3>Presenças organizadas</h3>
            <p>Cada aula tem a sua lista atualizada de participantes.</p>
          </li>
          <li>
            <h3>Capacidade controlada</h3>
            <p>Os lugares disponíveis são geridos por sessão.</p>
          </li>
          <li>
            <h3>Horários recorrentes</h3>
            <p>A programação semanal não precisa de ser recriada constantemente.</p>
          </li>
        </ul>
      </section>

      <section className="section" aria-labelledby="diferenca-title">
        <div className="differentiator">
          <h2 id="diferenca-title" className="section-title">Não é apenas um calendário.</h2>
          <p className="section-text">A Mavera foi construída para ligar o que o cliente vê ao que a equipa gere. A mesma estrutura que apresenta as aulas disponíveis ao aluno alimenta a agenda, as reservas e os participantes no backoffice.</p>
        </div>
      </section>

      <section className="section" aria-labelledby="cta-title">
        <div className="cta-final">
          <h2 id="cta-title" className="section-title">Vê como a Mavera funcionaria no teu local.</h2>
          <p className="section-text">Podemos configurar as tuas aulas, capacidade e horários e mostrar o fluxo completo — desde a reserva do aluno até à lista de participantes da aula.</p>
          <div className="hero-actions">
            <a className="button" href={talkHref}>Falar sobre o meu negócio</a>
            <a className="button secondary" href="#produto">Ver o produto</a>
          </div>
        </div>
      </section>
    </>
  );
}
