import React, { useEffect, useRef } from 'react';
import { useCustomerBookings, useMaveraClient } from '@marcosampaio99/mavera-client/react';
import { BookingList, bookingDate, bookingTime } from './Bookings';
import { useBookingCancellation } from './bookingCancellation';
import { AppointmentPlanner } from './appointments/AppointmentPlanner';
import { AgendaContext } from './appointments/AppointmentCalendar';

export function AccountDashboard({ customer }) {
  const client = useMaveraClient();
  const { upcomingBookings, historyBookings = [], isLoading, error, refresh } = useCustomerBookings();
  const cancellation = useBookingCancellation(client);
  const done = cancellation.lastCancelled;
  const notice = useRef(null);
  // The cancelled row leaves the agenda; keep focus on its confirmation.
  useEffect(() => { if (done) notice.current?.focus(); }, [done]);
  return <>
    <AgendaContext.Provider value={isLoading || error ? [] : upcomingBookings}><AppointmentPlanner /></AgendaContext.Provider>
    <section id="proximos-treinos" className="account-section upcoming-trainings" aria-labelledby="upcoming-title" tabIndex={-1}>
      <h2 id="upcoming-title">Próximos treinos</h2>
      {done && <p ref={notice} tabIndex={-1} role="status" className="cancel-notice">
        Treino de {bookingDate(done.booking.startAt)} às {bookingTime(done.booking.startAt)} cancelado.{done.stale ? ' Não foi possível atualizar a agenda ou o saldo. Atualiza a página.' : ''}
      </p>}
      {isLoading ? <div className="summary-skeleton" role="status" aria-label="A carregar os próximos treinos"><span className="skeleton skeleton--value" /><span className="skeleton skeleton--line" /></div>
        : error ? <div><p>Não foi possível carregar os treinos.</p><button className="text-button" onClick={() => refresh().catch(() => {})}>Tentar outra vez</button></div>
        : upcomingBookings.length ? <BookingList bookings={upcomingBookings} selfName={customer?.name} cancellation={cancellation} />
        : <div className="upcoming-empty"><p className="summary-empty">Sem treino marcado</p><a className="text-button" href="#marcar-treino">Marcar treino</a></div>}
    </section>
    {!isLoading && !error && historyBookings.length > 0 && <details className="account-secondary">
      <summary><h2 id="training-history-title">Histórico de treinos</h2></summary>
      <BookingList bookings={historyBookings} selfName={customer?.name} />
    </details>}
  </>;
}
