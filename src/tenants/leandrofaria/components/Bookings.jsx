import React, { useEffect, useRef } from 'react';
import { paths } from '../tenant';
export function bookingDate(value) {
  const parts = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'numeric', timeZone: 'Europe/Lisbon' }).formatToParts(new Date(value));
  const get = (type) => parts.find((part) => part.type === type).value;
  const weekdays = { Mon: 'Seg', Tue: 'Ter', Wed: 'Qua', Thu: 'Qui', Fri: 'Sex', Sat: 'Sáb', Sun: 'Dom' };
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${weekdays[get('weekday')]}, ${get('day')} ${months[Number(get('month')) - 1]}`;
}
export const bookingTime = (value) => new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Lisbon' }).format(new Date(value));
const moment = value => `${bookingDate(value)} às ${bookingTime(value)}`;

// Names come only from the Booking's participant snapshots. The partner is named
// only when exactly one snapshot differs from the Customer; otherwise list both.
export function duoPartner(booking, selfName) {
  const names = (booking.duo?.participants || []).map(participant => participant?.name).filter(Boolean);
  const others = names.filter(name => name !== selfName);
  return names.length === 2 && others.length === 1 ? others[0] : null;
}
export function duoLabel(booking, selfName) {
  if (!booking.duo) return null;
  const partner = duoPartner(booking, selfName);
  const names = (booking.duo.participants || []).map(participant => participant?.name).filter(Boolean);
  return partner ? `Duo com ${partner}` : names.length ? `Duo · ${names.join(' e ')}` : 'Duo';
}

function Cancellation({ booking, selfName, cancellation }) {
  const record = cancellation.get(booking.id);
  const policy = booking.cancellationPolicy;
  const deadline = policy?.cancellationDeadline && Number.isFinite(Date.parse(policy.cancellationDeadline)) ? policy.cancellationDeadline : null;
  const keep = useRef(null), trigger = useRef(null), confirming = record?.phase === 'confirming';
  const wasConfirming = useRef(false);
  useEffect(() => {
    if (confirming) keep.current?.focus();
    else if (wasConfirming.current && !record) trigger.current?.focus();
    wasConfirming.current = confirming;
  }, [confirming, record]);
  const busy = cancellation.busy.current;
  const message = record?.message && <p role={record.phase === 'idle' ? 'status' : 'alert'} className={record.phase === 'idle' ? 'secondary' : 'form-error'}>
    {record.message}{record.phase === 'expired' && <> <a href={paths.signIn}>Entrar novamente</a></>}
  </p>;
  if (record?.phase === 'processing') return <div className="booking-cancel"><p role="status" className="secondary">{record.verifying ? 'A verificar a reserva…' : 'A cancelar…'}</p></div>;
  if (record?.phase === 'uncertain') return <div className="booking-cancel">{message}
    <button type="button" className="text-button" disabled={busy} onClick={() => cancellation.verify(booking.id)}>Verificar reserva</button></div>;
  if (record && ['cancelled', 'closed', 'expired'].includes(record.phase)) return <div className="booking-cancel">{message}</div>;
  if (policy?.canCancel !== true) return deadline ? <div className="booking-cancel"><p className="secondary">Prazo de cancelamento online terminado. Contacta o Leandro.</p></div> : null;
  const partner = duoPartner(booking, selfName);
  const titleId = `cancel-${booking.id}`;
  return <div className="booking-cancel">
    {deadline && <p className="secondary">Podes cancelar até <time dateTime={deadline}>{moment(deadline)}</time></p>}
    {message}
    {confirming ? <div className="cancel-confirm" role="group" aria-labelledby={titleId}>
      <p id={titleId}><strong>Cancelar o treino de {moment(booking.startAt)}?</strong></p>
      {booking.duo && <p className="secondary">Treino Duo: o cancelamento aplica-se aos dois participantes{partner ? `, incluindo ${partner}` : ''}.</p>}
      <div className="cancel-actions">
        <button type="button" className="btn btn--solid" disabled={busy} onClick={() => cancellation.cancel(booking.id)}>Confirmar cancelamento</button>
        <button type="button" ref={keep} className="btn btn--outline" disabled={busy} onClick={() => cancellation.dismiss(booking.id)}>Manter treino</button>
      </div>
    </div> : <button type="button" ref={trigger} className="text-button" disabled={busy} onClick={() => cancellation.ask(booking.id)}>Cancelar treino</button>}
  </div>;
}

export function BookingList({ bookings, selfName, cancellation }) {
  return <ul className="booking-list">{bookings.map((booking) => <li key={booking.id} className="booking-row">
    <time dateTime={booking.startAt}>{bookingDate(booking.startAt)}<strong>{bookingTime(booking.startAt)}</strong></time>
    <div className="booking-details"><p>{booking.services.map((service) => service.name).join(', ')}</p>
      <p className="secondary">{booking.location.name}{({ PENDING: ' · Por confirmar', CANCELLED: ' · Cancelado', COMPLETED: ' · Concluído', NO_SHOW: ' · Falta' }[booking.status] || '')}</p>
      {booking.duo && <p className="secondary">{duoLabel(booking, selfName)}</p>}
      {cancellation && <Cancellation booking={booking} selfName={selfName} cancellation={cancellation} />}
    </div>
  </li>)}</ul>;
}

export function Bookings({ bookings, isLoading, error, title = 'Próximos treinos', headingId = 'bookings-title', selfName }) {
  if (isLoading || error || !bookings.length) return null;
  return <section className="account-section" aria-labelledby={headingId}>
    <h2 id={headingId}>{title}</h2>
    <BookingList bookings={bookings} selfName={selfName} />
  </section>;
}
