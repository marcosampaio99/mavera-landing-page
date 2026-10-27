// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMaveraClient } from '@marcosampaio99/mavera-client';
import { MaveraProvider } from '@marcosampaio99/mavera-client/react';
import { AppointmentPlanner } from './AppointmentPlanner';
import { bookingFailure, confirmationAllowed } from './bookingCommands';
import { dateLabel, dateInZone } from './AppointmentCalendar';

const tenant = '11111111-1111-4111-8111-111111111111';
const otherTenant = '99999999-9999-4999-8999-999999999999';
const serviceId = '22222222-2222-4222-8222-222222222222';
const locationId = '33333333-3333-4333-8333-333333333333';
const resourceId = '44444444-4444-4444-8444-444444444444';
const entitlementId = '55555555-5555-4555-8555-555555555555';
const duoId = '66666666-6666-4666-8666-666666666666';
const bookingId = '77777777-7777-4777-8777-777777777777';
const service = { id: serviceId, name: 'Aula PT', schedulingMode: 'APPOINTMENT', durationMinutes: 60, bookingAccessPolicy: 'ENTITLEMENT_REQUIRED', paymentCollectionMode: 'ONSITE' };
let isDuo, post, fetcher, live, rows, remaining, serviceData, unavailable, detail;
const clients = [];
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
function plan() { return { id: entitlementId, productName: isDuo ? 'Plano Duo' : 'Plano Individual', status: 'ACTIVE', coverageKind: isDuo ? 'DUO' : 'INDIVIDUAL', duoId: isDuo ? duoId : null, eligibleServices: [{ id: serviceId }], usageModel: 'PER_PERIOD', timezone: 'Europe/Lisbon', startsAt: '2026-10-01T00:00:00Z', expiresAt: '2026-11-01T00:00:00Z', currentPeriod: { periodStart: '2026-10-18T23:00:00Z', periodEnd: '2026-10-26T00:00:00Z', allowance: 2, remaining } }; }
function booking(input, status = 'CONFIRMED') {
  const offset = input.date === '2026-10-24' ? 1 : 0;
  const hour = Number(input.start.slice(0, 2)) - offset;
  const startAt = `${input.date}T${String(hour).padStart(2, '0')}:${input.start.slice(3)}:00Z`;
  return { id: bookingId, status, startAt, endAt: new Date(Date.parse(startAt) + 3600000).toISOString(), location: { id: locationId, name: 'Estúdio' }, resource: { id: resourceId, name: 'Leandro', type: 'PERSON' }, services: [{ id: serviceId, name: 'Aula PT', durationMinutes: 60 }], ...(input.duoId ? { duo: { id: input.duoId } } : {}) };
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-24T08:00:00Z'));
  isDuo = false; live = null; rows = []; remaining = 2; unavailable = false; serviceData = service;
  detail = vi.fn(async () => json(live));
  post = vi.fn(async input => { live = booking(input); rows = [live]; remaining = 1; return json(live, 201); });
  fetcher = vi.fn(async (url, options) => {
    const parsed = new URL(url), path = parsed.pathname;
    if (path.endsWith('/auth/me')) return json({ memberships: [], customerProfileInTenants: [] });
    if (path.endsWith('/bookings') && options.method === 'POST') return post(JSON.parse(options.body), options);
    if (path.endsWith(`/bookings/${bookingId}`)) return detail();
    if (path.endsWith('/bookings')) return json(rows);
    if (path.endsWith(`/duos/${duoId}/entitlements`)) return json([plan()]);
    if (path.endsWith('/duos')) return json(isDuo ? [{ id: duoId, status: 'ACTIVE' }] : []);
    if (path.endsWith('/entitlements')) return json(isDuo ? [] : [plan()]);
    if (path.endsWith('/services')) return json({ services: [serviceData] });
    if (path.endsWith('/locations')) return json({ locations: [{ id: locationId, name: 'Estúdio' }] });
    if (path.endsWith('/resources')) return json({ resources: [{ id: resourceId, name: 'Leandro', type: 'PERSON', locations: [{ id: locationId }], services: [{ id: serviceId }] }] });
    if (path.endsWith('/availability')) return json({ date: parsed.searchParams.get('date'), timezone: 'Europe/Lisbon', durationMinutes: 60, slots: unavailable ? [] : [{ start: '10:00', end: '11:00', resourceIds: [resourceId] }] });
    throw Error(`Unexpected request ${options.method} ${path}`);
  });
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.dispose()); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function setup(tenantId = tenant) {
  let listener, session = { access_token: 'token-a', user: { id: 'user-a' } };
  const auth = { getSession: vi.fn(async () => ({ data: { session }, error: null })), onAuthStateChange: callback => { listener = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; } };
  const client = createMaveraClient({ tenantId, tenantSlug: 'leandro-faria', apiBaseUrl: 'https://api.test/api/v1', supabaseUrl: 'https://auth.test', supabasePublishableKey: 'sb_publishable_test' }, { auth, fetch: fetcher });
  clients.push(client); await client.initialize();
  return { client, changeSession: next => { session = next; listener('SIGNED_IN', next); } };
}
async function mount() {
  const value = await setup();
  return { ...value, view: render(<MaveraProvider client={value.client}><AppointmentPlanner /></MaveraProvider>) };
}
async function choose() {
  await screen.findByRole('button', { name: dateLabel(dateInZone(Date.now(), 'Europe/Lisbon')) });
  if (!document.querySelector('.calendar-days button[aria-pressed="true"]')) fireEvent.click(screen.getByRole('button', { name: dateLabel(dateInZone(Date.now(), 'Europe/Lisbon')) }));
  fireEvent.click(await screen.findByRole('button', { name: '10:00' }));
}
function confirm() { fireEvent.click(screen.getByRole('button', { name: 'Confirmar treino' })); }
it('cria Individual com o entitlement explícito e atualiza agenda e saldo pelo SDK', async () => {
  const { client } = await mount(); await choose();
  expect(screen.getByRole('region', { name: 'Resumo da escolha' }).textContent).toContain('10:00–11:00');
  expect(screen.getByRole('button', { name: 'Confirmar treino' }).disabled).toBe(false); confirm();
  await screen.findByText('Treino confirmado.');
  expect(post).toHaveBeenCalledOnce();
  expect(post.mock.calls[0][0]).toEqual({ locationId, resourceId, serviceIds: [serviceId], date: '2026-10-24', start: '10:00', customerEntitlementId: entitlementId });
  expect(client.bookings.getSnapshot().data[0].id).toBe(bookingId);
  expect(client.entitlements.getSnapshot().data[0].currentPeriod.remaining).toBe(1);
  expect(screen.getByRole('button', { name: 'Treino confirmado' }).disabled).toBe(true);
  expect(screen.getByRole('link', { name: 'Ver os meus treinos' }).getAttribute('href')).toBe('#proximos-treinos');
});
it('cria Duo com UUID estável e uma só cobertura partilhada, atualizando a leitura SDK', async () => {
  isDuo = true; await mount(); await choose(); confirm(); await screen.findByText('Treino confirmado.');
  expect(post.mock.calls[0][0]).toMatchObject({ duoId, customerEntitlementId: entitlementId, requestId: expect.stringMatching(/^[\da-f-]{36}$/) });
  await screen.findByText('1 treino disponível esta semana');
  expect(fetcher.mock.calls.filter(([url]) => url.endsWith(`/duos/${duoId}/entitlements`)).length).toBeGreaterThan(1);
});
it('bloqueia concorrência e duplo clique antes de qualquer resultado', async () => {
  let resolve; post.mockImplementation(input => new Promise(done => { resolve = () => { live = booking(input); rows = [live]; done(json(live, 201)); }; }));
  await mount(); await choose(); confirm();
  fireEvent.click(screen.getByRole('button', { name: 'A confirmar…' }));
  await waitFor(() => expect(post).toHaveBeenCalledOnce());
  expect(screen.getByRole('button', { name: 'A confirmar…' }).disabled).toBe(true);
  expect(screen.queryByText('Treino confirmado.')).toBeNull();
  await act(async () => resolve()); await screen.findByText('Treino confirmado.'); expect(post).toHaveBeenCalledOnce();
});
it('repete um Duo após rede incerta com o mesmo UUID e comando, mesmo após mudar de dia e voltar', async () => {
  isDuo = true; post.mockRejectedValueOnce(new TypeError('network'));
  await mount(); await choose(); confirm(); await screen.findByRole('button', { name: 'Tentar novamente' });
  const first = post.mock.calls[0][0];
  fireEvent.click(screen.getByRole('button', { name: dateLabel('2026-10-25') })); await choose();
  fireEvent.click(screen.getByRole('button', { name: dateLabel('2026-10-24') })); await choose();
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('Treino confirmado.');
  expect(post).toHaveBeenCalledTimes(2); expect(post.mock.calls[1][0]).toEqual(first);
});
it('reconcilia Individual após resposta perdida sem repetir o POST', async () => {
  post.mockImplementationOnce(async input => { live = booking(input); rows = [live]; throw new TypeError('Response lost'); });
  await mount(); await choose(); confirm(); await screen.findByRole('button', { name: 'Verificar reserva' });
  fireEvent.click(screen.getByRole('button', { name: 'Verificar reserva' })); await screen.findByText('Treino confirmado.'); expect(post).toHaveBeenCalledOnce();
});
it('não repete Individual quando uma leitura vazia não prova que o pedido anterior falhou', async () => {
  post.mockRejectedValueOnce(new TypeError('network'));
  await mount(); await choose(); confirm(); await screen.findByRole('button', { name: 'Verificar reserva' });
  fireEvent.click(screen.getByRole('button', { name: 'Verificar reserva' })); await screen.findByText(/O resultado continua por confirmar/); expect(post).toHaveBeenCalledOnce();
});
it.each(['BOOKING_ENTITLEMENT_USAGE_EXHAUSTED', 'BOOKING_ENTITLEMENT_NOT_AVAILABLE', 'BOOKING_ENTITLEMENT_REQUIRED'])('trata %s sem criar uma reserva', async code => {
  post.mockResolvedValueOnce(json({ code, message: 'internal' }, 403)); await mount(); await choose(); confirm();
  const alert = await screen.findByRole('alert'); expect(alert.textContent).not.toContain('internal'); expect(alert.textContent).toMatch(/quota|plano/);
  expect(screen.queryByText('Treino confirmado.')).toBeNull(); expect(post).toHaveBeenCalledOnce();
});
it('atualiza disponibilidade após conflito e exige nova escolha', async () => {
  post.mockImplementationOnce(async () => { unavailable = true; return json({ message: 'Selected time is blocked: private reason' }, 409); });
  await mount(); await choose(); confirm(); await screen.findByText('Este horário já não está disponível. Escolhe outro.');
  await screen.findByText('Sem horários disponíveis neste dia. Escolhe outra data.');
  expect(screen.queryByRole('button', { name: 'Confirmar treino' })).toBeNull(); expect(post).toHaveBeenCalledOnce();
});
it('PENDING não é apresentado como confirmado nem permite nova submissão', async () => {
  post.mockImplementation(async input => { live = booking(input, 'PENDING'); return json(live, 201); });
  await mount(); await choose(); confirm(); await screen.findByText('Reserva pendente de confirmação. Não voltes a submeter.');
  expect(screen.queryByText('Treino confirmado.')).toBeNull(); expect(screen.getByRole('button', { name: 'Reserva pendente' }).disabled).toBe(true);
});
it('verifica o estado vivo de um recibo Duo repetido que entretanto foi cancelado', async () => {
  isDuo = true; post.mockRejectedValueOnce(new TypeError('lost response'));
  detail.mockImplementation(async () => json({ ...live, status: 'CANCELLED' }));
  await mount(); await choose(); confirm(); await screen.findByRole('button', { name: 'Tentar novamente' });
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' })); await screen.findByText('Esta reserva já não está ativa. Consulta os teus treinos.');
  expect(screen.queryByText('Treino confirmado.')).toBeNull();
});
it('uma falha no GET posterior à criação repete apenas a verificação do recibo', async () => {
  detail.mockRejectedValueOnce(new TypeError('offline'));
  await mount(); await choose(); confirm(); await screen.findByRole('button', { name: 'Verificar reserva' });
  fireEvent.click(screen.getByRole('button', { name: 'Verificar reserva' })); await screen.findByText('Treino confirmado.'); expect(post).toHaveBeenCalledOnce();
});
it('ignora uma criação tardia depois de mudar de sessão e não publica saldo na sessão nova', async () => {
  let resolve;
  post.mockImplementation(input => new Promise(done => { resolve = () => done(json(booking(input), 201)); }));
  const { changeSession } = await mount(); await choose(); confirm(); await waitFor(() => expect(resolve).toBeTypeOf('function'));
  act(() => changeSession({ access_token: 'token-b', user: { id: 'user-b' } }));
  await act(async () => resolve()); await screen.findByRole('button', { name: dateLabel('2026-10-24') });
  expect(screen.queryByText('Treino confirmado.')).toBeNull(); expect(detail).not.toHaveBeenCalled();
});
it('aborta antes do transporte se a sessão muda imediatamente após o clique', async () => {
  const { changeSession } = await mount(); await choose();
  act(() => { confirm(); changeSession({ access_token: 'token-b', user: { id: 'user-b' } }); });
  await act(async () => {}); expect(post).not.toHaveBeenCalled();
});
it('não transporta uma confirmação para outro tenant', async () => {
  let resolve; post.mockImplementation(input => new Promise(done => { resolve = () => done(json(booking(input), 201)); }));
  const { view } = await mount(); await choose(); confirm(); await waitFor(() => expect(resolve).toBeTypeOf('function'));
  const next = await setup(otherTenant); view.rerender(<MaveraProvider client={next.client}><AppointmentPlanner /></MaveraProvider>);
  await act(async () => resolve()); await screen.findByRole('button', { name: dateLabel('2026-10-24') });
  expect(screen.queryByText('Treino confirmado.')).toBeNull();
  expect(fetcher.mock.calls.filter(([url, options]) => options.method === 'POST' && url.includes(otherTenant))).toHaveLength(0);
});
it('401 invalida a sessão pelo SDK e nunca mostra sucesso', async () => {
  post.mockResolvedValueOnce(json({ code: 'INVALID_TOKEN' }, 401));
  const { client } = await mount(); await choose(); confirm();
  await waitFor(() => expect(client.getAuthSnapshot().session).toBeNull());
  expect(screen.queryByText('Treino confirmado.')).toBeNull();
  expect(bookingFailure({ status: 401 }).message).toContain('sessão expirou');
  expect(screen.queryByRole('link', { name: 'Ver os meus treinos' })).toBeNull();
});
it.each(['2026-10-24', '2026-10-25'])('envia a data e hora locais sem conversão UTC em %s (mudança de hora)', async date => {
  await mount(); fireEvent.click(await screen.findByRole('button', { name: dateLabel(date) })); await choose(); confirm(); await screen.findByText('Treino confirmado.');
  expect(post.mock.calls[0][0]).toMatchObject({ date, start: '10:00' });
  expect(screen.getByRole('region', { name: 'Resumo da escolha' }).textContent).toContain('10:00–11:00');
});
it('não ativa serviços com cobrança online, PUBLIC ou dados de cobertura incoerentes', () => {
  const selected = { kind: 'INDIVIDUAL', customerEntitlementId: entitlementId, plan: plan() };
  const query = { date: '2026-10-25', locationId, resourceId };
  const slot = { start: '10:00', end: '11:00', resourceIds: [resourceId] };
  expect(confirmationAllowed(selected, { ...service, paymentCollectionMode: 'ONLINE_FULL' }, query, slot, 'Europe/Lisbon')).toBe(false);
  expect(confirmationAllowed(selected, { ...service, bookingAccessPolicy: 'PUBLIC' }, query, slot, 'Europe/Lisbon')).toBe(false);
  expect(confirmationAllowed({ ...selected, kind: 'DUO', duoId }, service, query, slot, 'Europe/Lisbon')).toBe(false);
});
it('não regenera UUID após DUO_BOOKING_REQUEST_ID_REUSED nem faz fallback Individual', async () => {
  isDuo = true; post.mockResolvedValueOnce(json({ code: 'DUO_BOOKING_REQUEST_ID_REUSED' }, 409));
  await mount(); await choose(); confirm(); await screen.findByText(/Este pedido já foi utilizado/); expect(post).toHaveBeenCalledOnce();
  expect(screen.queryByRole('button', { name: 'Tentar novamente' })).toBeNull();
});
it('uma falha de atualização das caches não repete uma reserva já confirmada', async () => {
  const original = fetcher.getMockImplementation();
  fetcher.mockImplementation((url, options) => live && options.method === 'GET' && (url.endsWith('/bookings') || url.endsWith('/entitlements')) ? Promise.resolve(json({}, 500)) : original(url, options));
  await mount(); await choose(); confirm();
  await screen.findByText(/Treino confirmado. Não foi possível atualizar/);
  expect(screen.getByRole('button', { name: 'Treino confirmado' }).disabled).toBe(true); expect(post).toHaveBeenCalledOnce();
});
it('conserva as horas locais da API na hora repetida do fim de DST, sem inferir duração pelo relógio', () => {
  const selected = { kind: 'INDIVIDUAL', customerEntitlementId: entitlementId, plan: plan() };
  expect(confirmationAllowed(selected, service, { date: '2026-10-25', locationId, resourceId }, { start: '01:30', end: '01:30', resourceIds: [resourceId] }, 'Europe/Lisbon')).toBe(true);
});
it('recusa uma cobertura individual explicitamente incompatível com o serviço', () => {
  expect(confirmationAllowed({ kind: 'INDIVIDUAL', customerEntitlementId: entitlementId, plan: { ...plan(), eligibleServices: [] } }, service, { date: '2026-10-25', locationId, resourceId }, { start: '10:00', end: '11:00', resourceIds: [resourceId] }, 'Europe/Lisbon')).toBe(false);
});
