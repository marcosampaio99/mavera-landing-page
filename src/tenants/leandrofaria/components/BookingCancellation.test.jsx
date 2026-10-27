// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMaveraClient } from '@marcosampaio99/mavera-client';
import { MaveraProvider } from '@marcosampaio99/mavera-client/react';
import { AccountDashboard } from './AccountDashboard';
import { cancellationFailure, useBookingCancellation } from './bookingCancellation';

const tenant = '11111111-1111-4111-8111-111111111111';
const bookingId = '77777777-7777-4777-8777-777777777777';
const duoId = '66666666-6666-4666-8666-666666666666';
const customer = { id: 'customer-a', name: 'Marco Sampaio' };
let rows, cancel, detail, fetcher;
const clients = [];
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
function booking({ status = 'CONFIRMED', canCancel = true, duo = false } = {}) {
  return { id: bookingId, status, startAt: '2026-10-26T10:00:00Z', endAt: '2026-10-26T11:00:00Z', notes: null, createdAt: '2026-10-20T10:00:00Z',
    location: { id: 'l', name: 'Estúdio' }, resource: { id: 'r', name: 'Leandro', type: 'PERSON' }, session: null,
    services: [{ id: 's', name: duo ? 'Treino Duo' : 'Treino individual', durationMinutes: 60, priceCents: null }],
    funding: { type: 'PLAN', customerPlanId: 'p', planName: 'Plano' },
    cancellationPolicy: { noticeMinutes: 1440, cancellationDeadline: '2026-10-25T10:00:00Z', canCancel },
    ...(duo ? { duo: { id: duoId, participants: [{ name: 'Marco Sampaio' }, { name: 'Ana Costa' }] } } : {}) };
}
const calls = (method, suffix) => fetcher.mock.calls.filter(([url, options]) => (options.method || 'GET') === method && new URL(url).pathname.endsWith(suffix));
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-24T08:00:00Z'));
  rows = [booking()];
  cancel = vi.fn(async () => { rows = rows.map(row => ({ ...row, status: 'CANCELLED', cancellationPolicy: { ...row.cancellationPolicy, canCancel: false } })); return json(rows[0]); });
  detail = vi.fn(async () => json(rows[0]));
  fetcher = vi.fn(async (url, options) => {
    const path = new URL(url).pathname;
    if (path.endsWith('/auth/me')) return json({ memberships: [], customerProfileInTenants: [] });
    if (path.endsWith(`/bookings/${bookingId}/cancel`) && options.method === 'POST') return cancel(options);
    if (path.endsWith(`/bookings/${bookingId}`)) return detail();
    if (path.endsWith('/bookings')) return json(rows);
    if (path.endsWith('/entitlements') || path.endsWith('/duos')) return json([]);
    throw Error(`Unexpected request ${options.method} ${path}`);
  });
  vi.stubGlobal('fetch', fetcher);
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.dispose()); vi.useRealTimers(); vi.unstubAllGlobals(); });
async function mount() {
  const session = { access_token: 'token-a', user: { id: 'user-a' } };
  const auth = { getSession: vi.fn(async () => ({ data: { session }, error: null })), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) };
  const client = createMaveraClient({ tenantId: tenant, tenantSlug: 'leandro-faria', apiBaseUrl: 'https://api.test/api/v1', supabaseUrl: 'https://auth.test', supabasePublishableKey: 'sb_publishable_test' }, { auth, fetch: fetcher });
  clients.push(client); await client.initialize();
  render(<MaveraProvider client={client}><AccountDashboard customer={customer} /></MaveraProvider>);
  return client;
}
const upcoming = () => screen.getByRole('region', { name: 'Próximos treinos' });
async function ask() { fireEvent.click(await screen.findByRole('button', { name: 'Cancelar treino' })); }
const confirm = () => fireEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }));

it('mostra o prazo e pede confirmação inline antes de cancelar um treino individual', async () => {
  await mount(); await ask();
  expect(within(upcoming()).getByText(/Podes cancelar até/).querySelector('time').getAttribute('dateTime')).toBe('2026-10-25T10:00:00Z');
  expect(screen.getByRole('group', { name: /Cancelar o treino de/ })).toBeTruthy();
  expect(screen.queryByText(/dois participantes/)).toBeNull();
  expect(cancel).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Manter treino' }));
  expect(screen.queryByRole('group', { name: /Cancelar o treino de/ })).toBeNull();
  await waitFor(() => expect(document.activeElement.textContent).toBe('Cancelar treino'));
  expect(cancel).not.toHaveBeenCalled();
});
it('cancela pelo SDK, atualiza agenda e saldo e mantém o treino no histórico', async () => {
  await mount(); await ask();
  const entitlementReads = calls('GET', '/entitlements').length;
  confirm();
  const notice = await screen.findByText(/cancelado\.$/);
  expect(notice.getAttribute('role')).toBe('status');
  await waitFor(() => expect(document.activeElement).toBe(notice));
  expect(cancel).toHaveBeenCalledOnce();
  expect(calls('GET', '/entitlements').length).toBeGreaterThan(entitlementReads);
  await waitFor(() => expect(within(upcoming()).queryByText('Treino individual')).toBeNull());
  expect(within(upcoming()).getByText('Sem treino marcado')).toBeTruthy();
  const history = document.querySelector('.account-secondary');
  expect(within(history).getByText('Treino individual')).toBeTruthy();
  expect(within(history).getByText('Estúdio · Cancelado')).toBeTruthy();
});
it('Duo identifica o parceiro e avisa que o cancelamento afeta ambos', async () => {
  rows = [booking({ duo: true })];
  await mount();
  expect(await within(upcoming()).findByText('Duo com Ana Costa')).toBeTruthy();
  await ask();
  expect(screen.getByText('Treino Duo: o cancelamento aplica-se aos dois participantes, incluindo Ana Costa.')).toBeTruthy();
  confirm(); await screen.findByText(/cancelado\.$/);
  expect(cancel).toHaveBeenCalledOnce();
  expect(calls('POST', '/cancel')[0][1].body).toBe('{}');
});
it('não oferece cancelamento quando canCancel é falso e mostra contacto', async () => {
  rows = [booking({ canCancel: false })];
  await mount();
  expect(await within(upcoming()).findByText('Prazo de cancelamento online terminado. Contacta o Leandro.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Cancelar treino' })).toBeNull();
});
it('prazo ultrapassado no backend não repete e recarrega a agenda', async () => {
  cancel.mockImplementationOnce(async () => { rows = [booking({ canCancel: false })]; return json({ code: 'CUSTOMER_CANCELLATION_WINDOW_CLOSED', message: 'closed' }, 409); });
  await mount(); await ask();
  const reads = calls('GET', '/bookings').length;
  confirm();
  expect(await screen.findByText('O prazo para cancelar online terminou. Contacta o Leandro.')).toBeTruthy();
  expect(calls('GET', '/bookings').length).toBeGreaterThan(reads);
  expect(screen.queryByRole('button', { name: /Cancelar treino|Confirmar cancelamento/ })).toBeNull();
  expect(screen.queryByText(/cancelado\.$/)).toBeNull();
  expect(cancel).toHaveBeenCalledOnce();
});
it('resultado incerto exige verificar a reserva antes de permitir repetir', async () => {
  cancel.mockRejectedValueOnce(new TypeError('Failed to fetch'));
  await mount(); await ask(); confirm();
  expect(await screen.findByText(/Não foi possível confirmar o cancelamento/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Cancelar treino|Confirmar cancelamento/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Verificar reserva' }));
  expect(await screen.findByText('O treino continua marcado. Podes tentar cancelar de novo.')).toBeTruthy();
  expect(detail).toHaveBeenCalledOnce();
  expect(cancel).toHaveBeenCalledOnce();
  await ask(); confirm();
  await screen.findByText(/cancelado\.$/);
  expect(cancel).toHaveBeenCalledTimes(2);
});
it('resultado incerto já aplicado é confirmado pela leitura, sem segundo cancelamento', async () => {
  cancel.mockImplementationOnce(async () => { rows = [booking({ status: 'CANCELLED', canCancel: false })]; throw new TypeError('Failed to fetch'); });
  await mount(); await ask(); confirm();
  fireEvent.click(await screen.findByRole('button', { name: 'Verificar reserva' }));
  expect(await screen.findByText(/cancelado\.$/)).toBeTruthy();
  expect(cancel).toHaveBeenCalledOnce();
});
it('bloqueia duplo clique e submissões concorrentes', async () => {
  let release;
  cancel.mockImplementationOnce(() => new Promise(resolve => { release = resolve; }));
  await mount(); await ask();
  const button = screen.getByRole('button', { name: 'Confirmar cancelamento' });
  fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(cancel).toHaveBeenCalledOnce());
  expect(screen.getByText('A cancelar…')).toBeTruthy();
  rows = [{ ...rows[0], status: 'CANCELLED' }];
  await act(async () => release(json(rows[0])));
  await screen.findByText(/cancelado\.$/);
  expect(cancel).toHaveBeenCalledOnce();
});
it('o comando ignora pedidos concorrentes mesmo fora da interface', async () => {
  let release, commands;
  const client = { config: { tenantId: tenant }, getAuthSnapshot: () => ({ session: { access_token: 't', user: { id: 'u' } } }),
    cancelBooking: vi.fn(() => new Promise(resolve => { release = resolve; })), refreshBookings: vi.fn(async () => []), refreshCustomerEntitlements: vi.fn(async () => []) };
  function Probe() { commands = useBookingCancellation(client); return null; }
  render(<Probe />);
  let first;
  act(() => { first = commands.cancel(bookingId); commands.cancel(bookingId); commands.verify(bookingId); });
  expect(client.cancelBooking).toHaveBeenCalledOnce();
  await act(async () => { release({ id: bookingId, status: 'CANCELLED' }); await first; });
  expect(commands.get(bookingId).phase).toBe('cancelled');
  expect(client.refreshCustomerEntitlements).toHaveBeenCalledOnce();
});
it('401 invalida a sessão pelo SDK e nunca mostra o cancelamento como feito', async () => {
  cancel.mockResolvedValueOnce(json({ code: 'INVALID_TOKEN' }, 401));
  const client = await mount(); await ask(); confirm();
  await waitFor(() => expect(client.getAuthSnapshot().session).toBeNull());
  expect(screen.queryByText(/cancelado\.$/)).toBeNull();
  expect(cancellationFailure({ status: 401 })).toMatchObject({ phase: 'expired', message: 'A sessão expirou. Volta a entrar para continuar.' });
});
it('classifica erros sem inventar sucesso', () => {
  expect(cancellationFailure({ kind: 'cancellation-policy', code: 'CUSTOMER_CANCELLATION_WINDOW_CLOSED', status: 409 }).phase).toBe('closed');
  expect(cancellationFailure({ kind: 'not-found', status: 404 }).phase).toBe('closed');
  expect(cancellationFailure({ kind: 'network' }).phase).toBe('uncertain');
  expect(cancellationFailure({ kind: 'server', status: 503 }).phase).toBe('uncertain');
  expect(cancellationFailure({ kind: 'conflict', status: 409 }).phase).toBe('uncertain');
});
