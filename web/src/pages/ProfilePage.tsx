import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../api/client';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import type { AuthUser } from '../api/types';

export function ProfilePage() {
  const { t, i18n } = useTranslation('profile');
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      const updated = await api.patch<AuthUser>('/users/me', { name });
      updateUser(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title={t('title')} backTo="/">
      <section className="card">
        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            <span>{t('name')}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </label>
          <label className="field">
            <span>{t('email')}</span>
            <input value={user?.email ?? ''} disabled />
          </label>
          <label className="field">
            <span>{t('language')}</span>
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en">{t('languageEnglish')}</option>
              <option value="pt-BR">{t('languagePortuguese')}</option>
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          {success && <p className="form__hint">{t('success')}</p>}
          <button
            className="btn btn--primary"
            type="submit"
            disabled={loading || name.trim().length < 2}
          >
            {loading ? t('saving', { ns: 'common' }) : t('save', { ns: 'common' })}
          </button>
        </form>
      </section>
    </Layout>
  );
}
