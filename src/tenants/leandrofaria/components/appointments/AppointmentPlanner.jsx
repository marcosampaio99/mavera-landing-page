import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMaveraAuth, useMaveraClient } from '@marcosampaio99/mavera-client/react';
import { MyPlans } from '../plans/MyPlans';
import { useBookingCommands, confirmationAllowed, commandFor } from './bookingCommands';
import { publicBookingApi } from './publicBookingApi';
import { AppointmentCalendar, TimeSlots, dateLabel } from './AppointmentCalendar';

const BookingContext = createContext(null);

function useRead(key, read) {
  const loader = useRef(read); loader.current = read;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: null, attempt: -1 });
  useEffect(() => {
    const controller = new AbortController();
    setState({ key, attempt, loading: true });
    Promise.resolve().then(() => loader.current(controller.signal)).then(data => {
      if (!controller.signal.aborted) setState({ key, attempt, data });
    }).catch(() => { if (!controller.signal.aborted) setState({ key, attempt, error: true }); });
    return () => controller.abort();
  }, [key, attempt]);
  return { ...(state.key === key && state.attempt === attempt ? state : { loading: true }), retry: () => setAttempt(value => value + 1) };
}
function Read({ state, children }) {
  if (state.loading) return <p role="status">A consultar opções…</p>;
  if (state.error) return <div><p role="alert">Não foi possível consultar as opções. Verifica a ligação e tenta novamente.</p><button type="button" className="text-button" onClick={state.retry}>Tentar novamente</button></div>;
  return children;
}
function Choice({ label, items, value, onChange }) {
  return items.length === 1 ? null
    : <label className="appointment-choice">{label}<select value={value || ''} onChange={event => onChange(event.target.value)}><option value="">Selecionar</option>{items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>;
}
function resolveChoice(items, id) { return items.length === 1 ? items[0] : items.find(item => item.id === id); }
function BookingSummary({ selection, service, location, resource, query, slot, timezone, onConflict }) {
  const commands = useContext(BookingContext);
  const input = commandFor(selection, service, query, slot);
  const record = commands.get(input);
  const valid = confirmationAllowed(selection, service, query, slot, timezone);
  const terminal = ['confirmed', 'pending-booking', 'blocked', 'conflict'].includes(record?.phase);
  const label = record?.phase === 'processing' ? 'A confirmar…' : record?.phase === 'confirmed' ? 'Treino confirmado'
    : record?.phase === 'pending-booking' ? 'Reserva pendente' : record?.phase === 'uncertain' ? input.duoId && !record.receipt ? 'Tentar novamente' : 'Verificar reserva' : 'Confirmar treino';
  const live = record?.booking;
  const formatTime = value => new Intl.DateTimeFormat('pt-PT', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
  const end = live?.endAt ? formatTime(live.endAt) : slot.end;
  return <section className="appointment-summary" aria-label="Resumo da escolha" aria-busy={record?.phase === 'processing'}><h3 className="visually-hidden">O teu treino</h3>
    <p><strong>{dateLabel(query.date)} · {slot.start}–{end}</strong></p>
    <details><summary>Detalhes do treino</summary><p>{selection.plan.productName} · {selection.kind === 'DUO' ? 'Duo' : 'Individual'}</p><p>{service.name} · {location.name} · {resource.name}</p><p>Duração: {service.durationMinutes} min</p></details>
    {!record && <small className="secondary">{valid ? 'A cobertura é validada na confirmação.' : 'Não é possível confirmar esta escolha. Contacta o Leandro.'}</small>}
    {record?.phase === 'processing' && <span className="visually-hidden" role="status">A confirmar o treino…</span>}
    {record?.message && <p role={['confirmed', 'pending-booking'].includes(record.phase) ? 'status' : 'alert'}>{record.message}</p>}
    {['confirmed', 'pending-booking'].includes(record?.phase) && <a className="text-button" href="#proximos-treinos">Ver os meus treinos</a>}
    <div className="appointment-confirm-action"><button type="button" className="btn btn--solid" disabled={commands.busy.current || terminal || (!valid && record?.phase !== 'uncertain')} onClick={async () => {
      const outcome = await commands.submit(input, timezone);
      if (outcome?.phase === 'conflict') onConflict();
    }}>{label}</button></div>
  </section>;
}
function SlotsForDate({ api, query, selection, service, location, resource, timezone }) {
  const [slot, setSlot] = useState(null);
  const [notice, setNotice] = useState('');
  const active = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const state = useRead(JSON.stringify(query), async signal => {
    const result = await api.availability(query, signal);
    if (result.date !== query.date || result.timezone !== timezone || !Array.isArray(result.slots)
      || (Number.isInteger(service.durationMinutes) && result.durationMinutes !== service.durationMinutes)) throw new Error('Invalid availability');
    return result.slots.filter(item => item.resourceIds?.includes(resource.id));
  });
  return <>{notice && <p role="alert">{notice}</p>}<Read state={state}>{state.data && <><TimeSlots slots={state.data} selected={slot} onSelect={value => { setSlot(value); setNotice(''); }} />{slot && <BookingSummary selection={selection} service={service} location={location} resource={resource} query={query} slot={slot} timezone={timezone} onConflict={() => {
    if (!active.current) return;
    setNotice('Este horário já não está disponível. Escolhe outro.'); setSlot(null); state.retry();
  }} />}</>}</Read></>;
}
function Dates({ api, selection, service, location, resource }) {
  const [date, setDate] = useState('');
  // The public catalog omits timezone. Discover it from a real availability
  // read before presenting any dates; the UTC probe is not a selected day.
  const [probeDate] = useState(() => new Date().toISOString().slice(0, 10));
  const params = { serviceIds: service.id, locationId: location.id, resourceId: resource.id };
  const state = useRead('timezone', async signal => {
    const result = await api.availability({ ...params, date: probeDate }, signal);
    if (!result.timezone) throw new Error('Missing timezone');
    new Intl.DateTimeFormat('pt-PT', { timeZone: result.timezone }).format();
    return result.timezone;
  });
  return <Read state={state}>{state.data && <><AppointmentCalendar timezone={state.data} selected={date} onSelect={setDate} />
    {date && <SlotsForDate key={date} api={api} query={{ ...params, date }} selection={selection} service={service} location={location} resource={resource} timezone={state.data} />}
  </>}</Read>;
}
function Professionals({ api, selection, service, location }) {
  const [id, setId] = useState('');
  const state = useRead(`${service.id}:${location.id}`, async signal => {
    const result = await api.resources({ serviceIds: service.id, locationId: location.id }, signal);
    if (!Array.isArray(result.resources)) throw new Error('Invalid resources');
    return result.resources.filter(resource => resource.type === 'PERSON');
  });
  const resource = resolveChoice(state.data || [], id);
  return <Read state={state}>{state.data && (state.data.length ? <><Choice label="Profissional" items={state.data} value={id} onChange={setId} />
    {resource && <React.Fragment key={resource.id}><p className="appointment-context">{service.name} · {location.name} · {resource.name}</p><Dates key={resource.id} api={api} selection={selection} service={service} location={location} resource={resource} /></React.Fragment>}</> : <p role="status">Sem profissionais disponíveis para este serviço e local.</p>)}</Read>;
}
function Locations({ api, selection, service, locations, resources }) {
  const [id, setId] = useState('');
  const valid = locations.filter(location => resources.some(resource => resource.services?.some(item => item.id === service.id) && resource.locations?.some(item => item.id === location.id)));
  const location = resolveChoice(valid, id);
  if (!valid.length) return <p role="status">Sem localizações disponíveis para este serviço.</p>;
  return <><Choice label="Localização" items={valid} value={id} onChange={setId} />{location && <Professionals key={location.id} api={api} selection={selection} service={service} location={location} />}</>;
}
export function BookingWizard({ client, selection, commands: sharedCommands }) {
  const ownCommands = useBookingCommands(client);
  const commands = sharedCommands || ownCommands;
  const api = useMemo(() => publicBookingApi(client.config), [client]);
  const [id, setId] = useState('');
  const state = useRead('catalog', async signal => {
    const [catalog, locations, resources] = await Promise.all([client.getPublicServices(signal), api.locations(signal), api.resources({}, signal)]);
    if (!Array.isArray(catalog.services) || !Array.isArray(locations.locations) || !Array.isArray(resources.resources)) throw new Error('Invalid catalog');
    const personalServices = selection.kind === 'INDIVIDUAL' && Array.isArray(selection.plan.eligibleServices) ? new Set(selection.plan.eligibleServices.map(service => service.id)) : null;
    const people = resources.resources.filter(resource => resource.type === 'PERSON');
    const services = catalog.services.filter(service => service.schedulingMode === 'APPOINTMENT'
      && (!personalServices || personalServices.has(service.id))
      && people.some(person => person.services?.some(item => item.id === service.id)
        && person.locations?.some(item => locations.locations.some(location => location.id === item.id))));
    return { services, locations: locations.locations, resources: people };
  });
  const service = resolveChoice(state.data?.services || [], id);
  return <BookingContext.Provider value={commands}><fieldset className="booking-controls" disabled={commands.busy.current}><section className="account-section appointment-planner" aria-labelledby="appointment-title"><h2 id="appointment-title" className="visually-hidden">Consultar horários</h2>
    <Read state={state}>{state.data && (state.data.services.length ? <><Choice label="Serviço" items={state.data.services} value={id} onChange={setId} />
      {service && <Locations key={service.id} api={api} selection={selection} service={service} locations={state.data.locations} resources={state.data.resources} />}</> : <p role="status">Sem serviços APPOINTMENT disponíveis para consultar com esta cobertura.</p>)}</Read>
  </section></fieldset></BookingContext.Provider>;
}
function Planner({ client }) {
  const commands = useBookingCommands(client);
  const [selection, setSelection] = useState(null);
  const available = useCallback(plans => setSelection(current => {
    if (!plans) return commands.attempted.current ? current : null;
    const active = plans.filter(item => item.plan.status === 'ACTIVE');
    const existing = active.find(item => item.kind === current?.kind && item.duoId === current?.duoId && item.customerEntitlementId === current?.customerEntitlementId);
    return existing || (commands.attempted.current && current ? current : active.length === 1 ? active[0] : null);
  }), []);
  return <section id="marcar-treino" tabIndex={-1} className="booking-priority" aria-labelledby="booking-priority-title"><h1 id="booking-priority-title">Marcar treino</h1>
    <p className="booking-steps" aria-label="Etapas da marcação">Plano <span aria-hidden="true">→</span> Data <span aria-hidden="true">→</span> Horário <span aria-hidden="true">→</span> Confirmar</p>
    <fieldset className="booking-controls" disabled={commands.busy.current}><MyPlans compact onAvailable={available} selected={selection} onSelect={(reference, plan) => setSelection({ ...reference, plan })} /></fieldset>
    {selection && <BookingWizard key={`${selection.kind}:${selection.duoId || ''}:${selection.customerEntitlementId}`} client={client} selection={selection} commands={commands} />}</section>;
}
export function AppointmentPlanner() {
  const client = useMaveraClient();
  const { session } = useMaveraAuth();
  return <Planner key={`${client.config.apiBaseUrl}:${client.config.tenantSlug}:${client.config.tenantId}:${session?.user.id}:${session?.access_token}`} client={client} />;
}
