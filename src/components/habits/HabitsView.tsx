import React from 'react';
import { CalendarView } from '../calendar/CalendarView';

/** Las rutinas viven en el módulo unificado Calendario & Rutinas. */
export const HabitsView: React.FC = () => {
  return <CalendarView initialTab="rutinas" />;
};
