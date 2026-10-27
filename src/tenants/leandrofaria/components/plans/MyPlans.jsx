import React, { useCallback, useEffect, useState } from 'react';
import { useCustomerEntitlements, useCustomerDuos, useCustomerDuoEntitlements } from '@marcosampaio99/mavera-client/react';

const instant = value => value ? Date.parse(value) : NaN;
function zoneOf(value) {
  try { new Intl.DateTimeFormat('pt-PT', { timeZone: value || 'Europe/Lisbon' }).format(); return value || 'Europe/Lisbon'; }
  catch { return 'Europe/Lisbon'; }
}
function date(value, zone) {
  return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: zone }).format(new Date(value));
}
function calendarDay(value, zone) {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: zone }).formatToParts(new Date(value));
  const get = type => parts.find(part => part.type === type).value;
  return Date.UTC(Number(get('year')), Number(get('month')) - 1, Number(get('day')));
}
function periodOf(plan, now) {
  const period = plan.currentPeriod;
  const start = instant(period?.periodStart), end = instant(period?.periodEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const zone = zoneOf(plan.timezone);
  return { ...period, start, end, zone, current: start <= now && now < end,
    weekly: plan.usageModel === 'PER_PERIOD' && calendarDay(end, zone) - calendarDay(start, zone) === 7 * 86400000 };
}
export function PlanCard({ plan, kind, duoId, onSelect, selected = false, compact = false, now = Date.now() }) {
  const zone = zoneOf(plan.timezone);
  const start = instant(plan.startsAt), end = instant(plan.expiresAt);
  const period = periodOf(plan, now);
  const expired = plan.status === 'ACTIVE' && Number.isFinite(end) && now >= end;
  const upcoming = plan.status === 'ACTIVE' && Number.isFinite(start) && now < start;
  const state = plan.status === 'CANCELLED' ? 'Cancelado' : plan.status === 'PENDING' ? 'Pendente'
    : expired ? 'Expirado' : upcoming ? 'Por iniciar' : plan.status === 'ACTIVE' ? 'Ativo' : 'Estado indisponível';
  const exhausted = plan.usageModel !== 'UNLIMITED' && plan.status === 'ACTIVE' && !expired && !upcoming && period?.current && Number.isFinite(period.remaining) && period.remaining <= 0;
  return <article className="plan-card">
    <div className="plan-card-heading"><h4>{plan.productName || 'Nome do plano indisponível'}</h4><span className="plan-badge">{state}</span></div>
    <p className="secondary">{kind === 'DUO' ? 'Duo · Cobertura e saldo partilhados' : 'Individual · Cobertura pessoal'}</p>
    <details className="plan-facts-disclosure" open={compact ? undefined : true}><summary className={compact ? undefined : 'visually-hidden'}>Detalhes do plano</summary><dl className="plan-facts">
      <div><dt>Validade</dt><dd>{Number.isFinite(start) && Number.isFinite(end)
        ? `${date(start, zone)} até ${date(end, zone)} (fim exclusivo)`
        : Number.isFinite(start) ? `Desde ${date(start, zone)} · fim não indicado`
        : Number.isFinite(end) ? `Até ${date(end, zone)} (fim exclusivo)` : 'Não indicada'}</dd></div>
      {period && <div><dt>{period.weekly ? 'Período semanal do saldo' : 'Período do saldo'}</dt><dd>{date(period.start, period.zone)} — {date(period.end - 1, period.zone)}{!period.current ? ' · Fora do período atual' : ''}</dd></div>}
      <div><dt>Utilizações restantes</dt><dd>{plan.usageModel === 'UNLIMITED' ? 'Ilimitadas'
        : Number.isFinite(period?.remaining) ? `${period.remaining}${Number.isFinite(period.allowance) ? ` de ${period.allowance}` : ''} neste período`
        : 'Saldo não disponível'}</dd></div>
    </dl></details>
    {exhausted && <p className="plan-quota">Sem quota neste período</p>}
    {onSelect && <button type="button" className="btn btn--outline" aria-pressed={selected} disabled={plan.status !== 'ACTIVE'} onClick={() => onSelect({ kind, customerEntitlementId: plan.id, ...(duoId ? { duoId } : {}) }, plan)}>Selecionar plano</button>}
  </article>;
}
function ReadState({ loading, error, refresh, empty, children, label }) {
  if (loading) return <div className="plan-loading" role="status" aria-label={label}><span className="skeleton skeleton--line" /><span className="skeleton skeleton--value" /></div>;
  if (error) return <div><p role="alert">Não foi possível carregar {label.toLowerCase()}.</p><button type="button" className="text-button" onClick={() => refresh().catch(() => {})}>Tentar novamente</button></div>;
  return empty ? null : children;
}
function DuoPlans({ duoId, onSelect, selected, onRead, compact }) {
  const { data, isLoading, error, refresh } = useCustomerDuoEntitlements(duoId);
  const plans = [...new Map((data || []).filter(plan => plan.coverageKind === 'DUO' && plan.duoId === duoId).map(plan => [plan.id, plan])).values()];
  useEffect(() => {
    onRead(duoId, { data, loading: isLoading || (!data && !error), error: !!error });
  }, [duoId, data, isLoading, error, onRead]);
  return <ReadState label="Planos partilhados" loading={isLoading || (!data && !error)} error={error} refresh={refresh} empty={data && !plans.length}>
    {plans.length > 0 && <h3>Duo</h3>}{plans.map(plan => <PlanCard key={plan.id} plan={plan} compact={compact} kind="DUO" duoId={duoId} onSelect={onSelect} selected={selected?.duoId === duoId && selected?.customerEntitlementId === plan.id} />)}
  </ReadState>;
}
export function MyPlans({ onSelect, selected, onAvailable, compact = false }) {
  const [choosing, setChoosing] = useState(false);
  const [sharedReads, setSharedReads] = useState({});
  const onRead = useCallback((id, state) => setSharedReads(previous => JSON.stringify(previous[id]) === JSON.stringify(state) ? previous : { ...previous, [id]: state }), []);
  const individual = useCustomerEntitlements();
  const duos = useCustomerDuos();
  // Personal reads may also contain the commercial Customer's shared coverage.
  // Render shared coverage only through its participant-safe Duo endpoint.
  const plans = [...new Map(individual.entitlements.filter(plan => !plan.duoId && (!plan.coverageKind || plan.coverageKind === 'INDIVIDUAL')).map(plan => [plan.id, plan])).values()];
  const activeDuos = [...new Map((duos.data || []).filter(duo => duo.status === 'ACTIVE').map(duo => [duo.id, duo])).values()];
  const sharedPlans = activeDuos.flatMap(duo => (sharedReads[duo.id]?.data || [])
    .filter(plan => plan.coverageKind === 'DUO' && plan.duoId === duo.id)
    .map(plan => ({ kind: 'DUO', customerEntitlementId: plan.id, duoId: duo.id, plan })));
  const ready = !individual.isLoading && !individual.error && !!duos.data && !duos.isLoading && !duos.error
    && activeDuos.every(duo => sharedReads[duo.id] && !sharedReads[duo.id].loading && !sharedReads[duo.id].error);
  const available = [...plans.map(plan => ({ kind: 'INDIVIDUAL', customerEntitlementId: plan.id, plan })), ...sharedPlans];
  const snapshot = JSON.stringify(ready ? available : null);
  useEffect(() => { onAvailable?.(JSON.parse(snapshot)); }, [snapshot, onAvailable]);
  const selectedPeriod = selected ? periodOf(selected.plan, Date.now()) : null;
  const choose = (reference, plan) => { onSelect?.(reference, plan); setChoosing(false); };
  return <section className={`account-section my-plans${compact ? ' my-plans--compact' : ''}`} aria-labelledby="my-plans-title">
    <h2 id="my-plans-title" className={compact ? 'visually-hidden' : undefined}>O meu plano</h2>
    {ready && !available.length && <p className="secondary">Não tens nenhum plano ativo. Contacta o Leandro para mais informações</p>}
    {compact && selected && !choosing && <div className="selected-plan">
      <div><strong>{selected.plan.productName}</strong><span className="secondary">{selected.kind === 'DUO' ? 'Duo' : 'Individual'} · Selecionado</span>
        <small>{selected.plan.usageModel === 'UNLIMITED' ? 'Treinos ilimitados' : Number.isFinite(selectedPeriod?.remaining)
          ? `${selectedPeriod.remaining} ${selectedPeriod.remaining === 1 ? 'treino disponível' : 'treinos disponíveis'} ${selectedPeriod.current ? selectedPeriod.weekly ? 'esta semana' : 'neste período' : 'no período indicado'}`
          : 'Saldo não disponível'}</small></div>
      <button type="button" className="text-button" onClick={() => setChoosing(true)}>Alterar</button>
      <details className="plan-details"><summary>Detalhes</summary><PlanCard plan={selected.plan} kind={selected.kind} duoId={selected.duoId} /></details>
    </div>}
    <div className="plan-groups" hidden={compact && !!selected && !choosing}>
      {(plans.length > 0 || individual.isLoading || individual.error) && <section className="plan-group" aria-label="Individual">
        {plans.length > 0 && <h3>Individual</h3>}
        <ReadState label="Planos individuais" loading={individual.isLoading} error={individual.error} refresh={individual.refresh} empty={!plans.length}>
          {plans.map(plan => <PlanCard key={plan.id} plan={plan} compact={compact} kind="INDIVIDUAL" onSelect={compact ? choose : onSelect} selected={!selected?.duoId && selected?.customerEntitlementId === plan.id} />)}
        </ReadState>
      </section>}
      <ReadState label="Duos" loading={duos.isLoading || (!duos.data && !duos.error)} error={duos.error} refresh={duos.refresh} empty={duos.data && !activeDuos.length}>
        {activeDuos.map(duo => <div className="plan-group" key={duo.id}><DuoPlans duoId={duo.id} onSelect={compact ? choose : onSelect} selected={selected} onRead={onRead} compact={compact} /></div>)}
      </ReadState>
    </div>
  </section>;
}
