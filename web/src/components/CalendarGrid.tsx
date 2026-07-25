import { useTranslation } from 'react-i18next';
import type { CalendarEntry, PetTutor } from '../api/types';
import { formatDateOnly, todayDateOnly } from '../api/dates';
import { tutorColor } from '../api/tutor-colors';

function buildGridDays(focusMonth: Date): string[] {
  const monthStart = new Date(focusMonth.getFullYear(), focusMonth.getMonth(), 1);
  const monthEnd = new Date(focusMonth.getFullYear(), focusMonth.getMonth() + 1, 0);

  // Uma linha (semana) inteira antes e depois do mês, alinhada a domingo-sábado.
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - 7 - monthStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + 7 + (6 - monthEnd.getDay()));

  const days: string[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    days.push(formatDateOnly(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

interface Props {
  focusMonth: Date;
  entries: CalendarEntry[];
  tutors: PetTutor[];
  onToggleDay: (date: string, currentTutorId: string | null) => void;
}

export function CalendarGrid({ focusMonth, entries, tutors, onToggleDay }: Props) {
  const { t } = useTranslation('pets');
  const days = buildGridDays(focusMonth);
  const entryByDate = new Map(entries.map((e) => [e.date, e]));
  const todayStr = todayDateOnly();
  const focusMonthKey = `${focusMonth.getFullYear()}-${focusMonth.getMonth()}`;
  const weekdayInitials = [
    t('calendar.weekday.sun'),
    t('calendar.weekday.mon'),
    t('calendar.weekday.tue'),
    t('calendar.weekday.wed'),
    t('calendar.weekday.thu'),
    t('calendar.weekday.fri'),
    t('calendar.weekday.sat'),
  ];

  return (
    <div>
      <div className="calendar-grid">
        {weekdayInitials.map((label, i) => (
          <div key={`h-${i}`} className="calendar-grid__weekday">
            {label}
          </div>
        ))}
        {days.map((day) => {
          const [year, month] = day.split('-').map(Number);
          const isOutsideMonth = `${year}-${month - 1}` !== focusMonthKey;
          const entry = entryByDate.get(day);
          const color = tutorColor(tutors, entry?.petTutorId ?? null);
          const isToday = day === todayStr;
          const isFuture = day > todayStr;
          const dayNumber = Number(day.slice(-2));
          const style: React.CSSProperties | undefined = color
            ? isFuture
              ? {
                  backgroundImage: `repeating-linear-gradient(135deg, ${color}, ${color} 6px, ${color}cc 6px, ${color}cc 12px)`,
                  border: `1px solid ${color}`,
                  color: '#fff',
                }
              : { backgroundColor: color, color: '#fff' }
            : undefined;
          const tutorLabel = entry?.petTutor?.displayLabel;
          const tutorInitial = tutorLabel ? tutorLabel.trim().charAt(0).toUpperCase() : null;
          return (
            <button
              key={day}
              className={`calendar-day ${isToday ? 'calendar-day--today' : ''} ${
                isFuture ? 'calendar-day--future' : 'calendar-day--past'
              } ${isOutsideMonth ? 'calendar-day--outside' : ''}`}
              style={style}
              onClick={() => onToggleDay(day, entry?.petTutorId ?? null)}
              title={
                entry
                  ? t('calendar.custody', { tutorLabel: tutorLabel ?? '' })
                  : t('calendar.noCustody')
              }
            >
              {dayNumber}
              {tutorInitial && <span className="calendar-day__badge">{tutorInitial}</span>}
            </button>
          );
        })}
      </div>
      <ul className="calendar-legend">
        {tutors.map((tutor) => (
          <li key={tutor.id} className="calendar-legend__item">
            <span
              className="calendar-legend__dot"
              style={{ backgroundColor: tutorColor(tutors, tutor.id) }}
            />
            {tutor.displayLabel}
          </li>
        ))}
      </ul>
      <p className="form__hint">{t('calendar.hint')}</p>
    </div>
  );
}
