import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Props {
  title: string;
  children: ReactNode;
}

export function AuthShell({ title, children }: Props) {
  const { t } = useTranslation('auth');

  return (
    <div className="auth-screen">
      <div className="auth-brand">
        <span className="auth-brand__icon">🐾</span>
        <h1 className="auth-brand__name">PetShare</h1>
        <p className="auth-brand__tagline">{t('login.tagline')}</p>
      </div>

      <section className="auth-card">
        <h2 className="auth-card__title">{title}</h2>
        {children}
      </section>
    </div>
  );
}
