import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../api/client';
import { AuthShell } from '../components/AuthShell';
import { PasswordInput } from '../components/PasswordInput';

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('inviteToken') ?? undefined;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('register.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { name, email, password, inviteToken });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('register.error'));
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <AuthShell title={t('register.titleSubmitted')}>
        <p>{t('register.success')}</p>
        <Link className="link" to="/login">
          {t('register.goToLogin')}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('register.titleForm')}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t('register.name')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
        </label>
        <label className="field">
          <span>{t('register.email')}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>{t('register.password')}</span>
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
          <span>{t('register.confirmPassword')}</span>
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
          {loading ? t('register.sending') : t('register.submit')}
        </button>
        <p className="form__hint">
          {t('register.haveAccount')}<Link to="/login">{t('register.logIn')}</Link>
        </p>
      </form>
    </AuthShell>
  );
}
