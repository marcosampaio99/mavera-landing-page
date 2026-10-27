import { useEffect, useReducer, useRef } from 'react';

const scopeFor = client => {
  const session = client.getAuthSnapshot?.().session;
  return `${client.config?.tenantId}:${session?.user.id}:${session?.access_token}`;
};
const active = status => status === 'PENDING' || status === 'CONFIRMED';

// The backend decides eligibility (canCancel) and quota restoration. The
// frontend never infers either: it only reports the Booking state it reads.
export function cancellationFailure(error) {
  const code = error?.code || '';
  if (error?.status === 401 || error?.kind === 'authentication' || code === 'AUTHENTICATION_REQUIRED') return { phase: 'expired', message: 'A sessão expirou. Volta a entrar para continuar.' };
  if (code === 'CUSTOMER_CANCELLATION_WINDOW_CLOSED' || error?.kind === 'cancellation-policy') return { phase: 'closed', message: 'O prazo para cancelar online terminou. Contacta o Leandro.' };
  if (error?.status === 404 || error?.kind === 'not-found') return { phase: 'closed', message: 'Esta reserva já não está disponível. Consulta os teus treinos.' };
  if (error?.kind === 'network' || error?.kind === 'aborted' || error?.status >= 500 || !error?.status) return { phase: 'uncertain', message: 'Não foi possível confirmar o cancelamento. Verifica a reserva antes de tentar de novo.' };
  return { phase: 'uncertain', message: 'Não foi possível cancelar o treino. Verifica a reserva antes de tentar de novo.' };
}

// One cancellation at a time per tenant/session. Records are keyed by Booking
// id, so the outcome survives the Booking moving from upcoming to history.
export function useBookingCancellation(client) {
  const records = useRef(new Map());
  const busy = useRef(false);
  const lifetime = useRef(null);
  const lastCancelled = useRef(null);
  const [, redraw] = useReducer(value => value + 1, 0);
  useEffect(() => {
    const controller = new AbortController(); lifetime.current = controller;
    records.current.clear(); busy.current = false; lastCancelled.current = null;
    const scope = scopeFor(client);
    const unsubscribe = client.subscribeAuth?.(() => { if (scopeFor(client) !== scope) controller.abort(); });
    return () => { unsubscribe?.(); controller.abort(); };
  }, [client]);
  const set = (id, record) => { records.current.set(id, record); redraw(); return record; };
  function ask(id) { if (!busy.current) set(id, { phase: 'confirming' }); }
  function dismiss(id) { if (!busy.current) { records.current.delete(id); redraw(); } }
  async function run(id, action, verifying = false) {
    if (busy.current) return records.current.get(id);
    const signal = lifetime.current.signal, scope = scopeFor(client);
    const current = () => !signal.aborted && scopeFor(client) === scope;
    if (!client.getAuthSnapshot?.().session) return set(id, cancellationFailure({ status: 401 }));
    busy.current = true; set(id, { phase: 'processing', verifying, message: '' });
    try {
      const booking = await action(signal);
      if (!current()) return;
      if (!booking || booking.id !== id) throw new Error('Invalid booking response');
      const record = booking.status === 'CANCELLED' ? { phase: 'cancelled', booking, message: 'Treino cancelado.' }
        : active(booking.status) ? { phase: 'idle', booking, message: 'O treino continua marcado. Podes tentar cancelar de novo.' }
        : { phase: 'closed', booking, message: 'Esta reserva já não está ativa. Consulta os teus treinos.' };
      // cancelBooking already invalidated bookings, Duos and entitlements and
      // reloaded the agenda; the explicit reads surface the current balance.
      const updated = await Promise.allSettled([client.refreshBookings(signal), client.refreshCustomerEntitlements(signal)]);
      const stale = updated.some(result => result.status === 'rejected');
      if (current() && stale) record.message += ' Não foi possível atualizar a agenda ou o saldo. Atualiza a página.';
      if (current() && record.phase === 'cancelled') lastCancelled.current = { id, booking, stale };
      return current() ? set(id, record) : undefined;
    } catch (error) {
      if (!current()) return;
      const failure = cancellationFailure(error);
      if (failure.phase === 'closed') await Promise.allSettled([client.refreshBookings(signal)]);
      return current() ? set(id, failure) : undefined;
    } finally {
      if (current()) { busy.current = false; redraw(); }
    }
  }
  return {
    get: id => records.current.get(id),
    busy,
    lastCancelled: lastCancelled.current,
    ask,
    dismiss,
    cancel: id => run(id, signal => client.cancelBooking(id, signal)),
    // An uncertain outcome is resolved by a read, never by a second cancel.
    verify: id => run(id, signal => client.getBooking(id, signal), true),
  };
}
