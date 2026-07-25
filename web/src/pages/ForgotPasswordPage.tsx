import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../api/client';
import { AuthShell } from '../components/AuthShell';

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<{ message: string }>('/auth/forgot-password', { email });
      setMessage(res.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('forgotPassword.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title={t('forgotPassword.title')}>
      <form className="form" onSubmit={handleSubmit}>
        <p className="form__hint">{t('forgotPassword.instructions')}</p>
        <label className="field">
          <span>{t('forgotPassword.email')}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button className="btn btn--primary" type="submit" disabled={loading}>
          {loading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
        </button>
        <p className="form__hint">
          <Link to="/login">{t('forgotPassword.backToLogin')}</Link>
        </p>
      </form>
    </AuthShell>
  );
}
