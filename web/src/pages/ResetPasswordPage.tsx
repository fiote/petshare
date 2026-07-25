import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../api/client';
import { AuthShell } from '../components/AuthShell';
import { PasswordInput } from '../components/PasswordInput';

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('resetPassword.passwordMismatch'));
      return;
    }

    if (!token) {
      setError(t('resetPassword.missingToken'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('resetPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthShell title={t('resetPassword.titleSubmitted')}>
        <p>{t('resetPassword.success')}</p>
        <Link className="link" to="/login">
          {t('register.goToLogin')}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('resetPassword.title')}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t('resetPassword.newPassword')}</span>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            showLabel={tCommon('showPassword')}
            hideLabel={tCommon('hidePassword')}
          />
        </label>
        <label className="field">
          <span>{t('resetPassword.confirmPassword')}</span>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            showLabel={tCommon('showPassword')}
            hideLabel={tCommon('hidePassword')}
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? t('resetPassword.saving') : t('resetPassword.submit')}
        </button>
        <p className="form__hint">
          <Link to="/login">{t('resendConfirmation.backToLogin')}</Link>
        </p>
      </form>
    </AuthShell>
  );
}
