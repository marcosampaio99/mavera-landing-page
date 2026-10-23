import React, { useEffect, useRef } from 'react';

/* ---------------------------------------------------------------------------
   Fluxo Mavera: turbulência → o ponto → trilhos.
   Linhas orgânicas convergem no ponto (medido no DOM, nunca posicionado à mão)
   e saem em trilhos paralelos. Antes do ponto as partículas têm ritmo irregular;
   depois ficam equidistantes e à mesma velocidade.
   ------------------------------------------------------------------------ */

const presets = {
  // Hero: linhas cinzentas sobre ivory, trilhos teal.
  hero: { mode: 'flow', lines: 120, rails: 7, color: '16,23,23', lineA: 0.1, pcolor: '16,23,23', partA: 0.62, rcolor: '61,155,139', railA: 0.85, amp: 0.2, seed: 7, turns: true },
  // O problema: só turbulência, sem ponto nem trilhos.
  problem: { mode: 'turb', lines: 70, rails: 0, color: '246,247,245', lineA: 0.08, partA: 0.35, amp: 0.12, seed: 3 },
  // A abordagem: uma linha encontra o ponto entre as duas frases.
  approach: { mode: 'flow', lines: 4, rails: 1, color: '61,155,139', lineA: 0.42, partA: 0.75, railA: 0.7, ampPx: 9, spread: 26, seed: 5 },
  // Contacto: o fluxo completo, em mint sobre petróleo.
  contact: { mode: 'flow', lines: 90, rails: 7, color: '188,229,220', lineA: 0.12, partA: 0.6, railA: 0.75, amp: 0.2, seed: 11, turns: true },
};

const DPR = 2;
const TAU = Math.PI * 2;

// Gerador determinístico: o desenho é sempre o mesmo.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(s) {
  const r = rng(s.seed);
  s.L = [];
  for (let i = 0; i < s.lines; i++) {
    // Ondas largas que viajam ao longo da linha: movimento contínuo, sem tremer.
    s.L.push({
      c0: -0.35 + r() * 1.7,
      a1: 0.4 + r() * 0.6, f1: 0.35 + r() * 0.9, p1: r() * TAU, v1: 0.28 + r() * 0.45,
      a2: 0.05 + r() * 0.12, f2: 1.4 + r() * 2.2, p2: r() * TAU, v2: 0.5 + r() * 0.6,
      d: 0.02 + r() * 0.05, dv: 0.08 + r() * 0.14,
    });
  }
  const n = s.mode === 'turb' ? 90 : Math.max(6, Math.min(170, Math.round(s.lines * 1.3)));
  s.P = [];
  for (let i = 0; i < n; i++) {
    s.P.push({ li: Math.floor(r() * s.lines), t: r(), v: 0.03 + r() * 0.09, sz: 0.9 + r() * 1.7, ph: r() * TAU, wob: 0.3 + r() * 1.2 });
  }
  s.r = r;
}

function point(s, L, t, time) {
  const vert = s.vertical;
  const span = vert ? s.w : s.h;
  const len = vert ? s.h : s.w;
  let a;
  let c;
  if (s.mode === 'turb') {
    a = -30 + t * (len + 60);
    const amp = span * s.amp;
    c = (L.c0 + L.d * Math.sin(time * L.dv + L.p2)) * span
      + amp * (L.a1 * Math.sin(L.f1 * t * TAU + L.p1 - time * L.v1) + L.a2 * Math.sin(L.f2 * t * TAU + L.p2 - time * L.v2));
  } else {
    const da = vert ? s.dy : s.dx;
    const dc = vert ? s.dx : s.dy;
    a = -40 + t * (da + 40);
    const c0 = s.spread ? dc + (L.c0 - 0.5) * s.spread : (L.c0 + L.d * Math.sin(time * L.dv + L.p2)) * span;
    const e = t * t * (3 - 2 * t);
    const env = Math.pow(1 - t, 1.35);
    const amp = s.ampPx != null ? s.ampPx : span * s.amp;
    c = c0 + (dc - c0) * e
      + env * amp * (L.a1 * Math.sin(L.f1 * t * TAU + L.p1 - time * L.v1) + L.a2 * Math.sin(L.f2 * t * TAU + L.p2 - time * L.v2));
  }
  let x = vert ? c : a;
  let y = vert ? a : c;
  // O cursor agita as linhas próximas; ao sair, o sistema acalma devagar.
  if (s.ptr && s.energy > 0.002) {
    const dx = x - s.ptr.x;
    const dy = y - s.ptr.y;
    const R = 160;
    const d2 = dx * dx + dy * dy;
    if (d2 < R * R) {
      const k = 1 - Math.sqrt(d2) / R;
      const push = k * k * 48 * s.energy * Math.sin(time * 3.2 + L.p1 + t * 9);
      if (vert) x += push; else y += push;
    }
  }
  return [x, y];
}

function railPoint(s, k, u) {
  const vert = s.vertical;
  const da = vert ? s.dy : s.dx;
  const dc = vert ? s.dx : s.dy;
  const end = (vert ? s.h : s.w) + 30;
  const a = da + u * (end - da);
  const gap = vert ? 12 : 15;
  const off = (k - (s.rails - 1) / 2) * gap;
  const f = Math.min(1, (a - da) / 140);
  const c = dc + off * f * f * (3 - 2 * f);
  return vert ? [c, a] : [a, c];
}

function measure(s, dot, canvas) {
  if (!dot) return;
  const c = canvas.getBoundingClientRect();
  const d = dot.getBoundingClientRect();
  s.dx = d.left + d.width / 2 - c.left;
  s.dy = d.top + d.height / 2 - c.top;
}

function draw(s, ctx, time, dt) {
  if (s.ptr && s.ptr.active) s.energy += (1 - s.energy) * Math.min(1, dt * 3);
  else s.energy *= Math.exp(-dt * 0.8);

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, s.w, s.h);
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Linhas num único traço: a opacidade nunca passa do valor definido, mesmo onde se cruzam.
  ctx.beginPath();
  for (const L of s.L) {
    for (let i = 0; i <= 90; i++) {
      const p = point(s, L, i / 90, time);
      if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]);
    }
  }
  ctx.strokeStyle = `rgba(${s.color},${s.lineA})`;
  ctx.stroke();

  // Trilhos: no telemóvel descem por trás do texto, por isso ficam a 13%.
  if (s.rails > 0) {
    ctx.beginPath();
    for (let k = 0; k < s.rails; k++) {
      for (let i = 0; i <= 60; i++) {
        const q = railPoint(s, k, i / 60);
        if (i === 0) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]);
      }
    }
    ctx.lineWidth = 1.25;
    ctx.strokeStyle = `rgba(${s.rcolor || s.color},${s.vertical ? Math.min(0.13, s.railA) : s.railA})`;
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  // Partículas antes do ponto: ritmo irregular e tamanhos variáveis.
  ctx.beginPath();
  for (const P of s.P) {
    if (dt) {
      P.t += dt * P.v * (1 + 0.55 * Math.sin(time * P.wob + P.ph));
      if (P.t >= 1) { P.t -= 1; P.li = Math.floor(s.r() * s.L.length); }
    }
    const L = s.L[P.li] || s.L[0];
    if (!L) continue;
    const p = point(s, L, P.t, time);
    ctx.moveTo(p[0] + P.sz, p[1]);
    ctx.arc(p[0], p[1], P.sz, 0, TAU);
  }
  ctx.fillStyle = `rgba(${s.pcolor || s.color},${s.partA})`;
  ctx.fill();

  // Partículas depois do ponto: equidistantes e à mesma velocidade.
  if (s.rails > 0) {
    const railLen = Math.max(1, (s.vertical ? s.h - s.dy : s.w - s.dx) + 30);
    const per = Math.max(3, Math.round(railLen / 105));
    const shift = (time * 46) / railLen;
    ctx.beginPath();
    for (let k = 0; k < s.rails; k++) {
      const stagger = ((k * 3) % s.rails) / (s.rails * per);
      for (let j = 0; j < per; j++) {
        const q = railPoint(s, k, (shift + stagger + j / per) % 1);
        ctx.moveTo(q[0] + 2, q[1]);
        ctx.arc(q[0], q[1], 2, 0, TAU);
      }
    }
    ctx.fillStyle = `rgba(${s.rcolor || s.color},${s.vertical ? 0.4 : 0.95})`;
    ctx.fill();
  }
}

// Canvas 2D a 2x, posicionado por trás da secção-mãe. Pausa fora do ecrã;
// com prefers-reduced-motion desenha um único frame estático.
export function FlowCanvas({ preset, dotRef }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return undefined;
    const host = canvas.parentElement;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const s = { ...presets[preset], w: 0, h: 0, dx: 0, dy: 0, energy: 0, ptr: null, vertical: false, visible: true };
    build(s);

    const still = () => { measure(s, dotRef?.current, canvas); draw(s, ctx, 14, 0); };
    const resize = () => {
      s.w = canvas.clientWidth;
      s.h = canvas.clientHeight;
      if (!s.w || !s.h) return;
      canvas.width = Math.round(s.w * DPR);
      canvas.height = Math.round(s.h * DPR);
      // No telemóvel o fluxo vem de cima e os trilhos descem a partir do ponto.
      s.vertical = !!s.turns && s.w < 720;
      if (reduce) still();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    document.fonts?.ready.then(resize);

    const io = new IntersectionObserver(([entry]) => { s.visible = entry.isIntersecting; }, { rootMargin: '160px 0px' });
    io.observe(canvas);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      s.ptr = { x: e.clientX - r.left, y: e.clientY - r.top, active: true };
    };
    const onLeave = () => { if (s.ptr) s.ptr.active = false; };
    if (!reduce) {
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);
    }

    let raf = 0;
    let last = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const t = now / 1000;
      const dt = last ? Math.min(0.05, t - last) : 0.016;
      last = t;
      if (!s.visible || !s.w) return;
      measure(s, dotRef?.current, canvas);
      draw(s, ctx, t, dt);
    };
    if (!reduce) raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
    };
  }, [preset, dotRef]);

  return <canvas ref={ref} className="flow" aria-hidden="true" />;
}
