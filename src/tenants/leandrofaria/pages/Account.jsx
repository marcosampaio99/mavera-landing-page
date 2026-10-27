import React, { useEffect, useRef, useState } from 'react';
import { useMaveraAuth, useMaveraCustomer } from '@marcosampaio99/mavera-client/react';
import { authError } from '../auth';
import { paths, tenant } from '../tenant';
import { navigate } from '../navigation';
import { CustomerClaim } from '../components/CustomerClaim';
import { AccountDashboard } from '../components/AccountDashboard';

function PersonalArea({ auth }) {
  const { customer, linkStatus, isLoading, error, refresh, claim } = useMaveraCustomer();
  const wasUnlinked = useRef(false);
  if (linkStatus === 'not-linked') wasUnlinked.current = true;
  return <>
    {auth.error ? <section className="account-section"><p role="alert">Não foi possível verificar a conta.</p><button type="button" className="btn btn--outline" onClick={() => auth.refresh().catch(() => {})}>Tentar outra vez</button></section>
      : !customer && wasUnlinked.current ? <CustomerClaim auth={auth} claim={claim} />
      : isLoading || (!customer && !error) ? <div className="profile-skeleton" role="status" aria-label="A carregar o perfil"><span className="skeleton skeleton--value" /><span className="skeleton skeleton--line" /></div>
      : error ? <section className="account-section"><p role="alert">Não foi possível carregar o perfil.</p><button type="button" className="btn btn--outline" onClick={() => refresh().catch(() => {})}>Tentar outra vez</button></section>
      : <AccountDashboard key={`${auth.session.user.id}:${customer.id}`} customer={customer} />}
  </>;
}

export function Account() {
  const auth = useMaveraAuth();
  const [error, setError] = useState('');
  const leaving = useRef(false);
  useEffect(() => {
    if (auth.isLoading || leaving.current) return;
    if (!auth.isAuthenticated) {
      if (auth.error?.status !== 401 && auth.error?.kind !== 'authentication') { navigate(paths.signIn); return; }
      // A rejected token (e.g. during booking revalidation) only clears the SDK
      // session. Clear the stored one too, or sign-in would restore it and loop.
      leaving.current = true;
      Promise.resolve().then(() => auth.signOut()).catch(() => {}).finally(() => navigate(`${paths.signIn}?sessao=expirada`));
    } else if (auth.isPasswordRecovery) navigate(`${paths.signIn}?modo=nova-palavra-passe`);
  }, [auth.isLoading, auth.isAuthenticated, auth.isPasswordRecovery, auth.error]);
  async function logout() {
    setError('');
    try { await auth.signOut(); navigate(paths.signIn); }
    catch (failure) { setError(authError(failure)); }
  }
  if (auth.isLoading || !auth.isAuthenticated || auth.isPasswordRecovery) return <div className="profile-skeleton" role="status" aria-label="A verificar a sessão"><span className="skeleton skeleton--value" /><span className="skeleton skeleton--line" /></div>;
  return <div className="account-dashboard">
    <PersonalArea key={`${auth.session.user.id}:${auth.session.access_token || ''}`} auth={auth} />
    <footer id="account-session" className="account-session" tabIndex={-1}>
      <a href={tenant.contacts.whatsapp} target="_blank" rel="noreferrer">Dúvidas? Fala com o Leandro <span aria-hidden="true">↗</span></a>
      <a href={tenant.contacts.instagram} target="_blank" rel="noreferrer">Instagram</a>
      <span className="account-email">{auth.account?.email || auth.session.user.email}</span>
      <button className="text-button" disabled={auth.isPending} onClick={logout}>{auth.isPending ? 'A sair…' : 'Terminar sessão'}</button>
      {error && <p className="form-error" role="alert">{error}</p>}
    </footer>
  </div>;
}
