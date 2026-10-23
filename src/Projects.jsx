import React from 'react';
import { ArrowIcon } from './ArrowIcon';
import { SectionLabel } from './Site';
import { projects } from './projectList';

function Project({ project, index }) {
  const { name, url, domain, summary, tags, image, mobileImage, alt, tone } = project;
  return (
    <article className="project">
      {/* A imagem repete o link do texto; fica fora da ordem de tabulação. */}
      <a className="project-media" href={url} target="_blank" rel="noreferrer" tabIndex={-1} aria-hidden="true" style={{ '--tone': tone }}>
        <img className="project-desktop" src={image} alt="" width={2880} height={1800} loading="lazy" decoding="async" />
        {mobileImage && <img className="project-phone" src={mobileImage} alt="" width={780} height={1688} loading="lazy" decoding="async" />}
        <span className="project-visit">Visitar <ArrowIcon /></span>
      </a>
      <div className="project-info">
        <span className="project-index">{String(index + 1).padStart(2, '0')}</span>
        <div className="project-text">
          <h3 className="project-name">{name}</h3>
          <p className="project-summary">{summary}</p>
          <ul className="project-tags" aria-label="Âmbito">
            {tags.map((t) => <li key={t}>{t}</li>)}
          </ul>
          <a className="project-link" href={url} target="_blank" rel="noreferrer">
            <span>{domain}</span><ArrowIcon />
            <span className="sr-only"> — {alt} (abre num novo separador)</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export function Projects() {
  return (
    <section className="projects" id="projetos" aria-labelledby="projects-title">
      <div className="wrap">
        <SectionLabel>Projetos</SectionLabel>
        <h2 id="projects-title" className="display-title projects-title" data-reveal>
          <span className="line"><span>Trabalho <em>selecionado.</em></span></span>
        </h2>
        <div className="project-grid">
          {projects.map((p, i) => <Project key={p.id} project={p} index={i} />)}
        </div>
      </div>
    </section>
  );
}
