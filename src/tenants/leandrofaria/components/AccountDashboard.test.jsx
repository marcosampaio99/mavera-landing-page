// @vitest-environment jsdom
import React from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Account } from '../pages/Account';
import { AccountDashboard } from './AccountDashboard';
import { Bookings } from './Bookings';
import { Layout } from './Layout';
const mocks = vi.hoisted(() => ({
  auth: { isLoading: false, isAuthenticated: true, account: { name: 'Marco Sampaio', email: 'marco@example.test' }, session: { user: { id: 'marco', email: 'marco@example.test' } } },
  customer: { customer: { id: 'customer-marco', name: 'Marco Sampaio' }, linkStatus: 'linked' },
  bookings: { upcomingBookings: [], historyBookings: [], isLoading: false, error: null, refresh: vi.fn().mockResolvedValue([]) },
}));
vi.mock('@marcosampaio99/mavera-client/react', () => ({ useMaveraClient: () => ({ config: { tenantId: 'leandro' } }), useMaveraAuth: () => mocks.auth, useMaveraCustomer: () => mocks.customer, useCustomerBookings: () => mocks.bookings, useCustomerEntitlements: () => ({ entitlements: [], isLoading: false }), useCustomerDuos: () => ({ data: [], isLoading: false }) }));
afterEach(() => { cleanup(); mocks.bookings.upcomingBookings = []; mocks.bookings.historyBookings = []; mocks.bookings.isLoading = false; mocks.bookings.error = null; vi.clearAllMocks(); });
const booking = { id: 'b', startAt: '2026-10-21T09:30:00Z', endAt: '2026-10-21T10:30:00Z', status: 'PENDING', services: [{ name: 'Treino Duo' }], location: { name: 'Estúdio' } };
it('mantém a marca e os contactos, com saudação simples e email apenas no rodapé', () => {
  render(<Layout wide><Account /></Layout>);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Marcar treino');
  expect(screen.getByText('marco@example.test').closest('footer')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Conta' })).toHaveProperty('hash', '#account-session');
  expect(screen.queryByText('Visão geral')).toBeNull();
  expect(screen.getByRole('heading', { name: 'Próximos treinos' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Terminar sessão' })).toBeTruthy();
  expect(document.querySelector('.account-welcome .eyebrow')).toBeNull();
});
it('mostra skeleton no resumo e uma ação concreta quando não há treinos', () => {
  mocks.bookings.isLoading = true;
  const view = render(<AccountDashboard />);
  expect(screen.getByRole('status', { name: 'A carregar os próximos treinos' })).toBeTruthy();
  mocks.bookings.isLoading = false; view.rerender(<AccountDashboard />);
  expect(screen.getByText('Sem treino marcado')).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Marcar treino' }).getAttribute('href')).toBe('#marcar-treino');
  expect(screen.queryByRole('link', { name: /WhatsApp/ })).toBeNull();
  expect(document.getElementById('marcar-treino').contains(screen.getByRole('heading', { name: 'Marcar treino' }))).toBe(true);
});
it('permite repetir o pedido de treinos no próprio resumo', () => {
  mocks.bookings.error = new Error('offline');
  render(<AccountDashboard />);
  fireEvent.click(screen.getByRole('button', { name: 'Tentar outra vez' }));
  expect(mocks.bookings.refresh).toHaveBeenCalledOnce();
});
it('mostra cada próximo treino uma única vez na mesma lista', () => {
  mocks.bookings.upcomingBookings = [booking, { ...booking, id: 'b2', services: [{ name: 'Treino individual' }] }];
  render(<AccountDashboard />);
  const list = screen.getByRole('region', { name: 'Próximos treinos' });
  expect(list.querySelectorAll('.booking-row')).toHaveLength(2);
  expect(screen.getAllByText('Treino Duo')).toHaveLength(1);
  expect(screen.getAllByText('Treino individual')).toHaveLength(1);
});
it('mostra hora de Lisboa, tipo e local sem secções vazias', () => {
  render(<Bookings bookings={[booking]} />);
  expect(screen.getByText('Treino Duo')).toBeTruthy();
  expect(screen.getByText('Estúdio · Por confirmar')).toBeTruthy();
  expect(screen.getByText('10:30')).toBeTruthy();
});
it('coloca a marcação antes do resumo dos treinos', () => {
  render(<AccountDashboard />);
  const booking = screen.getByRole('heading', { name: 'Marcar treino' });
  const training = screen.getByRole('heading', { name: 'Próximos treinos' });
  expect(booking.compareDocumentPosition(training) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});
it('mostra os próximos treinos sem abrir secções e recolhe apenas o histórico', () => {
  mocks.bookings.upcomingBookings = [booking];
  const view = render(<AccountDashboard />);
  expect(screen.getByText('Treino Duo').closest('details')).toBeNull();
  expect(document.querySelector('.account-secondary')).toBeNull();
  mocks.bookings.historyBookings = [{ ...booking, id: 'past', status: 'COMPLETED' }];
  view.rerender(<AccountDashboard />);
  const disclosure = document.querySelector('.account-secondary');
  expect(disclosure.open).toBe(false);
  expect(disclosure.querySelector('summary h2').textContent).toBe('Histórico de treinos');
});

it('mantém o histórico de treinos na secção recolhível', () => {
  mocks.bookings.historyBookings = [{ ...booking, id: 'past', status: 'COMPLETED', services: [{ name: 'Treino anterior' }] }];
  render(<AccountDashboard />);
  expect(screen.getByRole('heading', { name: 'Histórico de treinos' }).closest('summary')).toBeTruthy();
  expect(screen.getByText('Treino anterior')).toBeTruthy();
  expect(screen.getByText('Estúdio · Concluído')).toBeTruthy();
});

it('identifica o parceiro Duo apenas a partir dos participantes da reserva', () => {
  const duo = participants => ({ ...booking, id: participants.join('-') || 'duo', duo: { id: 'd', participants: participants.map(name => ({ name })) } });
  mocks.bookings.upcomingBookings = [duo(['Marco Sampaio', 'Ana Costa']), duo(['M. Sampaio', 'Ana Costa']), duo([])];
  render(<AccountDashboard customer={{ id: 'customer-marco', name: 'Marco Sampaio' }} />);
  expect(screen.getByText('Duo com Ana Costa')).toBeTruthy();
  expect(screen.getByText('Duo · M. Sampaio e Ana Costa')).toBeTruthy();
  expect(screen.getByText('Duo')).toBeTruthy();
});
it('não apresenta Duo nem cancelamento em reservas individuais sem política', () => {
  mocks.bookings.upcomingBookings = [{ ...booking, services: [{ name: 'Treino individual' }] }];
  render(<AccountDashboard />);
  expect(screen.queryByText(/^Duo/)).toBeNull();
  expect(screen.queryByRole('button', { name: 'Cancelar treino' })).toBeNull();
});
it('passa ao calendário apenas as próximas reservas já carregadas', () => {
  mocks.bookings.upcomingBookings = [booking];
  mocks.bookings.historyBookings = [{ ...booking, id: 'past', status: 'COMPLETED' }];
  render(<AccountDashboard />);
  expect(document.getElementById('proximos-treinos').getAttribute('tabindex')).toBe('-1');
  expect(screen.getAllByText('Treino Duo')).toHaveLength(2);
});
it('mantém a hierarquia de títulos sem saltos', () => {
  mocks.bookings.upcomingBookings = [booking];
  mocks.bookings.historyBookings = [{ ...booking, id: 'past', status: 'COMPLETED' }];
  render(<AccountDashboard />);
  const levels = [...document.querySelectorAll('h1, h2, h3, h4')].map(heading => Number(heading.tagName[1]));
  expect(levels[0]).toBe(1);
  levels.forEach((level, index) => { if (index) expect(level - levels[index - 1]).toBeLessThanOrEqual(1); });
});
