import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/AuthShell';
import { PasswordInput } from '../components/PasswordInput';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { t: tCommon } = useTranslation('common');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('login.title')}>
      <form className="form" onSubmit={handleSubmit}>
        <label className="field">
          <span>{t('login.email')}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>{t('login.password')}</span>
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            showLabel={tCommon('showPassword')}
            hideLabel={tCommon('hidePassword')}
          />
        </label>
        <p className="form__hint" style={{ textAlign: 'right', margin: 0 }}>
          <Link to="/forgot-password">{t('login.forgotPassword')}</Link>
        </p>
        {error && <p className="error">{error}</p>}
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? t('login.loggingIn') : t('login.submit')}
        </button>
        <p className="form__hint">
          {t('login.noAccount')}<Link to="/register">{t('login.signUp')}</Link>
        </p>
        <p className="form__hint">
          {t('login.didntReceiveEmail')}
          <Link to="/resend-confirmation">{t('login.resendConfirmation')}</Link>
        </p>
      </form>
    </AuthShell>
  );
}
