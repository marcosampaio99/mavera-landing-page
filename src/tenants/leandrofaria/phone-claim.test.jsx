// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CustomerClaim } from './components/CustomerClaim';
import { Account } from './pages/Account';

const mocks = vi.hoisted(() => ({ client: {}, auth: {}, customer: {} }));
vi.mock('@marcosampaio99/mavera-client/react', () => ({
  useMaveraClient: () => mocks.client,
  useMaveraAuth: () => mocks.auth,
  useMaveraCustomer: () => mocks.customer,
}));
vi.mock('./components/AccountDashboard', () => ({ AccountDashboard: () => <p>Reservas do cliente</p> }));
let claim;
beforeEach(() => {
  mocks.client = {
    getClaimOptions: vi.fn().mockResolvedValue({ phoneClaimAvailable: true }),
    startPhoneClaim: vi.fn().mockResolvedValue({ claimId: 'private-id', status: 'PENDING', expiresAt: new Date(Date.now() + 600000).toISOString(), resendAfterSeconds: 60 }),
    confirmPhoneClaim: vi.fn().mockResolvedValue({ status: 'COMPLETED' }),
    refreshCustomer: vi.fn().mockResolvedValue({ name: 'Cliente' }),
  };
  claim = vi.fn().mockResolvedValue({});
  mocks.auth = { isAuthenticated: true, session: { user: { id: 'user-a' }, access_token: 'session-a' } };
  mocks.customer = { linkStatus: 'not-linked', error: { code: 'CUSTOMER_PROFILE_NOT_LINKED' }, claim };
});
afterEach(() => { cleanup(); vi.useRealTimers(); });
const click = name => fireEvent.click(screen.getByRole('button', { name }));
function change(label, value) { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }
async function begin() {
  click('Já sou cliente');
  await screen.findByLabelText('Telemóvel');
  change('Telemóvel', '+351912345678'); click('Pedir código');
  await screen.findByLabelText('Código de 6 dígitos');
}
function mount() { return render(<CustomerClaim auth={mocks.auth} claim={claim} />); }
it('confirma apenas com seis dígitos e lê o Customer pelo SDK após COMPLETED', async () => {
  mount(); await begin();
  expect(screen.getByRole('button', { name: 'Confirmar código' }).disabled).toBe(true);
  change('Código de 6 dígitos', '123456'); click('Confirmar código');
  await waitFor(() => expect(mocks.client.refreshCustomer).toHaveBeenCalledOnce());
  expect(mocks.client.confirmPhoneClaim).toHaveBeenCalledWith({ claimId: 'private-id', code: '123456' }, expect.any(AbortSignal));
  expect(claim).not.toHaveBeenCalled();
  expect(document.body.textContent).not.toContain('private-id');
  expect(window.localStorage.length).toBe(0);
});
it.each(['código inválido', 'número inexistente'])('trata %s com a mesma mensagem sem criar perfis', async () => {
  mocks.client.confirmPhoneClaim.mockRejectedValue({ code: 'PHONE_CLAIM_NOT_CONFIRMED' });
  mount(); await begin(); change('Código de 6 dígitos', '111111'); click('Confirmar código');
  expect((await screen.findByRole('alert')).textContent).toBe('Não foi possível confirmar a associação. Verifica o código ou contacta o Leandro.');
  expect(claim).not.toHaveBeenCalled(); expect(mocks.client.refreshCustomer).not.toHaveBeenCalled();
});
it('respeita os 60 segundos de cooldown e reenvia através do SDK', async () => {
  vi.useFakeTimers(); mount();
  await act(async () => click('Já sou cliente'));
  change('Telemóvel', '+351912345678');
  await act(async () => click('Pedir código'));
  expect(screen.getByRole('button', { name: 'Reenviar em 60s' }).disabled).toBe(true);
  act(() => vi.advanceTimersByTime(61000));
  click('Reenviar código');
  await act(async () => {});
  expect(mocks.client.startPhoneClaim).toHaveBeenCalledTimes(2);
});
it('apresenta expiração e impede confirmação', async () => {
  mocks.client.startPhoneClaim.mockResolvedValue({ claimId: 'hidden', expiresAt: new Date(Date.now() - 1).toISOString(), resendAfterSeconds: 60 });
  mount(); await begin();
  expect(screen.getByRole('alert').textContent).toContain('expirou');
  expect(screen.getByRole('button', { name: 'Confirmar código' }).disabled).toBe(true);
});
it('feature OFF não apresenta campos de telefone nem OTP', async () => {
  mocks.client.getClaimOptions.mockResolvedValue({ phoneClaimAvailable: false });
  mount(); click('Já sou cliente');
  await screen.findByText(/A associação por SMS está indisponível/);
  expect(screen.queryByLabelText('Telemóvel')).toBeNull();
  expect(mocks.client.getClaimOptions).toHaveBeenCalledOnce();
  expect(screen.queryByRole('alert')).toBeNull();
  expect(screen.queryByLabelText('Código de 6 dígitos')).toBeNull();
  expect(mocks.client.startPhoneClaim).not.toHaveBeenCalled();
  expect(mocks.client.confirmPhoneClaim).not.toHaveBeenCalled();
});
it('rate limit impede repetir de imediato', async () => {
  mocks.client.startPhoneClaim.mockRejectedValue({ code: 'PHONE_CLAIM_RATE_LIMITED' });
  mount(); click('Já sou cliente'); await screen.findByLabelText('Telemóvel');
  change('Telemóvel', '+351912345678'); click('Pedir código');
  expect((await screen.findByRole('alert')).textContent).toContain('Demasiadas tentativas');
  expect(screen.getByRole('button', { name: 'Pedir código (60s)' }).disabled).toBe(true);
});
it('preserva claim por email sem telefone e não cria automaticamente', async () => {
  mount(); expect(claim).not.toHaveBeenCalled(); click('Associar pelo email');
  await waitFor(() => expect(claim).toHaveBeenCalledWith({}, expect.any(AbortSignal)));
});
it('pede nome e telefone apenas na criação explícita', async () => {
  mount(); click('Sou novo cliente'); change('Nome', 'Cliente Novo'); change('Telemóvel', '+351912345678'); click('Criar perfil de cliente');
  await waitFor(() => expect(claim).toHaveBeenCalledWith({ name: 'Cliente Novo', phone: '+351912345678' }, expect.any(AbortSignal)));
});
it('sem correspondência por email permite escolher sem criar um perfil', async () => {
  claim.mockRejectedValue({ code: 'CUSTOMER_PHONE_REQUIRED_FOR_CLAIM' });
  mount(); click('Associar pelo email'); await screen.findByText('Escolhe uma das opções para continuar.');
  expect(screen.queryByLabelText('Nome')).toBeNull(); expect(claim).toHaveBeenCalledTimes(1);
});
it('limpa o OTP e aborta pedidos quando muda a sessão, incluindo o mesmo utilizador', async () => {
  const view = render(<Account />); await begin(); change('Código de 6 dígitos', '123456');
  const signal = mocks.client.startPhoneClaim.mock.calls[0][1];
  mocks.auth = { ...mocks.auth, session: { ...mocks.auth.session, access_token: 'session-b' } };
  view.rerender(<Account />);
  expect(signal.aborted).toBe(true); expect(screen.queryByLabelText('Código de 6 dígitos')).toBeNull();
});
it('ignora opções tardias depois de mudar de utilizador', async () => {
  let resolve;
  mocks.client.getClaimOptions.mockReturnValue(new Promise(done => { resolve = done; }));
  const view = render(<Account />); click('Já sou cliente');
  mocks.auth = { ...mocks.auth, session: { user: { id: 'user-b' }, access_token: 'session-b' } };
  view.rerender(<Account />);
  await act(async () => resolve({ phoneClaimAvailable: true }));
  expect(screen.queryByLabelText('Telemóvel')).toBeNull();
});
it('mantém o fluxo montado durante a invalidação e permite repetir apenas a leitura', async () => {
  mocks.client.confirmPhoneClaim.mockImplementation(async () => {
    mocks.customer = { ...mocks.customer, error: null, linkStatus: 'unknown', isLoading: true };
    view.rerender(<Account />);
    return { status: 'COMPLETED' };
  });
  mocks.client.refreshCustomer.mockRejectedValue(new Error('offline'));
  const view = render(<Account />); await begin(); change('Código de 6 dígitos', '123456'); click('Confirmar código');
  await screen.findByRole('alert');
  click('Atualizar perfil'); await waitFor(() => expect(mocks.client.refreshCustomer).toHaveBeenCalledTimes(2));
  expect(mocks.client.confirmPhoneClaim).toHaveBeenCalledOnce();
});
it('preserva o erro de email não verificado sem avançar para criação', async () => {
  claim.mockRejectedValue({ code: 'CUSTOMER_CLAIM_REQUIRES_VERIFIED_EMAIL' });
  mount(); click('Associar pelo email');
  expect((await screen.findByRole('alert')).textContent).toBe('Confirma o teu email antes de associar o perfil.');
  expect(screen.queryByLabelText('Nome')).toBeNull();
});
it('um Customer associado abre a área pessoal sem mostrar claim', () => {
  mocks.customer = { customer: { id: 'private-customer', name: 'Cliente' }, linkStatus: 'linked' };
  render(<Account />);
  expect(screen.getByText('Reservas do cliente')).toBeTruthy();
  expect(screen.queryByText('Já sou cliente')).toBeNull();
  expect(claim).not.toHaveBeenCalled();
});
it('ignora confirmação tardia de outra sessão e não atualiza o novo Customer', async () => {
  let resolve;
  mocks.client.confirmPhoneClaim.mockReturnValue(new Promise(done => { resolve = done; }));
  const view = render(<Account />); await begin(); change('Código de 6 dígitos', '123456'); click('Confirmar código');
  mocks.auth = { ...mocks.auth, session: { user: { id: 'user-b' }, access_token: 'session-b' } };
  view.rerender(<Account />);
  await act(async () => resolve({ status: 'COMPLETED' }));
  expect(mocks.client.refreshCustomer).not.toHaveBeenCalled();
  expect(screen.queryByText(/Perfil associado/)).toBeNull();
});
