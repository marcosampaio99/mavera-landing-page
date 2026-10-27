// @vitest-environment jsdom
import React, { useState } from 'react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AgendaContext, AppointmentCalendar, bookedDays, dateLabel } from './AppointmentCalendar';

const zone = 'Europe/Lisbon';
const booking = (id, startAt, status = 'CONFIRMED') => ({ id, startAt, status });
beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-24T08:00:00Z')); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
function Calendar({ bookings, initial = '' }) {
  const [selected, setSelected] = useState(initial);
  return <AgendaContext.Provider value={bookings}><AppointmentCalendar timezone={zone} selected={selected} onSelect={setSelected} /></AgendaContext.Provider>;
}
const day = date => screen.getByRole('button', { name: new RegExp(`^${dateLabel(date)}`) });

it('agrupa reservas ativas pelo dia local da API, sem duplicar nem contar canceladas', () => {
  const days = bookedDays([
    booking('a', '2026-10-28T09:00:00Z'), booking('a', '2026-10-28T09:00:00Z'), booking('b', '2026-10-28T18:00:00Z', 'PENDING'),
    booking('c', '2026-10-24T23:30:00Z'), booking('d', '2026-10-29T09:00:00Z', 'CANCELLED'), booking('e', 'invalid'),
  ], zone);
  expect(Object.fromEntries(days)).toEqual({ '2026-10-28': 2, '2026-10-25': 1 });
});
it('marca discretamente os dias com treino e indica-o no nome acessível', () => {
  render(<Calendar bookings={[booking('a', '2026-10-28T09:00:00Z'), booking('b', '2026-10-28T18:00:00Z'), booking('c', '2026-10-30T09:00:00Z')]} />);
  expect(day('2026-10-28').getAttribute('aria-label')).toBe(`${dateLabel('2026-10-28')}, 2 treinos marcados`);
  expect(day('2026-10-30').getAttribute('aria-label')).toBe(`${dateLabel('2026-10-30')}, 1 treino marcado`);
  expect(day('2026-10-29').getAttribute('aria-label')).toBe(dateLabel('2026-10-29'));
  expect(day('2026-10-28').querySelectorAll('.calendar-booked-dot')).toHaveLength(1);
  expect(document.querySelectorAll('.calendar-days .calendar-booked-dot')).toHaveLength(2);
  expect(screen.getByText('Dia com treino marcado')).toBeTruthy();
});
it('distingue o dia selecionado do indicador de reserva', () => {
  render(<Calendar bookings={[booking('a', '2026-10-28T09:00:00Z')]} />);
  fireEvent.click(day('2026-10-28'));
  expect(day('2026-10-28').getAttribute('aria-pressed')).toBe('true');
  expect(day('2026-10-28').classList.contains('calendar-day--booked')).toBe(true);
  fireEvent.click(day('2026-10-27'));
  expect(day('2026-10-28').getAttribute('aria-pressed')).toBe('false');
  expect(day('2026-10-28').querySelector('.calendar-booked-dot')).toBeTruthy();
  expect(day('2026-10-27').querySelector('.calendar-booked-dot')).toBeNull();
});
it('mantém marcadores ao navegar entre meses e o foco por teclado', () => {
  render(<Calendar bookings={[booking('a', '2026-11-03T09:00:00Z')]} />);
  expect(document.querySelector('.calendar-booked-dot')).toBeNull();
  expect(screen.queryByText('Dia com treino marcado')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Mês seguinte' }));
  expect(screen.getByRole('heading', { level: 3 }).textContent).toBe('novembro de 2026');
  expect(day('2026-11-03').getAttribute('aria-label')).toContain('1 treino marcado');
  day('2026-11-03').focus();
  fireEvent.keyDown(day('2026-11-03'), { key: 'ArrowRight' });
  expect(document.activeElement).toBe(day('2026-11-04'));
  fireEvent.keyDown(day('2026-11-04'), { key: 'ArrowLeft' });
  expect(document.activeElement).toBe(day('2026-11-03'));
  expect(day('2026-11-03').getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: 'Mês anterior' }));
  expect(document.querySelector('.calendar-booked-dot')).toBeNull();
});
it('sem reservas carregadas não apresenta indicadores', () => {
  render(<AppointmentCalendar timezone={zone} selected="" onSelect={() => {}} />);
  expect(document.querySelector('.calendar-booked-dot')).toBeNull();
});
