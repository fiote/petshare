import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from './ConfirmDialog';

interface LayoutProps {
  children: ReactNode;
  title: string;
  backTo?: string;
}

export function Layout({ children, title, backTo }: LayoutProps) {
  const { t } = useTranslation('common');
  const { isAuthenticated, logout, user } = useAuth();
  const [confirmingLogout, setConfirmingLogout] = useState(false);

  return (
    <div className="screen">
      <header className="app-header">
        {backTo ? (
          <Link to={backTo} className="app-header__back" aria-label={t('back')}>
            <ArrowLeft size={18} strokeWidth={2.25} />
          </Link>
        ) : (
          <Link to="/" className="app-header__brand">
            <span className="app-header__brand-icon">🐾</span>
          </Link>
        )}
        <h1 className="app-header__title">{title}</h1>
        {isAuthenticated && (
          <span className="app-header__actions">
            <Link to="/profile" className="app-header__logout" aria-label={t('myProfile')}>
              <User size={18} strokeWidth={2.25} />
            </Link>
            <button
              className="app-header__logout"
              onClick={() => setConfirmingLogout(true)}
              aria-label={t('logout')}
            >
              <LogOut size={18} strokeWidth={2.25} />
            </button>
          </span>
        )}
      </header>
      <main className="app-content">{children}</main>
      {isAuthenticated && user && (
        <p className="app-footer">
          <Trans i18nKey="common:loggedInAs" values={{ name: user.name }}>
            Logged in as <Link to="/profile">{user.name}</Link>
          </Trans>
        </p>
      )}

      <ConfirmDialog
        open={confirmingLogout}
        title={t('logoutConfirmTitle')}
        description={t('logoutConfirmDescription')}
        confirmLabel={t('logout')}
        cancelLabel={t('cancel')}
        onCancel={() => setConfirmingLogout(false)}
        onConfirm={() => {
          setConfirmingLogout(false);
          logout();
        }}
      />
    </div>
  );
}
