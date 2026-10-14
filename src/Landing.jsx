import React, { useEffect, useRef, useState } from 'react';
import { ArrowIcon } from './ArrowIcon';
import { Projects } from './Projects.jsx';
import { Button, Dot, SectionLabel, prefersReducedMotion } from './Site';

/* ---------------------------------------------------------------------------
   01 — Hero
   ------------------------------------------------------------------------ */

function Hero({ talkHref }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="wrap">
        <div className="hero-meta" data-reveal>
          <span className="section-index">01</span>
          <span>Software · Websites · Integrações</span>
          <span className="hero-meta-end">Feito em Portugal</span>
        </div>

        <h1 id="hero-title" className="hero-title" data-reveal>
          <span className="line"><span>Tecnologia</span></span>
          <span className="line line--measure"><span>à medida</span></span>
          <span className="line"><span>do teu negócio<Dot className="dot--period" /></span></span>
        </h1>

        <div className="hero-foot" data-reveal>
          <p className="hero-sub">Software, websites e soluções digitais para negócios de serviços.</p>
          <Button href={talkHref}>Vamos conversar</Button>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   02 — O que fazemos
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

const services = [
  {
    id: 'software', tag: 'A', title: 'Software & Gestão',
    text: 'Um backoffice nosso. Reservas, sessões, clientes e planos no mesmo sítio.',
    visual: <BackofficeMini />,
  },
  {
    id: 'web', tag: 'B', title: 'Websites & Experiências Digitais',
    text: 'Sites com a cara da tua marca — com reserva e pagamento online, por cartão ou MB WAY.',
    visual: <SiteAssembly />,
  },
  {
    id: 'integrations', tag: 'C', title: 'Integrações & Automação',
    text: 'Pagamentos por cartão e MB WAY, faturação, email e lembretes por mensagem a falar entre si. Menos trabalho repetido.',
    visual: <Connections />,
  },
];

function Services() {
  return (
    <section className="services" id="o-que-fazemos" aria-labelledby="services-title">
      <div className="wrap">
        <SectionLabel index="02">O que fazemos</SectionLabel>
        <h2 id="services-title" className="display-title services-title" data-reveal>
          <span className="line"><span>Produto próprio.</span></span>
          <span className="line"><span><em>Execução à medida.</em></span></span>
        </h2>

        <div className="service-list">
          {services.map(({ id, tag, title, text, visual }) => (
            <article key={id} className={`service service--${id}`} data-reveal>
              <div className="service-copy">
                <span className="service-tag">{tag}</span>
                <h3>{title}</h3>
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
   03 — Produto
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
        <SectionLabel index="03">Produto</SectionLabel>
        <div className="work-head" data-reveal>
          <h2 id="work-title" className="display-title work-title">
            <span className="line"><span>Construído na Mavera<Dot className="dot--period" /></span></span>
          </h2>
          <p>Não é um mockup. É o nosso backoffice a funcionar — aqui com dados de demonstração.</p>
        </div>

        <div className="work-stage" data-reveal>
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
   05 — A tua marca à frente. A Mavera por trás.
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
        <SectionLabel index="05">A tua marca</SectionLabel>
        <BrandXray>
          <h2 id="behind-title" className="display-title behind-title" data-reveal>
            <span className="line"><span>A tua marca à frente.</span></span>
            <span className="line"><span><em>A Mavera por trás<Dot className="dot--period" /></em></span></span>
          </h2>
        </BrandXray>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------------------
   Homepage
   ------------------------------------------------------------------------ */

export function Landing({ contactEmail }) {
  const talkHref = `mailto:${contactEmail}?subject=${encodeURIComponent('Vamos conversar')}`;

  return (
    <>
      <Hero talkHref={talkHref} />
      <Services />
      <Work />
      <Projects index="04" />
      <BrandBehind />
      <a className="solutions-link wrap" href="/solucoes">
        <span>Tudo o que fazemos, em detalhe</span>
        <span className="solutions-link-go">Ver soluções <ArrowIcon /></span>
      </a>
    </>
  );
}
