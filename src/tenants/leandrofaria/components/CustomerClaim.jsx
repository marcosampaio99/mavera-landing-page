import React, { useEffect, useRef, useState } from 'react';
import { useMaveraClient } from '@marcosampaio99/mavera-client/react';
import { authError } from '../auth';

export function CustomerClaim({ auth, claim }) {
  const client = useMaveraClient();
  const [completed, setCompleted] = useState(false);
  const [mode, setMode] = useState('email');
  const [options, setOptions] = useState(null);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const active = useRef(true);
  const busy = useRef(false);
  const controller = useRef(null);
  useEffect(() => {
    active.current = true;
    controller.current = new AbortController();
    return () => { active.current = false; controller.current.abort(); };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  const expired = challenge && now >= Date.parse(challenge.expiresAt);
  async function run(action) {
    if (busy.current) return;
    busy.current = true; setPending(true); setFailure(''); setMessage('');
    try { await action(controller.current.signal); }
    catch (error) {
      if (!active.current) return;
      if (error?.code === 'CUSTOMER_PHONE_REQUIRED_FOR_CLAIM') {
        setMessage('Escolhe uma das opções para continuar.'); setMode('choose');
      } else {
        setFailure(authError(error));
        if (error?.code === 'PHONE_CLAIM_RATE_LIMITED') { setRetryAt(Date.now() + 60000); setNow(Date.now()); }
        if (['PHONE_CLAIM_DISABLED', 'PHONE_CLAIM_UNAVAILABLE'].includes(error?.code)) { setOptions(null); setChallenge(null); setCode(''); }
      }
    } finally { if (active.current) { busy.current = false; setPending(false); } }
  }
  function existing() {
    setMode('existing'); setOptions(null); setChallenge(null); setCode('');
    run(async signal => {
      const result = await client.getClaimOptions(signal);
      if (active.current) setOptions(result);
    });
  }
  async function start(signal) {
    if (!options?.phoneClaimAvailable || Date.now() < retryAt) return;
    // Even an uncertain network outcome must not trigger an immediate second SMS.
    setRetryAt(Date.now() + 60000); setNow(Date.now());
    const result = await client.startPhoneClaim({ phone: phone.trim() }, signal);
    if (!active.current) return;
    setChallenge(result); setCode(''); setNow(Date.now());
    setRetryAt(Date.now() + result.resendAfterSeconds * 1000);
    setMessage('Se for possível associar o perfil, receberás um código por SMS.');
  }
  return <section className="account-section profile-link" aria-busy={pending}>
    <h2>Associar perfil</h2>
    <p className="secondary">Se já usaste este email nas tuas marcações, confirma a associação. O email tem de estar verificado.</p>
    {!completed && <div className="auth-form">
      <button type="button" className="btn btn--solid" disabled={pending} onClick={() => run(signal => claim({}, signal))}>Associar pelo email</button>
      <button type="button" className="btn btn--outline" disabled={pending} onClick={existing}>Já sou cliente</button>
      <button type="button" className="btn btn--outline" disabled={pending} onClick={() => { setMode('new'); setFailure(''); setMessage(''); setChallenge(null); setCode(''); }}>Sou novo cliente</button>
    </div>}
    {completed && <button type="button" className="btn btn--solid" disabled={pending} onClick={() => run(signal => client.refreshCustomer(signal))}>Atualizar perfil</button>}
    {!completed && mode === 'existing' && <>
      {pending && !options ? <p role="status">A consultar opções de associação…</p> : null}
      {!pending && !options?.phoneClaimAvailable && <p role="status">A associação por SMS está indisponível. Podes associar pelo email ou contactar o Leandro.</p>}
      {options?.phoneClaimAvailable && <>
        <form className="auth-form" onSubmit={event => { event.preventDefault(); run(start); }}>
          <label>Telemóvel<input type="tel" autoComplete="tel" required maxLength={64} value={phone} disabled={pending || !!challenge} onChange={event => setPhone(event.target.value)} /></label>
          {!challenge && <button className="btn btn--solid" disabled={pending || remaining > 0}>Pedir código{remaining > 0 ? ` (${remaining}s)` : ''}</button>}
        </form>
        {challenge && <>
          <form className="auth-form" onSubmit={event => {
            event.preventDefault();
            if (Date.now() >= Date.parse(challenge.expiresAt) || !/^\d{6}$/.test(code)) return;
            run(async signal => {
              const result = await client.confirmPhoneClaim({ claimId: challenge.claimId, code }, signal);
              if (!active.current) return;
              if (result.status !== 'COMPLETED') throw new Error('Unexpected confirmation');
              setCompleted(true); setCode(''); setChallenge(null); setMessage('Perfil associado. A atualizar os teus dados…');
              // confirmPhoneClaim invalidates shared SDK stores; refresh reads the actual Customer.
              await client.refreshCustomer(signal);
            });
          }}>
            <label>Código de 6 dígitos<input type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} disabled={pending || expired} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} /></label>
            {expired && <p role="alert">O código expirou. Pede um novo código ou contacta o Leandro.</p>}
            <button className="btn btn--solid" disabled={pending || expired || code.length !== 6}>Confirmar código</button>
          </form>
          <button type="button" className="text-button" disabled={pending || remaining > 0} onClick={() => run(start)}>{remaining > 0 ? `Reenviar em ${remaining}s` : 'Reenviar código'}</button>
          <button type="button" className="text-button" disabled={pending} onClick={() => { setChallenge(null); setCode(''); setMessage(''); }}>Alterar telemóvel</button>
        </>}
      </>}
    </>}
    {!completed && mode === 'new' && <form className="auth-form" onSubmit={event => {
      event.preventDefault(); const data = new FormData(event.currentTarget);
      run(signal => claim({ name: String(data.get('name')).trim(), phone: String(data.get('phone')).trim() }, signal));
    }}>
      <label>Nome<input name="name" autoComplete="name" required minLength={2} maxLength={100} defaultValue={auth.account?.name || ''} disabled={pending} /></label>
      <label>Telemóvel<input name="phone" type="tel" autoComplete="tel" required maxLength={64} disabled={pending} /></label>
      <button className="btn btn--solid" disabled={pending}>Criar perfil de cliente</button>
    </form>}
    {pending && <p role="status">A processar…</p>}
    {message && <p role="status">{message}</p>}
    {failure && <p className="form-error" role="alert">{failure}</p>}
  </section>;
}
