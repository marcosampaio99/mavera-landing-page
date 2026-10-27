import React, { useEffect, useState } from 'react';
import { useMaveraAuth } from '@marcosampaio99/mavera-client/react';
import { paths } from '../tenant';
import { navigate } from '../navigation';
import { authError } from '../auth';
import { Placeholder } from './Placeholder';

export function SignIn() {
  const auth = useMaveraAuth();
  const mode = new URLSearchParams(window.location.search).get('modo');
  const recovery = mode === 'nova-palavra-passe' || auth.isPasswordRecovery;
  const signUp = mode === 'registo' && !recovery;
  const reset = mode === 'recuperar' && !recovery;
  const expired = new URLSearchParams(window.location.search).get('sessao') === 'expirada' && !recovery && !signUp && !reset;
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const busy = pending || auth.isPending || auth.isLoading;

  useEffect(() => {
    // After an expired session, wait for an explicit sign-in instead of
    // restoring a stored session that the API has just rejected.
    if (auth.isAuthenticated && !auth.isLoading && !recovery && !expired) navigate(paths.account);
  }, [auth.isAuthenticated, auth.isLoading, recovery, expired]);

  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    setError('');
    setMessage('');
    if ((signUp || recovery) && password !== data.get('confirmPassword')) {
      setError('As palavras-passe não coincidem.');
      return;
    }
    setPending(true);
    try {
      if (recovery) {
        await auth.updatePassword(password);
        navigate(paths.account);
      } else if (reset) {
        await auth.requestPasswordReset(email, new URL(`${paths.signIn}?modo=nova-palavra-passe`, window.location.origin).href);
        setMessage('Se existir uma conta com este email, receberás uma ligação para recuperar a palavra-passe.');
      } else if (signUp) {
        const result = await auth.signUp({ email, password, emailRedirectTo: new URL(paths.signIn, window.location.origin).href });
        if (result.requiresEmailConfirmation) setMessage('Consulta o teu email para confirmar a conta. Depois, volta para entrar.');
      } else {
        await auth.signIn(email, password);
      }
    } catch (failure) {
      setError(authError(failure));
    } finally {
      setPending(false);
    }
  }

  const title = recovery ? 'Nova palavra-passe' : reset ? 'Recuperar acesso' : signUp ? 'Criar conta' : 'Entrar';
  return (
    <Placeholder eyebrow="Área de cliente" title={title} text={reset ? 'Enviamos uma ligação para o teu email.' : 'Acede à tua conta para acompanhar os teus treinos.'}>
      {auth.isLoading ? <p role="status">A verificar a sessão…</p> : recovery && !auth.isAuthenticated ? (
        <p role="alert">A ligação é inválida ou expirou. <a href={`${paths.signIn}?modo=recuperar`}>Pedir nova ligação</a></p>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          {expired && <p role="alert" className="session-notice">A tua sessão expirou. Entra novamente para continuar.</p>}
          {!recovery && <label>Email<input name="email" type="email" autoComplete="email" required disabled={busy} /></label>}
          {!reset && <label>Palavra-passe<input name="password" type="password" autoComplete={signUp || recovery ? 'new-password' : 'current-password'} minLength={signUp || recovery ? 8 : undefined} required disabled={busy} /></label>}
          {(signUp || recovery) && <label>Confirmar palavra-passe<input name="confirmPassword" type="password" autoComplete="new-password" minLength={8} required disabled={busy} /></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          {message && <p role="status">{message}</p>}
          <button className="btn btn--solid" disabled={busy} type="submit">{busy ? 'A aguardar…' : recovery ? 'Guardar palavra-passe' : reset ? 'Enviar ligação' : title}</button>
        </form>
      )}
      {!recovery && <p className="switch">{signUp || reset ? <>Já tens conta? <a href={paths.signIn}>Entrar</a></> : <>Ainda não tens conta? <a href={paths.signUp}>Criar conta</a></>}</p>}
      {!reset && !recovery && <a href={`${paths.signIn}?modo=recuperar`}>Esqueci-me da palavra-passe</a>}
    </Placeholder>
  );
}
