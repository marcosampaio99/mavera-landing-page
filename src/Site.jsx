import React, { useEffect, useRef, useState } from 'react';
import { ArrowIcon } from './ArrowIcon';

export const backofficeUrl = 'https://app.mavera.pt/login';

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

export function Button({ href, children, variant = 'dark' }) {
  return (
    <a className={`btn btn--${variant}`} href={href}>
      <span className="btn-text">{children}</span>
      <span className="btn-icon"><ArrowIcon /></span>
    </a>
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
          <a className="nav-backoffice" href={backofficeUrl}>Backoffice <ArrowIcon /></a>
        </nav>
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

export function Closing({ contactEmail, index }) {
  const talkHref = `mailto:${contactEmail}?subject=${encodeURIComponent('Falar com a Mavera')}`;
  const ctaRef = useRef(null);

  // Atração magnética subtil do botão principal.
  const onMove = (e) => {
    if (prefersReducedMotion() || e.pointerType !== 'mouse') return;
    const el = ctaRef.current;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.setProperty('--mx', `${dx * 0.12}px`);
    el.style.setProperty('--my', `${dy * 0.12}px`);
  };
  const onLeave = () => {
    ctaRef.current?.style.setProperty('--mx', '0px');
    ctaRef.current?.style.setProperty('--my', '0px');
  };

  return (
    <section className="closing" id="contacto" aria-labelledby="closing-title">
      <div className="wrap">
        <SectionLabel index={index}>Contacto</SectionLabel>
        <div className="closing-grid" data-reveal>
          <h2 id="closing-title" className="closing-title">
            <span className="line"><span>Vamos construir</span></span>
            <span className="line"><span>alguma coisa?</span></span>
          </h2>
          <div className="closing-side">
            <p>Estúdio, salão ou empresa: conta-nos como trabalhas hoje. O resto desenhamos contigo.</p>
            <a className="closing-mail" href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </div>
          <a ref={ctaRef} className="closing-cta" href={talkHref} onPointerMove={onMove} onPointerLeave={onLeave}>
            <span>Falar com a Mavera</span>
            <span className="closing-cta-icon"><ArrowIcon /></span>
          </a>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter({ privacyUrl, termsUrl }) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-row">
          <a className="footer-mark" href="/" aria-label="Mavera — página inicial">mavera<Dot /></a>
          <nav aria-label="Ligações do rodapé">
            <a href="/solucoes">Soluções</a>
            <a href={backofficeUrl}>Backoffice</a>
            <a href={privacyUrl}>Privacidade</a>
            <a href={termsUrl}>Termos</a>
          </nav>
        </div>
        <p className="footer-place"><Dot />Feito em Portugal · {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
