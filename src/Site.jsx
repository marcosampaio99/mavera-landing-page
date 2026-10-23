import React, { useEffect, useRef, useState } from 'react';
import { ArrowIcon } from './ArrowIcon';
import { FlowCanvas } from './Flow';

export const backofficeUrl = 'https://app.mavera.pt/login';
export const instagramUrl = 'https://www.instagram.com/mavera.pt/';
export const slogan = 'A move into a new era.';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// O ponto do logótipo. Usado como pontuação e como marca da camada Mavera.
export function Dot({ className = '' }) {
  return <span className={`dot ${className}`} aria-hidden="true" />;
}

export function SectionLabel({ index, children }) {
  return (
    <p className="section-label">
      {index && <span className="section-index">{index}</span>}
      <span>{children}</span>
    </p>
  );
}

// Antes/depois da automação, como no Instagram: várias tarefas, um processo.
const manualTasks = ['Copiar dados entre folhas', 'Enviar a mesma mensagem a cada cliente', 'Confirmar pedidos à mão', 'Atualizar registos'];

export function BeforeAfter() {
  return (
    <div className="before-after">
      <div className="ba-col">
        <p className="mono-label">Antes</p>
        <ul className="ba-before">
          {manualTasks.map((task) => <li key={task}>{task}</li>)}
        </ul>
      </div>
      <span className="ba-arrow" aria-hidden="true"><ArrowIcon direction="down" /></span>
      <div className="ba-col">
        <p className="mono-label">Depois</p>
        <p className="ba-after">Um processo, feito automaticamente<Dot className="dot--period" /></p>
      </div>
    </div>
  );
}

// Revela elementos marcados com data-reveal quando entram no ecrã.
export function useReveal() {
  useEffect(() => {
    const els = [...document.querySelectorAll('[data-reveal]')];
    if (!('IntersectionObserver' in window) || prefersReducedMotion()) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    document.documentElement.classList.add('reveal-ready');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

function useHeaderState(menuOpen) {
  const [state, setState] = useState({ scrolled: false, hidden: false });
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const goingDown = y > lastY + 4;
      const goingUp = y < lastY - 4;
      setState((prev) => {
        const next = {
          scrolled: y > 24,
          hidden: menuOpen ? false : goingDown && y > 160 ? true : goingUp ? false : prev.hidden,
        };
        return next.scrolled === prev.scrolled && next.hidden === prev.hidden ? prev : next;
      });
      if (goingDown || goingUp) lastY = y;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(frame); };
  }, [menuOpen]);
  return state;
}

export function SiteHeader({ current, hasContact }) {
  const [open, setOpen] = useState(false);
  const { scrolled, hidden } = useHeaderState(open);
  const toggleRef = useRef(null);
  const contactHref = hasContact ? '#contacto' : '/#contacto';

  const links = [
    { href: '/solucoes', label: 'Soluções', id: 'solucoes' },
    { href: '/#metodo', label: 'Método', id: 'metodo' },
    { href: '/#projetos', label: 'Projetos', id: 'projetos' },
    { href: contactHref, label: 'Contacto', id: 'contacto' },
  ];

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add('menu-lock');
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => { document.body.classList.remove('menu-lock'); window.removeEventListener('keydown', onKey); };
  }, [open]);

  const classes = ['site-header', scrolled && 'is-scrolled', hidden && 'is-hidden', open && 'is-open'].filter(Boolean).join(' ');

  return (
    <header className={classes}>
      <div className="wrap header-bar">
        <a className="brand" href="/" aria-label="Mavera — página inicial">mavera<Dot /></a>
        <nav className="header-nav" aria-label="Navegação principal">
          {links.map(({ href, label, id }) => (
            <a key={id} className="nav-link" href={href} aria-current={current === id ? 'page' : undefined}><span>{label}</span></a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="nav-backoffice" href={backofficeUrl}>Backoffice <ArrowIcon /></a>
          <a className="btn btn--line btn--sm" href={contactHref}>Falar connosco</a>
        </div>
        <button
          ref={toggleRef}
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="menu-panel"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="menu-toggle-label">{open ? 'Fechar' : 'Menu'}</span>
          <span className="menu-toggle-icon" aria-hidden="true"><span /><span /></span>
        </button>
      </div>
      <div id="menu-panel" className="menu-panel" hidden={!open}>
        <nav className="wrap menu-links" aria-label="Menu">
          {links.map(({ href, label, id }, i) => (
            <a key={id} href={href} onClick={() => setOpen(false)} style={{ '--i': i }} aria-current={current === id ? 'page' : undefined}>
              <span className="menu-index">0{i + 1}</span>{label}
            </a>
          ))}
          <a className="menu-backoffice" href={backofficeUrl}>Entrar no backoffice <ArrowIcon /></a>
        </nav>
      </div>
    </header>
  );
}

// Contacto: o fluxo completo (turbulência, ponto mint, trilhos) sobre petróleo.
export function Closing({ contactEmail }) {
  const talkHref = `mailto:${contactEmail}?subject=${encodeURIComponent('Falar com a Mavera')}`;
  const dotRef = useRef(null);

  // TODO(conteúdo): o slide 1/2 do Contacto no Instagram ainda está por completar.
  return (
    <section className="closing" id="contacto" aria-labelledby="closing-title">
      <FlowCanvas preset="contact" dotRef={dotRef} />
      <div className="wrap">
        <SectionLabel>Contacto</SectionLabel>
        <h2 id="closing-title" className="closing-title" data-reveal>
          <span className="line"><span>Tudo começa com </span></span>
          <span className="line it"><span>uma <em>conversa</em><span ref={dotRef} className="node" aria-hidden="true" /></span></span>
        </h2>
        <p className="closing-sub">Conta-nos o que gostarias de melhorar.</p>
        <div className="closing-actions">
          <a className="btn btn--ivory" href={talkHref}>Envia-nos uma mensagem</a>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ privacyUrl, termsUrl }) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-top">
          <a className="footer-mark" href="/" aria-label="Mavera — página inicial">mavera<Dot /></a>
          <p className="footer-slogan" lang="en"><em>{slogan}</em></p>
        </div>
        {/* Três níveis: o site, os acessos externos e a parte legal. */}
        <div className="footer-cols">
          <nav className="footer-col footer-col--site" aria-labelledby="footer-site">
            <p id="footer-site" className="mono-label">Mavera</p>
            <a className="footer-ext" href="/solucoes">Soluções <ArrowIcon /></a>
            <a className="footer-ext" href="/#metodo">Método <ArrowIcon /></a>
            <a className="footer-ext" href="/#projetos">Projetos <ArrowIcon /></a>
          </nav>
          <div className="footer-col">
            <p className="mono-label">Clientes</p>
            <a className="footer-ext" href={backofficeUrl}>Backoffice <ArrowIcon /></a>
          </div>
          <div className="footer-col">
            <p className="mono-label">Segue-nos</p>
            <a className="footer-ext" href={instagramUrl} target="_blank" rel="noreferrer">Instagram <ArrowIcon /><span className="sr-only"> @mavera.pt (abre num novo separador)</span></a>
          </div>
        </div>
        <div className="footer-base">
          <nav className="footer-legal" aria-label="Informação legal">
            <a href={privacyUrl}>Privacidade</a>
            <a href={termsUrl}>Termos</a>
          </nav>
          <p className="mono-label">Feito em Portugal · {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
