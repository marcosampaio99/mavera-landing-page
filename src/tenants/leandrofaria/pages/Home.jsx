import React from 'react';
import { ButtonLink } from '../components/Layout';
import { content } from '../content';
import { paths } from '../tenant';

export function Home() {
  const { home, steps } = content;

  return (
    <>
      <section className="intro" aria-labelledby="home-title">
        <h1 id="home-title">{home.title}</h1>
        <p className="lead">{home.lead}</p>
        <ul className="chips" aria-label="Treinos">
          {home.facts.map((fact) => <li key={fact}>{fact}</li>)}
        </ul>
        <div className="actions">
          <ButtonLink href={paths.signIn}>Entrar</ButtonLink>
          <ButtonLink href={paths.signUp} variant="outline">Criar conta</ButtonLink>
        </div>
      </section>

      <section className="steps" aria-labelledby="steps-title">
        <h2 id="steps-title" className="eyebrow">Como funciona</h2>
        <ol>
          {steps.map((step, i) => (
            <li key={step.title} className="step">
              <span className="step-num" aria-hidden="true">{i + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
