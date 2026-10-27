// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMaveraClient } from '@marcosampaio99/mavera-client';
import { MaveraProvider } from '@marcosampaio99/mavera-client/react';
import { MyPlans, PlanCard } from './MyPlans';

const tenantA = '11111111-1111-4111-8111-111111111111';
const tenantB = '22222222-2222-4222-8222-222222222222';
const now = Date.parse('2026-10-23T12:00:00Z');
const period = { periodStart: '2026-10-18T23:00:00Z', periodEnd: '2026-10-26T00:00:00Z', allowance: 3, remaining: 2 };
const individual = { id: 'individual', productName: 'Treino pessoal', coverageKind: 'INDIVIDUAL', status: 'ACTIVE', startsAt: '2026-10-01T00:00:00Z', expiresAt: '2026-11-01T00:00:00Z', timezone: 'Europe/Lisbon', usageModel: 'PER_PERIOD', currentPeriod: period };
const shared = { ...individual, id: 'shared', productName: 'Treino partilhado', coverageKind: 'DUO', duoId: 'duo-a' };
const clients = [];
let entitlements, duos, coverage, fail, transport;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(now);
  entitlements = []; duos = []; coverage = []; fail = false;
  transport = vi.fn(async url => {
    const path = new URL(url).pathname;
    if (path.endsWith('/auth/me')) return json({});
    if (path.endsWith('/duos/duo-a/entitlements')) return json(coverage);
    if (path.endsWith('/duos')) return json(duos);
    if (path.endsWith('/entitlements')) return fail ? json({ code: 'INTERNAL_ERROR', message: 'secret' }, 500) : json(entitlements);
    throw Error(`Unexpected read: ${path}`);
  });
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.dispose()); vi.useRealTimers(); });
async function setup(tenantId = tenantA) {
  let listener;
  let session = { access_token: 'token-a', user: { id: 'user-a' } };
  const auth = {
    getSession: vi.fn(async () => ({ data: { session }, error: null })),
    onAuthStateChange: vi.fn(callback => { listener = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; }),
  };
  const client = createMaveraClient({ tenantId, apiBaseUrl: 'https://api.test/api/v1', supabaseUrl: 'https://auth.test', supabasePublishableKey: 'sb_publishable_test' }, { auth, fetch: transport });
  clients.push(client); await client.initialize();
  return { client, changeSession: value => { session = value; listener('SIGNED_IN', session); } };
}
async function mount() {
  const state = await setup();
  return { ...state, view: render(<MaveraProvider client={state.client}><MyPlans /></MaveraProvider>) };
}
it('consulta apenas leituras autenticadas por tenant e mostra cobertura individual', async () => {
  entitlements = [individual]; await mount();
  expect(await screen.findByText('Treino pessoal')).toBeTruthy();
  expect(screen.getByText('2 de 3 neste período')).toBeTruthy();
  expect(screen.getByText('Período semanal do saldo')).toBeTruthy();
  expect(screen.getByText(/19.*2026.*25.*2026/)).toBeTruthy();
  expect(transport.mock.calls.filter(([url]) => !url.endsWith('/auth/me')).every(([url, options]) => url.includes(`/customer/tenants/${tenantA}/`) && options.method === 'GET' && options.headers.Authorization === 'Bearer token-a')).toBe(true);
});
it('mostra cada cobertura Duo uma vez e nunca como plano individual', async () => {
  entitlements = [individual, shared]; duos = [{ id: 'duo-a', status: 'ACTIVE' }, { id: 'duo-a', status: 'ACTIVE' }, { id: 'archived', status: 'ARCHIVED' }]; coverage = [shared, shared];
  await mount(); await screen.findByText('Treino partilhado');
  expect(screen.getAllByText('Treino partilhado')).toHaveLength(1);
  const personal = screen.getByRole('region', { name: 'Individual' });
  expect(within(personal).queryByText('Treino partilhado')).toBeNull();
  expect(screen.getByText('Duo · Cobertura e saldo partilhados')).toBeTruthy();
  expect(transport.mock.calls.some(([url]) => url.includes('archived/entitlements'))).toBe(false);
  expect(document.body.textContent).not.toContain('duo-a');
});
it('apresenta quota zero apenas no período atual e não soma períodos', async () => {
  entitlements = [
    { ...individual, currentPeriod: { ...period, remaining: 0 } },
    { ...individual, id: 'future', productName: 'Próximo período', startsAt: '2026-11-01T00:00:00Z', expiresAt: '2026-12-01T00:00:00Z', currentPeriod: { ...period, periodStart: '2026-11-02T00:00:00Z', periodEnd: '2026-11-09T00:00:00Z', remaining: 0 } },
  ]; await mount(); await screen.findByText('Próximo período');
  expect(screen.getAllByText('Sem quota neste período')).toHaveLength(1);
  expect(screen.getByText('Por iniciar')).toBeTruthy();
  expect(screen.getByText(/Fora do período atual/)).toBeTruthy();
});
it('distingue ativo, pendente, expirado e cancelado sem inventar saldo', async () => {
  entitlements = [individual, { ...individual, id: 'pending', productName: 'Pendente', status: 'PENDING', currentPeriod: null }, { ...individual, id: 'expired', expiresAt: '2026-10-22T00:00:00Z' }, { ...individual, id: 'cancelled', status: 'CANCELLED', currentPeriod: null }];
  await mount(); await screen.findByText('Ativo');
  expect(screen.getByText('Expirado')).toBeTruthy(); expect(screen.getByText('Cancelado')).toBeTruthy();
  expect(screen.getAllByText('Saldo não disponível')).toHaveLength(2);
  expect(screen.queryByText('Sem quota neste período')).toBeNull();
});
it('não interpreta ausência de saldo como zero ou ilimitado', async () => {
  entitlements = [{ ...individual, currentPeriod: null }]; await mount();
  expect(await screen.findByText('Saldo não disponível')).toBeTruthy();
  expect(screen.queryByText('Ilimitadas')).toBeNull();
});
it('mostra uma única mensagem sem grupos vazios', async () => {
  await mount(); await screen.findByText('Não tens nenhum plano ativo. Contacta o Leandro para mais informações');
  expect(screen.queryByRole('heading', { name: 'Individual' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Duo' })).toBeNull();
});
it('mostra loading e ignora uma resposta antiga após mudança de sessão', async () => {
  let resolve;
  transport.mockImplementation(async (url, options) => {
    if (url.endsWith('/auth/me')) return json({});
    if (url.endsWith('/duos')) return json([]);
    if (options.headers.Authorization === 'Bearer token-a') return new Promise(done => { resolve = done; });
    return json([{ ...individual, productName: 'Plano da nova sessão' }]);
  });
  const { changeSession } = await mount();
  await waitFor(() => expect(resolve).toBeTypeOf('function'));
  expect(screen.getByRole('status', { name: 'Planos individuais' })).toBeTruthy();
  act(() => changeSession({ access_token: 'token-b', user: { id: 'user-b' } }));
  await screen.findByText('Plano da nova sessão');
  await act(async () => resolve(json([{ ...individual, productName: 'Plano antigo' }])));
  expect(screen.queryByText('Plano antigo')).toBeNull();
});
it('limpa planos já carregados ao terminar sessão', async () => {
  entitlements = [individual]; const { changeSession } = await mount(); await screen.findByText('Treino pessoal');
  act(() => changeSession(null)); expect(screen.queryByText('Treino pessoal')).toBeNull();
});
it('não partilha caches ao mudar de tenant', async () => {
  entitlements = [individual]; const { view } = await mount(); await screen.findByText('Treino pessoal');
  entitlements = [{ ...individual, productName: 'Plano do outro tenant' }];
  const next = await setup(tenantB);
  view.rerender(<MaveraProvider client={next.client}><MyPlans /></MaveraProvider>);
  expect(screen.queryByText('Treino pessoal')).toBeNull(); await screen.findByText('Plano do outro tenant');
  expect(transport.mock.calls.some(([url]) => url.includes(`/customer/tenants/${tenantB}/entitlements`))).toBe(true);
});
it('permite repetir um erro sem expor detalhes internos', async () => {
  fail = true; await mount(); expect((await screen.findByRole('alert')).textContent).not.toContain('secret');
  fail = false; entitlements = [individual]; fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByText('Treino pessoal');
});
it('prepara seleção através de referência explícita sem executar mutações', () => {
  const onSelect = vi.fn(); render(<PlanCard plan={shared} kind="DUO" duoId="duo-a" onSelect={onSelect} />);
  fireEvent.click(screen.getByRole('button', { name: 'Selecionar plano' }));
  expect(onSelect).toHaveBeenCalledWith({ kind: 'DUO', customerEntitlementId: 'shared', duoId: 'duo-a' }, shared);
  expect(transport).not.toHaveBeenCalled();
});
it('mantém planos individuais visíveis quando a leitura partilhada falha e permite repetir', async () => {
  entitlements = [individual]; duos = [{ id: 'duo-a', status: 'ACTIVE' }];
  const original = transport.getMockImplementation(); let sharedFailure = true;
  transport.mockImplementation((url, options) => url.endsWith('/duos/duo-a/entitlements') && sharedFailure ? Promise.resolve(json({}, 500)) : original(url, options));
  await mount(); await screen.findByText('Treino pessoal');
  expect((await screen.findByRole('alert')).textContent).toContain('planos partilhados');
  sharedFailure = false; coverage = [shared]; fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByText('Treino partilhado');
});
it('mostra loading da cobertura Duo e ignora o saldo antigo numa nova sessão do mesmo utilizador', async () => {
  let resolve;
  duos = [{ id: 'duo-a', status: 'ACTIVE' }];
  const original = transport.getMockImplementation();
  transport.mockImplementation((url, options) => {
    if (url.endsWith('/duos/duo-a/entitlements')) return options.headers.Authorization === 'Bearer token-a'
      ? new Promise(done => { resolve = done; }) : Promise.resolve(json([{ ...shared, productName: 'Nova cobertura' }]));
    return original(url, options);
  });
  const { changeSession } = await mount();
  await waitFor(() => expect(resolve).toBeTypeOf('function'));
  expect(screen.getByRole('status', { name: 'Planos partilhados' })).toBeTruthy();
  act(() => changeSession({ access_token: 'new-token', user: { id: 'user-a' } }));
  await screen.findByText('Nova cobertura');
  await act(async () => resolve(json([{ ...shared, productName: 'Cobertura antiga' }])));
  expect(screen.queryByText('Cobertura antiga')).toBeNull();
});
it('não apresenta um período mensal como semanal nem saldo zero antigo como quota atual', () => {
  render(<PlanCard plan={{ ...individual, currentPeriod: { ...period, periodStart: '2026-09-01T00:00:00Z', periodEnd: '2026-10-01T00:00:00Z', remaining: 0 } }} kind="INDIVIDUAL" />);
  expect(screen.getByText('Período do saldo')).toBeTruthy();
  expect(screen.queryByText('Período semanal do saldo')).toBeNull();
  expect(screen.queryByText('Sem quota neste período')).toBeNull();
  expect(screen.getByText(/Fora do período atual/)).toBeTruthy();
});
it('só apresenta ilimitado se o modelo o indicar, mesmo sem período', () => {
  render(<PlanCard plan={{ ...individual, usageModel: 'UNLIMITED', currentPeriod: null }} kind="INDIVIDUAL" />);
  expect(screen.getByText('Ilimitadas')).toBeTruthy();
  expect(screen.queryByText('Sem quota neste período')).toBeNull();
});
it('oculta o grupo individual quando existe apenas uma cobertura Duo', async () => {
  duos = [{ id: 'duo-a', status: 'ACTIVE' }]; coverage = [shared];
  await mount(); await screen.findByText('Treino partilhado');
  expect(screen.queryByRole('heading', { name: 'Individual' })).toBeNull();
  expect(screen.queryByText(/Não tens nenhum plano ativo/)).toBeNull();
});
it('um Duo sem cobertura não cria um grupo vazio e mostra o contacto uma única vez', async () => {
  duos = [{ id: 'duo-a', status: 'ACTIVE' }]; coverage = [];
  await mount(); await screen.findByText('Não tens nenhum plano ativo. Contacta o Leandro para mais informações');
  expect(screen.queryByRole('heading', { name: 'Duo' })).toBeNull();
  expect(screen.queryByText('Sem planos associados.')).toBeNull();
});
it('resume a quota semanal legível e mantém as datas exatas em detalhes', async () => {
  const { client } = await setup();
  render(<MaveraProvider client={client}><MyPlans compact selected={{ kind: 'INDIVIDUAL', customerEntitlementId: individual.id, plan: individual }} /></MaveraProvider>);
  expect(screen.getByText('2 treinos disponíveis esta semana')).toBeTruthy();
  const details = document.querySelector('.selected-plan details');
  expect(details.open).toBe(false);
  expect(details.querySelector('.plan-facts').textContent).toContain('Validade');
  expect(details.querySelector('.plan-facts').textContent).toContain('Período semanal do saldo');
});
