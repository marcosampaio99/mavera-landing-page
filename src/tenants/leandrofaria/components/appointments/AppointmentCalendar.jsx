import React, { createContext, useContext, useMemo, useState } from 'react';

// Customer bookings already loaded by useCustomerBookings. The calendar only
// marks them; it never reads availability for other days.
export const AgendaContext = createContext([]);
export function bookedDays(bookings, timezone) {
  const days = new Map();
  for (const booking of new Map((bookings || []).map(item => [item.id, item])).values()) {
    if (!['PENDING', 'CONFIRMED'].includes(booking.status) || !Number.isFinite(Date.parse(booking.startAt))) continue;
    const day = dateInZone(booking.startAt, timezone);
    days.set(day, (days.get(day) || 0) + 1);
  }
  return days;
}

export function dateInZone(value, timezone) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(value));
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function dateLabel(date) {
  return new Intl.DateTimeFormat('pt-PT', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00Z`));
}
export function AppointmentCalendar({ timezone, selected, onSelect }) {
  const today = dateInZone(Date.now(), timezone);
  const bookings = useContext(AgendaContext);
  const booked = useMemo(() => bookedDays(bookings, timezone), [bookings, timezone]);
  const [month, setMonth] = useState(() => (selected || today).slice(0, 7));
  const [year, number] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const offset = (first.getUTCDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat('pt-PT', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(first);
  function move(delta) {
    const next = new Date(Date.UTC(year, number - 1 + delta, 1));
    setMonth(next.toISOString().slice(0, 7));
    onSelect('');
  }
  return <div className="appointment-calendar appointment-calendar--monthly" aria-label="Calendário de marcação">
    <div className="calendar-heading"><h3 aria-live="polite">{monthLabel}</h3>
      <div className="calendar-navigation" role="group" aria-label="Navegar entre meses">
        <button type="button" aria-label="Mês anterior" disabled={month <= today.slice(0, 7)} onClick={() => move(-1)}>‹</button>
        <button type="button" aria-label="Mês seguinte" onClick={() => move(1)}>›</button>
      </div>
    </div>
    <div className="calendar-days" role="group" aria-label={monthLabel} onKeyDown={event => {
      const day = Number(event.target.dataset.day);
      const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (!day || delta === undefined) return;
      event.preventDefault();
      const target = event.currentTarget.querySelector(`button[data-day="${day + delta}"]:not(:disabled)`);
      target?.focus();
    }}>
      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => <span className="calendar-weekday" key={day} aria-hidden="true">{day}</span>)}
      {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
      {Array.from({ length: count }, (_, index) => {
        const value = `${month}-${String(index + 1).padStart(2, '0')}`;
        const count = booked.get(value) || 0;
        const label = `${dateLabel(value)}${count ? `, ${count} ${count === 1 ? 'treino marcado' : 'treinos marcados'}` : ''}`;
        return <button type="button" key={value} data-day={index + 1} disabled={value < today} aria-label={label} aria-current={value === today ? 'date' : undefined} aria-pressed={selected === value} className={count ? 'calendar-day--booked' : undefined} onClick={() => onSelect(value)}>
          {index + 1}{count > 0 && <span className="calendar-booked-dot" aria-hidden="true" />}
        </button>;
      })}
    </div>
    {[...booked.keys()].some(value => value.startsWith(`${month}-`)) && <p className="calendar-legend"><span className="calendar-booked-dot" aria-hidden="true" /> Dia com treino marcado</p>}
    <span className="visually-hidden">Fuso horário: {timezone}</span>
  </div>;
}
export function TimeSlots({ slots, selected, onSelect }) {
  const [expanded, setExpanded] = useState({});
  if (!slots.length) return <p role="status">Sem horários disponíveis neste dia. Escolhe outra data.</p>;
  return <div className="appointment-slots">{[['Manhã', 0, 12], ['Tarde', 12, 18], ['Noite', 18, 24]].map(([label, min, max]) => {
    const group = slots.filter(slot => Number(slot.start.slice(0, 2)) >= min && Number(slot.start.slice(0, 2)) < max);
    if (!group.length) return null;
    return <fieldset key={label}><legend className="slot-period">{label}</legend><div className="slot-grid">{(expanded[label] ? group : group.slice(0, 6)).map(slot => <button type="button" key={`${slot.start}-${slot.end}`} aria-pressed={selected?.start === slot.start && selected?.end === slot.end} onClick={() => onSelect(slot)}>{slot.start}</button>)}</div>
      {!expanded[label] && group.length > 6 && <button type="button" className="text-button" onClick={() => setExpanded({ ...expanded, [label]: true })}>Ver mais horários de {label.toLowerCase()}</button>}</fieldset>;
  })}</div>;
}
