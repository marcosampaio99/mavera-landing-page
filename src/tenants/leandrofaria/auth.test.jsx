// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SignIn } from './pages/SignIn';
import { Account } from './pages/Account';
import { AuthProvider } from './auth';

const mocks = vi.hoisted(() => ({ auth: {}, customer: {}, bookings: vi.fn(), navigate: vi.fn() }));
vi.mock('./navigation', () => ({ navigate: mocks.navigate }));
vi.mock('@marcosampaio99/mavera-client/react', () => ({
  useMaveraClient: () => ({}),
  useMaveraAuth: () => mocks.auth,
  useMaveraCustomer: () => mocks.customer,
  useCustomerBookings: () => mocks.bookings(),
  MaveraProvider: ({ children }) => children,
}));

beforeEach(() => {
  window.history.replaceState({}, '', '/leandrofaria/entrar');
  mocks.auth = {
    isLoading: false, isPending: false, isAuthenticated: false,
    signIn: vi.fn().mockResolvedValue(), signUp: vi.fn().mockResolvedValue({ requiresEmailConfirmation: true }),
    requestPasswordReset: vi.fn().mockResolvedValue(), updatePassword: vi.fn().mockResolvedValue(),
  };
  mocks.customer = { linkStatus: 'not-linked', error: { code: 'CUSTOMER_PROFILE_NOT_LINKED' }, claim: vi.fn().mockResolvedValue({}) };
  mocks.bookings.mockClear(); mocks.navigate.mockClear();
});
afterEach(cleanup);
function fill(label, value) { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }
function submit() { fireEvent.submit(document.querySelector('form')); }

describe('autenticação do Leandro Faria', () => {
  it('envia as credenciais ao SDK e apresenta erros sem expor detalhes internos', async () => {
    mocks.auth.signIn.mockRejectedValue({ code: 'invalid_credentials' });
    render(<SignIn />);
    fill('Email', 'cliente@example.com'); fill('Palavra-passe', 'password123'); submit();
    await waitFor(() => expect(mocks.auth.signIn).toHaveBeenCalledWith('cliente@example.com', 'password123'));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'O email ou a palavra-passe estão incorretos.');
  });
  it('regista com callback fixo e pede confirmação por email', async () => {
    window.history.replaceState({}, '', '/leandrofaria/entrar?modo=registo');
    render(<SignIn />);
    fill('Email', 'cliente@example.com'); fill('Palavra-passe', 'password123'); fill('Confirmar palavra-passe', 'password123'); submit();
    await waitFor(() => expect(mocks.auth.signUp).toHaveBeenCalledWith({ email: 'cliente@example.com', password: 'password123', emailRedirectTo: new URL('/leandrofaria/entrar', window.location.origin).href }));
    expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Consulta o teu email para confirmar a conta. Depois, volta para entrar.');
    expect(mocks.customer.claim).not.toHaveBeenCalled();
  });
  it('valida a confirmação da palavra-passe antes de enviar', () => {
    window.history.replaceState({}, '', '/leandrofaria/entrar?modo=registo');
    render(<SignIn />);
    fill('Palavra-passe', 'password123'); fill('Confirmar palavra-passe', 'different'); submit();
    expect(screen.getByRole('alert').textContent).toContain('não coincidem');
    expect(mocks.auth.signUp).not.toHaveBeenCalled();
  });
  it('envia recuperação para a rota fixa de nova palavra-passe', async () => {
    window.history.replaceState({}, '', '/leandrofaria/entrar?modo=recuperar');
    render(<SignIn />); fill('Email', 'cliente@example.com'); submit();
    await waitFor(() => expect(mocks.auth.requestPasswordReset).toHaveBeenCalledWith('cliente@example.com', new URL('/leandrofaria/entrar?modo=nova-palavra-passe', window.location.origin).href));
    expect(await screen.findByRole('status')).toHaveProperty('textContent', 'Se existir uma conta com este email, receberás uma ligação para recuperar a palavra-passe.');
  });
  it('não permite atualizar a palavra-passe sem uma sessão de recuperação', () => {
    window.history.replaceState({}, '', '/leandrofaria/entrar?modo=nova-palavra-passe');
    render(<SignIn />);
    expect(screen.getByRole('alert').textContent).toContain('inválida ou expirou');
    expect(document.querySelector('form')).toBeNull();
  });
  it('oculta dados e não carrega reservas enquanto restaura a sessão', () => {
    mocks.auth.isLoading = true;
    render(<Account />);
    expect(screen.getByRole('status', { name: 'A verificar a sessão' })).toBeTruthy();
    expect(mocks.bookings).not.toHaveBeenCalled();
  });
  it('apresenta um aviso quando o UUID do tenant não está configurado', () => {
    vi.stubEnv('VITE_LEANDROFARIA_TENANT_ID', '');
    render(<AuthProvider><p>Conteúdo privado</p></AuthProvider>);
    expect(screen.queryByText('Conteúdo privado')).toBeNull();
    expect(screen.getByText('Acesso indisponível')).toBeTruthy();
    vi.unstubAllEnvs();
  });
  it('permite tentar novamente quando falha a atualização de palavra-passe', async () => {
    mocks.auth = { ...mocks.auth, isAuthenticated: true, isPasswordRecovery: true };
    mocks.auth.updatePassword.mockRejectedValue({ code: 'weak_password' });
    render(<SignIn />);
    fill('Palavra-passe', 'password123'); fill('Confirmar palavra-passe', 'password123'); submit();
    await waitFor(() => expect(mocks.auth.updatePassword).toHaveBeenCalledWith('password123'));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Escolhe uma palavra-passe mais forte.');
  });
  it('apresenta falhas ao terminar sessão sem esconder o botão de nova tentativa', async () => {
    mocks.auth = { ...mocks.auth, isAuthenticated: true, session: { user: { email: 'cliente@example.com' } }, signOut: vi.fn().mockRejectedValue(new Error('offline')) };
    render(<Account />);
    fireEvent.click(screen.getByRole('button', { name: 'Terminar sessão' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'Não foi possível concluir o pedido. Tenta novamente.');
    expect(mocks.auth.signOut).toHaveBeenCalledOnce();
  });
  it('associa o perfil apenas após uma ação explícita do cliente', async () => {
    mocks.auth = { ...mocks.auth, isAuthenticated: true, session: { user: { email: 'cliente@example.com' } } };
    render(<Account />);
    expect(mocks.customer.claim).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Associar pelo email' }));
    await waitFor(() => expect(mocks.customer.claim).toHaveBeenCalledWith({}, expect.any(AbortSignal)));
  });
  it('após sessão expirada explica o motivo e não restaura automaticamente a sessão guardada', () => {
    window.history.replaceState({}, '', '/leandrofaria/entrar?sessao=expirada');
    mocks.auth.isAuthenticated = true;
    render(<SignIn />);
    expect(screen.getByRole('alert').textContent).toBe('A tua sessão expirou. Entra novamente para continuar.');
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeTruthy();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });
  it('sem o aviso de sessão expirada, uma sessão válida segue para a conta', () => {
    mocks.auth.isAuthenticated = true;
    render(<SignIn />);
    expect(screen.queryByText(/sessão expirou/)).toBeNull();
    expect(mocks.navigate).toHaveBeenCalledWith('/leandrofaria/conta');
  });
});
