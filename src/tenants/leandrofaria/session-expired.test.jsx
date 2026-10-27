// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { createMaveraClient } from '@marcosampaio99/mavera-client';
import { MaveraProvider } from '@marcosampaio99/mavera-client/react';
import { Account } from './pages/Account';

const navigation = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('./navigation', () => navigation);

const tenant = '11111111-1111-4111-8111-111111111111';
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
let bookings, fetcher, auth;
const clients = [];
beforeEach(() => {
  window.history.replaceState({}, '', '/leandrofaria/conta');
  bookings = vi.fn(async () => json([]));
  fetcher = vi.fn(async (url, options) => {
    const path = new URL(url).pathname;
    if (path.endsWith('/auth/me')) return json({ id: 'user-a', email: 'cliente@example.test', memberships: [], customerProfileInTenants: [] });
    if (path.endsWith('/me')) return json({ id: 'customer-a', name: 'Cliente' });
    if (path.endsWith('/bookings')) return bookings();
    if (path.endsWith('/entitlements') || path.endsWith('/duos')) return json([]);
    throw Error(`Unexpected request ${options.method} ${path}`);
  });
  const session = { access_token: 'token-a', user: { id: 'user-a', email: 'cliente@example.test' } };
  auth = { getSession: vi.fn(async () => ({ data: { session }, error: null })), signOut: vi.fn(async () => ({ error: null })),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }) };
  navigation.navigate.mockClear();
});
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.dispose()); });
async function mount() {
  const client = createMaveraClient({ tenantId: tenant, tenantSlug: 'leandro-faria', apiBaseUrl: 'https://api.test/api/v1', supabaseUrl: 'https://auth.test', supabasePublishableKey: 'sb_publishable_test' }, { auth, fetch: fetcher });
  clients.push(client); await client.initialize();
  render(<MaveraProvider client={client}><Account /></MaveraProvider>);
  return client;
}

it('um 401 na revalidação automática das reservas limpa a sessão guardada e volta ao login', async () => {
  const client = await mount();
  expect(await screen.findByText('Sem treino marcado')).toBeTruthy();
  bookings.mockResolvedValue(json({ code: 'INVALID_TOKEN' }, 401));
  await act(async () => { await client.refreshBookings().catch(() => {}); });
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('/leandrofaria/entrar?sessao=expirada'));
  expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  expect(navigation.navigate).toHaveBeenCalledOnce();
  expect(screen.queryByText('Sem treino marcado')).toBeNull();
});
it('volta ao login mesmo que não seja possível limpar a sessão local', async () => {
  auth.signOut.mockResolvedValue({ error: { message: 'offline' } });
  const client = await mount();
  await screen.findByText('Sem treino marcado');
  bookings.mockResolvedValue(json({ code: 'INVALID_TOKEN' }, 401));
  await act(async () => { await client.refreshBookings().catch(() => {}); });
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('/leandrofaria/entrar?sessao=expirada'));
});
it('sem sessão e sem erro de autenticação segue para o login normal', async () => {
  auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  await mount();
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalledWith('/leandrofaria/entrar'));
  expect(auth.signOut).not.toHaveBeenCalled();
});
