import React, { useEffect, useRef, useState } from 'react';
import { ArrowIcon } from './ArrowIcon';
import { FlowCanvas } from './Flow';
import { Projects } from './Projects.jsx';
import { BeforeAfter, Dot, SectionLabel, prefersReducedMotion } from './Site';

/* ---------------------------------------------------------------------------
   Hero — turbulência → o ponto de "era." → trilhos
   ------------------------------------------------------------------------ */

function Hero() {
  const dotRef = useRef(null);
  return (
    <section className="hero" aria-labelledby="hero-title">
      <FlowCanvas preset="hero" dotRef={dotRef} />
      <div className="wrap hero-body">
        <p className="mono-label mono-label--teal">Tecnologia à medida do teu negócio</p>
        <h1 id="hero-title" className="hero-title" lang="en" data-reveal>
          <span className="line"><span>Move into </span></span>
          <span className="line it"><span>a new era<span ref={dotRef} className="node" aria-hidden="true" /></span></span>
        </h1>
        <div className="hero-foot">
          <p className="hero-sub">Identificamos problemas, melhoramos processos e desenvolvemos soluções digitais à medida de cada negócio.</p>
          <div className="ctas">
            <a className="btn btn--ink" href="#missao">Conhece a Mavera</a>
            <a className="text-link" href="#metodo"><span>Como trabalhamos</span><ArrowIcon direction="right" /></a>
          </div>
        </div>
      </div>
      <div className="wrap hero-meta">
        <span className="mono-label hero-motto"><span>Primeiro os processos</span> <span>Depois as ferramentas</span></span>
        <span className="mono-label mono-label--teal hero-hint" aria-hidden="true">Move o cursor</span>
        <a className="scroll-cue" href="#problema" aria-label="Descer para a secção seguinte"><ArrowIcon direction="down" /></a>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   O problema — só turbulência, ainda sem ponto nem trilhos
   ------------------------------------------------------------------------ */

const problems = [
  { title: 'Tarefas repetitivas', text: 'A mesma mensagem, o mesmo registo, a mesma confirmação, todas as semanas.' },
  { title: 'Sistemas desligados', text: 'O site, os pagamentos e a gestão não falam entre si. Alguém tem de fazer a ponte à mão.' },
  { title: 'Informação dispersa', text: 'Contactos no telemóvel, marcações em papel, contas no Excel.' },
];

function Problem() {
  return (
    <section className="problem" id="problema" aria-labelledby="problem-title">
      <FlowCanvas preset="problem" />
      <div className="wrap">
        <SectionLabel>O problema</SectionLabel>
        <h2 id="problem-title" className="problem-title" data-reveal>
          <span className="line"><span>Todos os negócios têm processos </span></span>
          <span className="line it"><span>que podem <em>melhorar.</em></span></span>
        </h2>
        <ul className="problems">
          {problems.map(({ title, text }, i) => (
            <li key={title}>
              <span className="mono-label">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   A missão e a abordagem
   ------------------------------------------------------------------------ */

function Mission() {
  return (
    <section className="mission" id="missao" aria-label="A nossa missão">
      <div className="wrap">
        <h2 className="mission-title" data-reveal>
          <span className="line"><span>Pôr a tecnologia a trabalhar </span></span>
          <span className="line"><span>para o teu negócio, </span></span>
          <span className="line it"><span><em>e não o contrário.</em></span></span>
        </h2>
      </div>
    </section>
  );
}

function Approach() {
  const dotRef = useRef(null);
  return (
    <section className="approach" aria-labelledby="approach-title">
      <FlowCanvas preset="approach" dotRef={dotRef} />
      <div className="wrap">
        <SectionLabel>A abordagem</SectionLabel>
        <h2 id="approach-title" className="approach-title" data-reveal>
          <span className="line"><span>Primeiro os processos. </span></span>
          <span className="approach-mid" aria-hidden="true"><span ref={dotRef} className="approach-dot" /></span>
          <span className="line it approach-end"><span>Depois as <em>ferramentas.</em></span></span>
        </h2>
        <p className="approach-note">Começamos por perceber como o teu negócio funciona: quem marca, quem confirma, onde se perde tempo. A tecnologia vem a seguir.</p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   O que fazemos
   ------------------------------------------------------------------------ */

// Módulos reais da barra lateral do backoffice Mavera.
const backofficeNav = [
  { group: 'Operação', items: ['Agenda', 'Marcações individuais', 'Sessões coletivas', 'Clientes'] },
  { group: 'Negócio', items: ['Localizações', 'Serviços', 'Planos e packs', 'Profissionais', 'Horários'] },
];
const backofficeModules = backofficeNav.flatMap(({ group, items }) => items.map((name) => ({ group, name })));

// Uma réplica reduzida do backoffice: o módulo ativo muda devagar.
function BackofficeMini() {
  const [active, setActive] = useState(0);
  const paused = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const id = setInterval(() => {
      if (!paused.current) setActive((i) => (i + 1) % backofficeModules.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const current = backofficeModules[active];
  let n = -1;

  return (
    <div
      className="bo"
      aria-hidden="true"
      onPointerEnter={() => { paused.current = true; }}
      onPointerLeave={() => { paused.current = false; }}
    >
      <div className="bo-side">
        <span className="bo-logo">mavera<Dot /></span>
        {backofficeNav.map(({ group, items }) => (
          <div key={group} className="bo-group">
            <span className="bo-group-label">{group}</span>
            {items.map((item) => {
              n += 1;
              const i = n;
              return (
                <span key={item} className={`bo-item ${i === active ? 'is-active' : ''}`} onPointerEnter={() => setActive(i)}>{item}</span>
              );
            })}
          </div>
        ))}
      </div>
      <div className="bo-main">
        <span className="bo-eyebrow">{current.group}</span>
        <span key={current.name} className="bo-title">{current.name}</span>
        <span className="bo-rows"><i /><i /><i /><i /></span>
      </div>
    </div>
  );
}

function SiteAssembly() {
  return (
    <div className="assembly" aria-hidden="true">
      <div className="assembly-bar"><i /><i /><i /><b /></div>
      <div className="assembly-head"><i /><i /></div>
      <div className="assembly-media" />
      <div className="assembly-book">
        <span className="assembly-slots"><i>09:00</i><i>12:30</i><i className="on">18:30</i></span>
        <span className="assembly-cta">
          <span className="assembly-cta-a">Reservar</span>
          <span className="assembly-cta-b">Reservado</span>
        </span>
      </div>
    </div>
  );
}

const connections = ['Website', 'Cartão e MB WAY', 'Faturação', 'Email', 'Lembretes por mensagem', 'Os teus sistemas'];

// Cada ferramenta liga-se a uma única linha que termina na Mavera.
function Connections() {
  return (
    <div className="links" aria-hidden="true">
      <ul className="links-list">
        {connections.map((c, i) => (
          <li key={c} style={{ '--i': i }}><span className="links-name">{c}</span><i className="links-wire" /></li>
        ))}
      </ul>
      <span className="links-hub"><i className="links-wire" /><span>mavera<Dot /></span></span>
    </div>
  );
}

// Nomes e frases das Soluções no Instagram.
const services = [
  {
    id: 'software', title: 'Software à medida', lead: 'Software pensado para o teu negócio.',
    text: 'Começa no backoffice da Mavera: agenda, marcações individuais, sessões coletivas com capacidade, clientes, planos e packs. Configuramos à forma como trabalhas e desenvolvemos o que faltar.',
    visual: <BackofficeMini />,
  },
  {
    id: 'web', title: 'Websites', lead: 'Mais do que estar online.', label: 'Marca · Clientes · Operação',
    text: 'O site da tua marca com a marcação lá dentro. O cliente escolhe o horário, paga por cartão ou MB WAY e a reserva entra na tua agenda.',
    visual: <SiteAssembly />,
  },
  {
    id: 'automation', title: 'Processos e automação', lead: 'Menos tarefas repetitivas.',
    text: 'Procuramos o trabalho manual que se repete todas as semanas e passamos a fazê-lo de forma automática.',
    visual: <BeforeAfter />,
  },
  {
    id: 'integrations', title: 'Integrações', lead: 'Fazer os sistemas trabalhar em conjunto.',
    text: 'Website, pagamentos e gestão num só fluxo: cartão e MB WAY, faturação, email e lembretes por mensagem ligados ao backoffice.',
    visual: <Connections />,
  },
];

function Services() {
  return (
    <section className="services" id="o-que-fazemos" aria-labelledby="services-title">
      <div className="wrap">
        <div className="services-head">
          <div>
            <SectionLabel>O que fazemos</SectionLabel>
            <h2 id="services-title" className="display-title" data-reveal>
              <span className="line"><span>O que <em>fazemos.</em></span></span>
            </h2>
          </div>
          <p>Temos um backoffice nosso. À volta dele construímos o que o teu negócio precisar: o site, os pagamentos, as automações.</p>
        </div>

        <div className="service-list">
          {services.map(({ id, title, lead, label, text, visual }, i) => (
            <article key={id} className={`service service--${id}`}>
              <div className="service-copy">
                <p className="mono-label">{label ? `0${i + 1} · ${label}` : `0${i + 1}`}</p>
                <h3>{title}</h3>
                <p className="service-lead">{lead}</p>
                <p>{text}</p>
              </div>
              <div className="service-visual">{visual}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Produto — capturas reais do backoffice
   ------------------------------------------------------------------------ */

function Shot({ file, alt, width, height, index, caption, className }) {
  return (
    <figure className={`shot ${className}`}>
      <a className="shot-frame" href={`/screenshots/${file}`} target="_blank" rel="noreferrer" aria-label={`${alt} — abrir imagem em tamanho completo (novo separador)`}>
        <img src={`/screenshots/${file}`} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
      </a>
      <figcaption><span className="shot-index">{index}</span>{caption}</figcaption>
    </figure>
  );
}

function Work() {
  return (
    <section className="work" id="produto" aria-labelledby="work-title">
      <div className="wrap">
        <SectionLabel>Produto</SectionLabel>
        <div className="work-head">
          <h2 id="work-title" className="display-title work-title" data-reveal>
            <span className="line"><span>Construído na <em>Mavera</em><span className="node" aria-hidden="true" /></span></span>
          </h2>
          <p>Capturas do backoffice da Mavera, com dados de demonstração: a agenda da semana e uma sessão coletiva com os lugares ocupados.</p>
        </div>

        <div className="work-stage">
          <Shot
            className="shot--agenda"
            file="agenda.png"
            alt="Agenda semanal do backoffice Mavera com marcações individuais e sessões coletivas"
            width={2160} height={1673}
            index="01" caption="Agenda semanal"
          />
          <Shot
            className="shot--session"
            file="sessao.png"
            alt="Detalhe de uma sessão coletiva no backoffice Mavera, com participantes e capacidade"
            width={1815} height={1335}
            index="02" caption="Sessão coletiva · participantes e capacidade"
          />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Método — um ponto percorre os cinco passos ao fazer scroll
   ------------------------------------------------------------------------ */

const steps = [
  { name: 'Conversa', text: 'Percebemos o negócio e os objetivos.' },
  { name: 'Diagnóstico', text: 'Erros, tarefas repetidas, tempo perdido.' },
  { name: 'Proposta', text: 'Só o que o negócio precisa.' },
  { name: 'Implementação', text: 'Ferramentas configuradas à medida.' },
  { name: 'Acompanhamento', text: 'Continuamos ao lado.' },
];

function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) { setProgress(1); return undefined; }
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight * 0.7 - r.top) / Math.max(1, r.height * 0.75)));
      setProgress((prev) => (Math.abs(prev - p) > 0.003 || p === 0 || p === 1 ? p : prev));
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);
  return progress;
}

function Method() {
  const ref = useRef(null);
  const progress = useScrollProgress(ref);
  return (
    <section className="process" id="metodo" aria-labelledby="process-title" ref={ref}>
      <div className="wrap">
        <div className="process-head">
          <div>
            <SectionLabel>Método</SectionLabel>
            <h2 id="process-title" className="display-title" data-reveal>
              <span className="line"><span>Como <em>trabalhamos.</em></span></span>
            </h2>
          </div>
          <p>Cinco passos, sempre pela mesma ordem. Nenhum começa antes de o anterior estar claro.</p>
        </div>
        <div className="timeline" style={{ '--p': progress.toFixed(3) }}>
          <span className="tl-track" aria-hidden="true" />
          <span className="tl-fill" aria-hidden="true" />
          <span className="tl-dot" aria-hidden="true" />
          <ol className="tl-list">
            {steps.map(({ name, text }, i) => (
              <li key={name} className={i === 0 || progress >= i / 4 - 0.02 ? 'is-on' : ''}>
                <span className="tl-mark" aria-hidden="true" />
                <span className="mono-label mono-label--teal">0{i + 1}</span>
                <h3>{name}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   A tua marca à frente. A Mavera por trás.
   ------------------------------------------------------------------------ */

// Exemplos neutros: três tipos de negócio, nenhuma marca.
const brands = [
  {
    id: 'estudio', label: 'Estúdio', nav: ['Aulas', 'Equipa', 'Contacto'],
    kicker: 'Aulas de grupo', service: 'Pilates Reformer', meta: '50 min',
    day: 'Quinta, 17 set', slots: ['08:00', '12:30', '18:30'], free: '4 lugares livres', cta: 'Reservar lugar',
    system: { type: 'Sessão coletiva', capacity: 3, total: 7 },
  },
  {
    id: 'salao', label: 'Salão', nav: ['Serviços', 'Equipa', 'Marcar'],
    kicker: 'Cabelo', service: 'Corte & brushing', meta: '60 min',
    day: 'Sábado, 19 set', slots: ['10:00', '11:30', '15:00'], free: 'Disponível', cta: 'Marcar',
    system: { type: 'Marcação individual', capacity: 0, total: 1 },
  },
  {
    id: 'escola', label: 'Escola', nav: ['Aulas', 'Packs', 'Contacto'],
    kicker: 'Escola de surf', service: 'Iniciação ao surf', meta: '2 h',
    day: 'Domingo, 20 set', slots: ['08:00', '10:30', '16:00'], free: '6 lugares livres', cta: 'Garantir lugar',
    system: { type: 'Sessão coletiva', capacity: 6, total: 12 },
  },
];

function BrandLayer({ b }) {
  return (
    <div className={`layer layer--brand brand--${b.id}`}>
      <div className="stage-top">
        <span className="b-logo"><i /><b /></span>
        <span className="b-nav">{b.nav.map((n) => <span key={n}>{n}</span>)}</span>
      </div>
      <div className="stage-main">
        <span className="b-kicker">{b.kicker}</span>
        <span className="b-title">{b.service}</span>
        <span className="b-meta">{b.meta}</span>
      </div>
      <div className="stage-card b-card">
        <span className="b-day">{b.day}</span>
        <span className="b-slots">{b.slots.map((s, i) => <span key={s} className={i === 2 ? 'on' : ''}>{s}</span>)}</span>
        <span className="b-free">{b.free}</span>
        <span className="b-cta">{b.cta}</span>
      </div>
    </div>
  );
}

function SystemLayer({ b }) {
  const { type, capacity, total } = b.system;
  return (
    <div className="layer layer--system">
      <div className="stage-top">
        <span className="s-logo">mavera<Dot /></span>
        <span className="s-status"><i />No domínio da tua marca</span>
      </div>
      <div className="stage-main">
        <span className="s-key">Serviço</span>
        <span className="s-title">{b.service}</span>
        <dl className="s-rows">
          <div><dt>Tipo</dt><dd>{type}</dd></div>
          <div><dt>Disponibilidade</dt><dd>{b.slots.join(' · ')}</dd></div>
          <div><dt>Pagamento</dt><dd>Cartão · MB WAY</dd></div>
        </dl>
      </div>
      <div className="stage-card s-card">
        <span className="s-key">Reserva {b.slots[2]}</span>
        <span className="s-capacity" style={{ '--fill': (capacity + 1) / total }}>
          <span>{capacity} → {capacity + 1} / {total}</span><i />
        </span>
        <span className="s-flow"><span>Cliente</span><span>Agenda</span><span>Confirmação</span></span>
      </div>
    </div>
  );
}

function BrandXray({ children }) {
  const [split, setSplit] = useState(58);
  const [brandIndex, setBrandIndex] = useState(0);
  const [touched, setTouched] = useState(false);
  const stageRef = useRef(null);
  const dragging = useRef(false);
  const b = brands[brandIndex];

  const fromPointer = (e) => {
    const r = stageRef.current.getBoundingClientRect();
    setSplit(Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100))));
    setTouched(true);
  };

  return (
    <div className={`xray ${touched ? '' : 'xray--hint'}`}>
      <div className="xray-copy">
        {children}
        <p className="xray-hint-text">Arrasta para ver o que acontece por trás.</p>
        <div className="brand-switch" role="group" aria-label="Experimentar outro tipo de negócio">
          {brands.map((brand, i) => (
            <button key={brand.id} type="button" aria-pressed={i === brandIndex} onClick={() => setBrandIndex(i)}>
              {brand.label}
            </button>
          ))}
        </div>
        <p className="behind-note">Exemplo ilustrativo. A tecnologia é a mesma.</p>
      </div>

      <div
        ref={stageRef}
        className="xray-stage"
        style={{ '--split': split }}
        onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); fromPointer(e); }}
        onPointerMove={(e) => { if (dragging.current || e.pointerType === 'mouse') fromPointer(e); }}
        onPointerUp={() => { dragging.current = false; }}
        onPointerCancel={() => { dragging.current = false; }}
      >
        <div className="xray-layers" aria-hidden="true">
          <SystemLayer b={b} />
          <div className="xray-front"><BrandLayer b={b} /></div>
        </div>
        <input
          className="xray-range"
          type="range" min="0" max="100" value={split}
          onChange={(e) => { setSplit(Number(e.target.value)); setTouched(true); }}
          aria-label="Mostrar a tecnologia Mavera por trás da marca"
          aria-valuetext={`${split}% marca, ${100 - split}% Mavera`}
        />
        <span className="xray-handle" aria-hidden="true">
          <span className="xray-grip"><Dot /></span>
        </span>
        <span className="xray-tag xray-tag--brand" aria-hidden="true">A tua marca</span>
        <span className="xray-tag xray-tag--system" aria-hidden="true">A Mavera</span>
      </div>
      <p className="sr-only" aria-live="polite">
        Exemplo: o cliente reserva {b.service} no website da tua marca. Por trás, a Mavera gere o serviço, a disponibilidade, a capacidade, o pagamento por cartão ou MB WAY e a confirmação.
      </p>
    </div>
  );
}

function BrandBehind() {
  return (
    <section className="behind" id="marca" aria-labelledby="behind-title">
      <div className="wrap">
        <SectionLabel>A tua marca</SectionLabel>
        <BrandXray>
          <h2 id="behind-title" className="display-title behind-title" data-reveal>
            <span className="line"><span>A tua marca à frente. </span></span>
            <span className="line it"><span><em>A Mavera por trás</em><span className="node" aria-hidden="true" /></span></span>
          </h2>
        </BrandXray>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Homepage
   ------------------------------------------------------------------------ */

export function Landing() {
  return (
    <>
      <Hero />
      <Problem />
      <Mission />
      <Approach />
      <Services />
      <Work />
      <BrandBehind />
      <Method />
      <Projects />
    </>
  );
}
