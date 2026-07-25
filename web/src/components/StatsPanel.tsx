import { useTranslation } from 'react-i18next';
import type { PetTutor, StatsWindow } from '../api/types';
import { tutorColor } from '../api/tutor-colors';

interface Props {
  stats: StatsWindow[];
  tutors: PetTutor[];
}

export function StatsPanel({ stats, tutors }: Props) {
  const { t } = useTranslation('pets');

  if (stats.length === 0) {
    return (
      <p className="form__hint" style={{ textAlign: 'left', margin: 0 }}>
        {t('stats.notEnoughData')}
      </p>
    );
  }

  return (
    <div className="stats">
      {stats.map((window) => (
        <div key={window.isTotal ? 'total' : window.windowSize} className="stats__block">
          <h3 className="stats__heading">
            {window.isTotal
              ? t('stats.totalRange')
              : t('stats.windowSize', { count: window.windowSize ?? 0 })}
          </h3>
          <div className="stats-bar">
            {window.counts.map((c) => {
              const widthPercent = (c.count / window.totalDays) * 100;
              const color = tutorColor(tutors, c.petTutorId);
              return (
                <div
                  key={c.petTutorId}
                  className="stats-bar__segment"
                  style={{ width: `${widthPercent}%`, backgroundColor: color }}
                  title={t('stats.tutorCount', { tutorName: c.tutorName, count: c.count })}
                >
                  {widthPercent >= 10 && <span>{c.count}</span>}
                </div>
              );
            })}
          </div>
          <ul className="stats-bar__legend">
            {window.counts.map((c) => (
              <li key={c.petTutorId} className="stats-bar__legend-item">
                <span
                  className="stats-bar__legend-dot"
                  style={{ backgroundColor: tutorColor(tutors, c.petTutorId) }}
                />
                {t('stats.tutorCountShort', { tutorName: c.tutorName, count: c.count })}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
