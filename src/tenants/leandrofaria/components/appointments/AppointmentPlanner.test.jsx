// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppointmentPlanner, BookingWizard } from './AppointmentPlanner';
import { AppointmentCalendar, dateInZone, dateLabel, TimeSlots } from './AppointmentCalendar';
import { publicBookingApi } from './publicBookingApi';

const mocks = vi.hoisted(() => ({ client: null, session: null, onlyDuo: false }));
vi.mock('@marcosampaio99/mavera-client/react', () => ({
  useMaveraClient: () => mocks.client,
  useMaveraAuth: () => ({ session: mocks.session }),
  useCustomerEntitlements: () => ({ entitlements: mocks.onlyDuo ? [] : [{ id: 'e1', productName: 'Plano pessoal', status: 'ACTIVE', eligibleServices: [{ id: 's1' }] }], isLoading: false }),
  useCustomerDuos: () => ({ data: [{ id: 'd1', status: 'ACTIVE' }] }),
  useCustomerDuoEntitlements: () => ({ data: [{ id: 'e2', productName: 'Plano partilhado', status: 'ACTIVE', coverageKind: 'DUO', duoId: 'd1' }] }),
}));
let services, locations, resources, fetcher;
const selection = { kind: 'INDIVIDUAL', customerEntitlementId: 'e1', plan: { productName: 'Plano pessoal' } };
const config = { tenantId: 'tenant-leandro', tenantSlug: 'leandro-faria', apiBaseUrl: 'https://api.test/api/v1' };
const json = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
function available(date, starts = ['09:00', '14:00', '19:00'], timezone = 'Europe/Lisbon') {
  return { date, timezone, slots: starts.map(start => ({ start, end: `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:00`, resourceIds: ['r1', 'r2'] })) };
}
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-23T12:00:00Z'));
  mocks.onlyDuo = false;
  services = [{ id: 's1', name: 'Treino', schedulingMode: 'APPOINTMENT' }];
  locations = [{ id: 'l1', name: 'Estúdio' }];
  resources = [{ id: 'r1', name: 'Leandro', type: 'PERSON', services: [{ id: 's1' }, { id: 's2' }], locations: [{ id: 'l1' }, { id: 'l2' }] }];
  fetcher = vi.fn(async url => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/locations')) return json({ locations });
    if (parsed.pathname.endsWith('/resources')) return json({ resources });
    if (parsed.pathname.endsWith('/availability')) return json(available(parsed.searchParams.get('date')));
    throw Error('Unexpected endpoint');
  });
  vi.stubGlobal('fetch', fetcher);
  mocks.client = { config, getPublicServices: vi.fn(async () => ({ services })) };
  mocks.session = { user: { id: 'a' }, access_token: 'session-a' };
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
function wizard(value = selection) { return render(<BookingWizard client={mocks.client} selection={value} />); }
async function chooseDay(date = '2026-10-24') {
  fireEvent.click(await screen.findByRole('button', { name: dateLabel(date) }));
  await screen.findByRole('button', { name: '09:00' });
}
const select = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
it('omite seletores únicos e impede confirmar quando faltam dados contratuais', async () => {
  wizard(); await chooseDay();
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.getByText('Manhã')).toBeTruthy(); expect(screen.getByText('Tarde')).toBeTruthy(); expect(screen.getByText('Noite')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '09:00' }));
  expect(screen.getByRole('region', { name: 'Resumo da escolha' }).textContent).toContain('Plano pessoal');
  expect(screen.getByRole('button', { name: /Confirmar treino/ }).disabled).toBe(true);
  expect(fetcher.mock.calls.every(([, options]) => options.method === 'GET')).toBe(true);
  expect(mocks.client.getPublicServices).toHaveBeenCalledWith(expect.any(AbortSignal));
});
it('usa o adaptador público sem credenciais, com parâmetros reais e AbortSignal', async () => {
  const controller = new AbortController();
  const api = publicBookingApi(config, fetcher);
  await api.availability({ serviceIds: 's1', locationId: 'l1', resourceId: 'r1', date: '2026-10-24' }, controller.signal);
  const [url, options] = fetcher.mock.calls[0];
  const parsed = new URL(url);
  expect(parsed.pathname).toBe('/api/v1/public/leandro-faria/availability');
  expect(Object.fromEntries(parsed.searchParams)).toEqual({ serviceIds: 's1', locationId: 'l1', resourceId: 'r1', date: '2026-10-24' });
  expect(options).toMatchObject({ signal: controller.signal, credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' } });
  expect(options.headers.Authorization).toBeUndefined();
});
it('seleciona coberturas Individual e Duo a partir de O meu plano, sem duplicar dados', async () => {
  render(<AppointmentPlanner />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar plano' })[0]);
  await chooseDay(); fireEvent.click(screen.getByRole('button', { name: '09:00' }));
  expect(screen.getByRole('region', { name: 'Resumo da escolha' }).textContent).toContain('Individual');
  if (screen.queryByRole('button', { name: 'Alterar' })) fireEvent.click(screen.getByRole('button', { name: 'Alterar' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar plano' })[1]);
  expect(screen.queryByRole('region', { name: 'Resumo da escolha' })).toBeNull();
  await chooseDay(); fireEvent.click(screen.getByRole('button', { name: '14:00' }));
  expect(screen.getByRole('region', { name: 'Resumo da escolha' }).textContent).toContain('Duo');
  expect(document.body.textContent).not.toContain('d1');
});
it('filtra SESSION e restringe serviços individuais aos dados da cobertura', async () => {
  services.push({ id: 's2', name: 'Outro treino', schedulingMode: 'APPOINTMENT' }, { id: 'session', name: 'Aula', schedulingMode: 'SESSION' });
  wizard({ ...selection, plan: { ...selection.plan, eligibleServices: [{ id: 's1' }] } });
  await chooseDay(); expect(screen.queryByLabelText('Serviço')).toBeNull(); expect(screen.queryByText('Aula')).toBeNull();
});
it('limpa data e horário ao mudar serviço', async () => {
  services.push({ id: 's2', name: 'Outro treino', schedulingMode: 'APPOINTMENT' });
  wizard(); await screen.findByLabelText('Serviço'); select('Serviço', 's1');
  await chooseDay(); fireEvent.click(screen.getByRole('button', { name: '09:00' }));
  select('Serviço', 's2');
  expect(screen.queryByRole('region', { name: 'Resumo da escolha' })).toBeNull();
  await screen.findByRole('button', { name: dateLabel('2026-10-24') });
  expect(screen.queryByRole('button', { name: '09:00' })).toBeNull();
  expect(document.querySelector('.calendar-days button[aria-pressed="true"]')).toBeNull();
});
it('limpa escolhas ao mudar localização e profissional', async () => {
  locations.push({ id: 'l2', name: 'Ginásio' });
  resources.push({ ...resources[0], id: 'r2', name: 'Outro profissional' });
  wizard(); await screen.findByLabelText('Localização'); select('Localização', 'l1');
  await screen.findByLabelText('Profissional'); select('Profissional', 'r1');
  await chooseDay(); fireEvent.click(screen.getByRole('button', { name: '09:00' }));
  select('Profissional', 'r2'); expect(screen.queryByRole('region', { name: 'Resumo da escolha' })).toBeNull();
  await chooseDay(); select('Localização', 'l2');
  await screen.findByLabelText('Profissional'); expect(screen.getByLabelText('Profissional').value).toBe('');
  expect(screen.queryByRole('button', { name: '09:00' })).toBeNull();
});
it('ao mudar data não reaproveita o horário e ignora respostas antigas mesmo sem cancelamento do transporte', async () => {
  let resolve;
  const original = fetcher.getMockImplementation();
  fetcher.mockImplementation((url, options) => new URL(url).searchParams.get('date') === '2026-10-24' ? new Promise(done => { resolve = done; }) : original(url, options));
  wizard(); fireEvent.click(await screen.findByRole('button', { name: dateLabel('2026-10-24') }));
  await waitFor(() => expect(resolve).toBeTypeOf('function'));
  const signal = fetcher.mock.calls.find(([url]) => url.includes('2026-10-24'))[1].signal;
  await chooseDay('2026-10-25'); expect(signal.aborted).toBe(true);
  await act(async () => resolve(json(available('2026-10-24', ['11:00']))));
  expect(screen.queryByRole('button', { name: '11:00' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: '09:00' }));
  await chooseDay('2026-10-26');
  expect(screen.queryByRole('region', { name: 'Resumo da escolha' })).toBeNull();
});
it('mostra ausência de horários sem inventar alternativas', async () => {
  const original = fetcher.getMockImplementation();
  fetcher.mockImplementation((url, options) => url.includes('date=2026-10-24') ? Promise.resolve(json(available('2026-10-24', []))) : original(url, options));
  wizard(); fireEvent.click(await screen.findByRole('button', { name: dateLabel('2026-10-24') }));
  await screen.findByText('Sem horários disponíveis neste dia. Escolhe outra data.');
  expect(screen.queryByRole('button', { name: /Confirmar treino/ })).toBeNull();
});
it('recupera de falha de rede na disponibilidade sem expor detalhes', async () => {
  const original = fetcher.getMockImplementation(); let fail = true;
  fetcher.mockImplementation((url, options) => url.includes('date=2026-10-24') && fail ? Promise.reject(new Error('internal detail')) : original(url, options));
  wizard(); fireEvent.click(await screen.findByRole('button', { name: dateLabel('2026-10-24') }));
  expect((await screen.findByRole('alert')).textContent).not.toContain('internal detail');
  fail = false; fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByRole('button', { name: '09:00' });
});
it('permite repetir uma falha de catálogo e apresenta catálogo vazio', async () => {
  mocks.client.getPublicServices.mockRejectedValueOnce(new Error('offline')); services = [];
  wizard(); await screen.findByRole('alert'); fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByText(/Sem serviços APPOINTMENT/);
});
it('não mantém seleção nem pedidos pendentes quando muda a sessão', async () => {
  const view = render(<AppointmentPlanner />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar plano' })[0]);
  await chooseDay(); fireEvent.click(screen.getByRole('button', { name: '09:00' }));
  mocks.session = { user: { id: 'b' }, access_token: 'session-b' }; view.rerender(<AppointmentPlanner />);
  expect(screen.queryByRole('region', { name: 'Resumo da escolha' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Consultar horários' })).toBeNull();
});
it('usa o dia local da API, incluindo meia-noite e a mudança de hora', async () => {
  vi.setSystemTime(new Date('2026-10-24T23:30:00Z'));
  expect(dateInZone(Date.now(), 'Europe/Lisbon')).toBe('2026-10-25');
  expect(dateInZone('2026-10-25T01:30:00Z', 'Europe/Lisbon')).toBe('2026-10-25');
  expect(dateInZone('2026-10-25T00:30:00Z', 'America/New_York')).toBe('2026-10-24');
  wizard();
  await screen.findByRole('button', { name: 'Mês seguinte' });
  expect(screen.getByRole('button', { name: dateLabel('2026-10-24') }).disabled).toBe(true);
  expect(screen.getByRole('button', { name: dateLabel('2026-10-25') }).disabled).toBe(false);
});
it('navega meses com dias válidos num ano bissexto', () => {
  vi.setSystemTime(new Date('2028-02-01T12:00:00Z'));
  const onSelect = vi.fn(); render(<AppointmentCalendar timezone="Europe/Lisbon" onSelect={onSelect} />);
  fireEvent.click(screen.getByRole('button', { name: dateLabel('2028-02-29') })); expect(onSelect).toHaveBeenCalledWith('2028-02-29');
  fireEvent.click(screen.getByRole('button', { name: 'Mês seguinte' }));
  expect(screen.getByRole('button', { name: dateLabel('2028-03-31') })).toBeTruthy();
});
it('limita horários visíveis por período e permite expandir', () => {
  render(<TimeSlots slots={['06:00','07:00','08:00','09:00','10:00','10:30','11:00'].map(start => ({ start, end: '12:00' }))} onSelect={vi.fn()} />);
  expect(screen.queryByRole('button', { name: '11:00' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Ver mais horários de manhã' }));
  expect(screen.getByRole('button', { name: '11:00' })).toBeTruthy();
});
it('omite serviços sem profissional/local público compatível', async () => {
  services.push({ id: 'unsupported', name: 'Serviço sem profissional', schedulingMode: 'APPOINTMENT' });
  wizard(); await chooseDay(); expect(screen.queryByLabelText('Serviço')).toBeNull();
  expect(screen.queryByText('Serviço sem profissional')).toBeNull();
});
it('apresenta vazio sem recursos PERSON, sem usar recursos de outros tipos', async () => {
  resources = [{ ...resources[0], type: 'ROOM' }]; wizard();
  await screen.findByText(/Sem serviços APPOINTMENT/);
  expect(fetcher.mock.calls.some(([url]) => url.includes('/availability'))).toBe(false);
});
it('não mantém seleção quando muda o tenant', async () => {
  const view = render(<AppointmentPlanner />);
  if (screen.queryByRole('button', { name: 'Alterar' })) fireEvent.click(screen.getByRole('button', { name: 'Alterar' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar plano' })[1]);
  await chooseDay();
  mocks.client = { ...mocks.client, config: { ...config, tenantId: 'other-tenant', tenantSlug: 'other' } };
  view.rerender(<AppointmentPlanner />);
  expect(screen.queryByRole('heading', { name: 'Consultar horários' })).toBeNull();
  if (screen.queryByRole('button', { name: 'Alterar' })) fireEvent.click(screen.getByRole('button', { name: 'Alterar' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar plano' })[1]); await chooseDay();
  expect(fetcher.mock.calls.some(([url]) => new URL(url).pathname === '/api/v1/public/other/availability')).toBe(true);
});
it('ignora um catálogo antigo após mudar de plano e aborta a leitura do SDK', async () => {
  let resolve;
  mocks.client.getPublicServices.mockReturnValueOnce(new Promise(done => { resolve = done; }));
  render(<AppointmentPlanner />); fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar plano' })[0]);
  await waitFor(() => expect(mocks.client.getPublicServices).toHaveBeenCalledOnce());
  const signal = mocks.client.getPublicServices.mock.calls[0][0];
  if (screen.queryByRole('button', { name: 'Alterar' })) fireEvent.click(screen.getByRole('button', { name: 'Alterar' }));
  fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar plano' })[1]); await chooseDay();
  expect(signal.aborted).toBe(true);
  await act(async () => resolve({ services: [{ id: 'old', name: 'Serviço antigo', schedulingMode: 'APPOINTMENT' }] }));
  expect(screen.queryByText('Serviço antigo')).toBeNull();
});
it('uma timezone ausente não permite apresentar datas com um fuso inventado', async () => {
  const original = fetcher.getMockImplementation();
  fetcher.mockImplementation((url, options) => url.includes('/availability') ? Promise.resolve(json({ slots: [] })) : original(url, options));
  wizard(); await screen.findByRole('alert');
  expect(screen.queryByRole('button', { name: dateLabel('2026-10-24') })).toBeNull();
});
it('pré-seleciona o plano Duo único e mantém o calendário pronto para escolher o dia', async () => {
  mocks.onlyDuo = true;
  render(<AppointmentPlanner />);
  expect(screen.getAllByRole('heading')[0].textContent).toBe('Marcar treino');
  await screen.findByRole('button', { name: dateLabel('2026-10-24') });
  expect(screen.getByRole('heading', { name: 'Consultar horários' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Individual' })).toBeNull();
  expect(screen.queryByText('Sem planos associados.')).toBeNull();
  expect(screen.getByRole('button', { name: 'Alterar' })).toBeTruthy();
});
it('mostra o mês sem horários até selecionar um dia e não escolhe horas automaticamente', async () => {
  wizard(); await screen.findByRole('button', { name: dateLabel('2026-10-23') });
  expect(document.querySelectorAll('.calendar-days button')).toHaveLength(31);
  expect(document.querySelector('.calendar-days button[aria-pressed="true"]')).toBeNull();
  expect(screen.queryByRole('button', { name: '09:00' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Semana seguinte' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Ver mês' })).toBeNull();
  await chooseDay('2026-10-25');
  expect(screen.getByRole('button', { name: '09:00' }).getAttribute('aria-pressed')).toBe('false');
});
it('recolhe os planos após escolher e mantém detalhes e alteração acessíveis', async () => {
  render(<AppointmentPlanner />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Selecionar plano' })[0]);
  await screen.findByRole('button', { name: 'Mês seguinte' });
  expect(screen.queryByRole('button', { name: 'Selecionar plano' })).toBeNull();
  const disclosure = document.querySelector('.selected-plan details');
  expect(disclosure).toBeTruthy(); fireEvent.click(disclosure.querySelector('summary'));
  expect(document.querySelector('.selected-plan .plan-facts')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Alterar' }));
  expect(screen.getAllByRole('button', { name: 'Selecionar plano' })).toHaveLength(2);
});
it('navega meses sem consultar horários e limpa a data ao mudar de mês', async () => {
  wizard(); await screen.findByRole('button', { name: 'Mês seguinte' });
  const reads = fetcher.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: 'Mês seguinte' }));
  expect(fetcher.mock.calls).toHaveLength(reads);
  await chooseDay('2026-11-02');
  fireEvent.click(screen.getByRole('button', { name: '09:00' }));
  fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }));
  expect(screen.queryByRole('region', { name: 'Resumo da escolha' })).toBeNull();
  expect(screen.queryByRole('button', { name: '09:00' })).toBeNull();
});
it('identifica hoje no timezone da API sem o selecionar automaticamente', async () => {
  vi.setSystemTime(new Date('2026-10-24T23:30:00Z'));
  wizard(); await screen.findByRole('button', { name: dateLabel('2026-10-25') });
  expect(screen.getByRole('button', { name: dateLabel('2026-10-25') }).getAttribute('aria-current')).toBe('date');
  expect(screen.getByRole('button', { name: dateLabel('2026-10-25') }).getAttribute('aria-pressed')).toBe('false');
  expect(screen.queryByRole('button', { name: '09:00' })).toBeNull();
  await chooseDay('2026-10-25');
  expect(fetcher.mock.calls.some(([url]) => new URL(url).searchParams.get('date') === '2026-10-25')).toBe(true);
});
it('mantém hoje quando não há horários, sem avançar silenciosamente para outra data', async () => {
  const original = fetcher.getMockImplementation();
  fetcher.mockImplementation((url, options) => url.includes('/availability') ? Promise.resolve(json(available(new URL(url).searchParams.get('date'), []))) : original(url, options));
  wizard(); fireEvent.click(await screen.findByRole('button', { name: dateLabel('2026-10-23') })); await screen.findByText('Sem horários disponíveis neste dia. Escolhe outra data.');
  expect(screen.getByRole('button', { name: dateLabel('2026-10-23') }).getAttribute('aria-pressed')).toBe('true');
  const dates = fetcher.mock.calls.filter(([url]) => url.includes('/availability')).map(([url]) => new URL(url).searchParams.get('date'));
  expect(new Set(dates)).toEqual(new Set(['2026-10-23']));
});
it('recupera de erro na consulta do dia escolhido sem mudar a seleção', async () => {
  const original = fetcher.getMockImplementation(); let calls = 0;
  fetcher.mockImplementation((url, options) => url.includes('/availability') && ++calls === 2 ? Promise.reject(new Error('offline')) : original(url, options));
  wizard(); fireEvent.click(await screen.findByRole('button', { name: dateLabel('2026-10-23') })); await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: dateLabel('2026-10-23') }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
  await screen.findByRole('button', { name: '09:00' });
});
it('navega de dezembro a janeiro e mantém os dias passados desativados ao voltar', () => {
  vi.setSystemTime(new Date('2026-12-31T12:00:00Z'));
  const onSelect = vi.fn(); render(<AppointmentCalendar timezone="Europe/Lisbon" onSelect={onSelect} />);
  expect(screen.getByRole('button', { name: dateLabel('2026-12-30') }).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Mês seguinte' }));
  expect(screen.getByRole('button', { name: dateLabel('2027-01-01') }).disabled).toBe(false);
  expect(onSelect).toHaveBeenCalledWith('');
  fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }));
  expect(screen.getByRole('button', { name: 'Mês anterior' }).disabled).toBe(true);
  expect(screen.getByRole('button', { name: dateLabel('2026-12-31') }).getAttribute('aria-current')).toBe('date');
});
it('permite mover o foco por teclado sem selecionar dias nem horários', () => {
  const onSelect = vi.fn(); render(<AppointmentCalendar timezone="Europe/Lisbon" onSelect={onSelect} />);
  const today = screen.getByRole('button', { name: dateLabel('2026-10-23') }); today.focus();
  fireEvent.keyDown(today, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(screen.getByRole('button', { name: dateLabel('2026-10-24') }));
  expect(onSelect).not.toHaveBeenCalled();
  expect(Array.from(document.querySelectorAll('.calendar-weekday')).map(item => item.textContent)).toEqual(['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']);
});
