import { useEffect, useReducer, useRef } from 'react';
import { dateInZone } from './AppointmentCalendar';

const uuid = value => typeof value === 'string' && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value);
const clock = value => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function confirmationAllowed(selection, service, query, slot, timezone) {
  if (!selection || !slot || !uuid(selection.customerEntitlementId) || !uuid(query.locationId) || !uuid(query.resourceId) || !uuid(service.id)) return false;
  if (service.schedulingMode !== 'APPOINTMENT' || service.bookingAccessPolicy !== 'ENTITLEMENT_REQUIRED' || service.paymentCollectionMode !== 'ONSITE' || !Number.isInteger(service.durationMinutes) || service.durationMinutes < 1) return false;
  if (selection.plan.status !== 'ACTIVE' || !clock(slot.start) || !clock(slot.end) || !slot.resourceIds?.includes(query.resourceId)) return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(query.date) || !Number.isFinite(Date.parse(`${query.date}T12:00:00Z`)) || new Date(`${query.date}T12:00:00Z`).toISOString().slice(0, 10) !== query.date) return false;
  if (selection.kind === 'INDIVIDUAL' && Array.isArray(selection.plan.eligibleServices) && !selection.plan.eligibleServices.some(item => item.id === service.id)) return false;
  if (selection.kind === 'DUO') {
    if (!uuid(selection.duoId) || selection.plan.coverageKind !== 'DUO' || selection.plan.duoId !== selection.duoId) return false;
  } else if (selection.kind !== 'INDIVIDUAL' || selection.duoId || selection.plan.duoId || (selection.plan.coverageKind && selection.plan.coverageKind !== 'INDIVIDUAL')) return false;
  const today = dateInZone(Date.now(), timezone);
  const now = new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date());
  return query.date > today || (query.date === today && slot.start > now);
}
export function commandFor(selection, service, query, slot) {
  return { locationId: query.locationId, resourceId: query.resourceId, serviceIds: [service.id], date: query.date, start: slot.start,
    customerEntitlementId: selection.customerEntitlementId, ...(selection.kind === 'DUO' ? { duoId: selection.duoId } : {}) };
}
const keyFor = input => JSON.stringify(input);
const scopeFor = client => {
  const session = client.getAuthSnapshot?.().session;
  return `${client.config.tenantId}:${session?.user.id}:${session?.access_token}`;
};
function matches(booking, input, timezone) {
  if (!['CONFIRMED', 'PENDING'].includes(booking.status) || booking.resource?.id !== input.resourceId || booking.location?.id !== input.locationId || (booking.duo?.id || undefined) !== input.duoId) return false;
  if (booking.services?.length !== input.serviceIds.length || !input.serviceIds.every(id => booking.services.some(service => service.id === id))) return false;
  const value = new Date(booking.startAt);
  if (!Number.isFinite(value.getTime())) return false;
  return dateInZone(value, timezone) === input.date && new Intl.DateTimeFormat('en-GB', { timeZone: timezone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(value) === input.start;
}
export function bookingFailure(error) {
  const code = error?.code || '';
  if (error?.status === 401 || error?.kind === 'authentication' || code === 'AUTHENTICATION_REQUIRED') return { phase: 'blocked', message: 'A sessão expirou. Volta a entrar para continuar.' };
  if (code === 'BOOKING_ENTITLEMENT_USAGE_EXHAUSTED') return { phase: 'blocked', message: 'Sem quota para esta data. Escolhe outro plano ou dia.' };
  if (['BOOKING_ENTITLEMENT_REQUIRED', 'BOOKING_ENTITLEMENT_NOT_AVAILABLE', 'CUSTOMER_PROFILE_NOT_LINKED'].includes(code)) return { phase: 'blocked', message: 'O plano não pode ser usado nesta data. Escolhe outro plano ou contacta o Leandro.' };
  if (code.startsWith('DUO_') || code === 'TENANT_DUO_APPOINTMENTS_DISABLED') return { phase: 'blocked', message: code === 'DUO_BOOKING_REQUEST_ID_REUSED' ? 'Este pedido já foi utilizado. Verifica os teus treinos antes de continuar.' : 'Não foi possível usar esta cobertura Duo. Contacta o Leandro.' };
  if (error?.status === 409 || error?.kind === 'conflict') return { phase: 'conflict', message: 'Este horário já não está disponível. Escolhe outro.' };
  if (error?.kind === 'network' || error?.kind === 'aborted' || error?.status >= 500 || !error?.status) return { phase: 'uncertain', message: 'Não foi possível confirmar o resultado. Verifica a reserva antes de continuar.' };
  return { phase: 'blocked', message: 'Não foi possível marcar o treino. Contacta o Leandro.' };
}

// Intent receipts belong to this tenant/session, above plan/date/slot components.
// Keep exact Duo commands on retries. Individual transport failures are read-only
// reconciliations: the current API explicitly rejects individual requestId.
export function useBookingCommands(client) {
  const records = useRef(new Map());
  const busy = useRef(false);
  const attempted = useRef(false);
  const lifetime = useRef(null);
  const [, redraw] = useReducer(value => value + 1, 0);
  useEffect(() => {
    const controller = new AbortController(); lifetime.current = controller;
    records.current.clear(); busy.current = false; attempted.current = false;
    const scope = scopeFor(client);
    const unsubscribe = client.subscribeAuth?.(() => { if (scopeFor(client) !== scope) controller.abort(); });
    return () => { unsubscribe?.(); controller.abort(); };
  }, [client]);
  const refresh = async signal => {
    // createCustomerAppointmentBooking already invalidates Duo/shared stores;
    // mounted SDK hooks reload them. Explicit SDK reads refresh the agenda/balance.
    return Promise.allSettled([client.refreshBookings(signal), client.refreshCustomerEntitlements(signal)]);
  };
  async function submit(input, timezone) {
    const key = keyFor(input);
    let record = records.current.get(key);
    if (busy.current || ['confirmed', 'pending-booking', 'blocked', 'conflict'].includes(record?.phase)) return record;
    const signal = lifetime.current.signal, scope = scopeFor(client);
    const current = () => !signal.aborted && scopeFor(client) === scope;
    if (!client.getAuthSnapshot?.().session) {
      record = { phase: 'blocked', message: 'A sessão expirou. Volta a entrar para continuar.' };
      records.current.set(key, record); redraw(); return record;
    }
    if (!record) {
      const command = { ...input, serviceIds: Object.freeze([...input.serviceIds]), ...(input.duoId ? { requestId: crypto.randomUUID() } : {}) };
      record = { command: Object.freeze(command), phase: 'idle', attempts: 0 };
      records.current.set(key, record);
    }
    busy.current = true; attempted.current = true;
    const previous = record.phase;
    record.phase = 'processing'; record.message = ''; redraw();
    try {
      let booking;
      if (record.receipt) {
        booking = await client.getBooking(record.receipt.id, signal);
      } else if (previous === 'uncertain' && !input.duoId) {
        const bookings = await client.getBookings('ALL', signal);
        if (!current()) return;
        const found = bookings.filter(item => matches(item, input, timezone));
        if (found.length === 1) booking = found[0];
        else {
          record.phase = 'uncertain';
          record.message = 'O resultado continua por confirmar. Verifica os próximos treinos ou contacta o Leandro. Não foi enviado outro pedido.';
          return record;
        }
      } else {
        record.attempts++;
        record.receipt = await client.createCustomerAppointmentBooking(record.command, signal);
        if (!current()) return;
        if (!record.receipt?.id) throw new Error('Invalid booking response');
        // Duo idempotent receipts preserve original status, including after a
        // cancellation. Read live state before displaying a confirmed booking.
        booking = await client.getBooking(record.receipt.id, signal);
      }
      if (!current()) return;
      if (!booking || !['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) throw new Error('Invalid booking state');
      record.booking = booking;
      record.phase = booking.status === 'CONFIRMED' ? 'confirmed' : booking.status === 'PENDING' ? 'pending-booking' : 'blocked';
      record.message = booking.status === 'CONFIRMED' ? 'Treino confirmado.' : booking.status === 'PENDING' ? 'Reserva pendente de confirmação. Não voltes a submeter.' : 'Esta reserva já não está ativa. Consulta os teus treinos.';
      const updated = await refresh(signal);
      if (current() && updated.some(result => result.status === 'rejected')) record.message += ' Não foi possível atualizar a agenda ou o saldo. Atualiza a página.';
      return record;
    } catch (error) {
      if (!current()) return;
      const failure = record.receipt && error?.status !== 401 && error?.kind !== 'authentication' ? { phase: 'uncertain', message: 'Reserva recebida. Não foi possível verificar o estado. Verifica a reserva.' } : bookingFailure(error);
      Object.assign(record, failure);
      if (failure.phase === 'blocked') {
        client.invalidateDuos();
        await refresh(signal);
      }
      return record;
    } finally {
      if (current()) { busy.current = false; redraw(); }
    }
  }
  return { submit, get: input => records.current.get(keyFor(input)), busy, attempted };
}
