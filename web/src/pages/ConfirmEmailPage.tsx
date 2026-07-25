import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../api/client';
import { AuthShell } from '../components/AuthShell';

export function ConfirmEmailPage() {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('confirmEmail.missingToken'));
      return;
    }
    api
      .post<{ message: string }>('/auth/confirm-email', { token })
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof ApiError ? err.message : t('confirmEmail.error'));
      });
  }, [token, t]);

  return (
    <AuthShell title={t('confirmEmail.title')}>
      {status === 'loading' && <p>{t('confirmEmail.confirming')}</p>}
      {status !== 'loading' && <p>{message}</p>}
      {status === 'success' && (
        <Link className="link" to="/login">
          {t('register.goToLogin')}
        </Link>
      )}
    </AuthShell>
  );
}
