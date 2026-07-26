import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../api/client';
import { fetchWithCache, formatRelativeTime } from '../api/offline-cache';
import type { Pet, PetTutor } from '../api/types';
import { Layout } from '../components/Layout';
import { speciesEmoji, speciesLabel } from '../api/species';
import { CreatePetForm } from '../components/CreatePetForm';

export function HomePage() {
  const { t } = useTranslation('pets');
  const [pets, setPets] = useState<Pet[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PetTutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [petsResult, invitesResult] = await Promise.all([
        fetchWithCache<Pet[]>('/pets'),
        fetchWithCache<PetTutor[]>('/invitations/pending'),
      ]);
      setPets(petsResult.data);
      setPendingInvites(invitesResult.data);
      setCachedAt(petsResult.fromCache ? petsResult.fetchedAt : null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('home.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptInvite = async (invitationId: string) => {
    try {
      await api.post(`/invitations/by-id/${invitationId}/accept`);
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('home.acceptError'));
    }
  };

  const handlePetCreated = async () => {
    setShowCreateForm(false);
    await loadData();
  };

  const hasPets = pets.length > 0;

  return (
    <Layout title={t('home.title')}>
      <section className="card card--hero">
        <h2 className="section-title" style={{ color: 'white' }}>
          {t('home.heroTitle')}
        </h2>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '0.88rem' }}>
          {t('home.heroSubtitle')}
        </p>
      </section>

      {pendingInvites.length > 0 && (
        <section className="card">
          <h2 className="section-title">{t('home.pendingInvites')}</h2>
          <ul className="list">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="list__item">
                <span>{invite.pet?.name ?? t('home.unnamedPet')}</span>
                <button className="btn btn--small" onClick={() => handleAcceptInvite(invite.id)}>
                  {t('home.accept')}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {error && <p className="error">{error}</p>}
      {cachedAt && (
        <p className="form__hint">
          {t('home.cachedDataNotice', { time: formatRelativeTime(cachedAt) })}
        </p>
      )}

      {!loading && !hasPets && (
        <section className="card">
          <h2 className="section-title">{t('home.createPet')}</h2>
          <CreatePetForm onCreated={handlePetCreated} />
        </section>
      )}

      {hasPets && (
        <section>
          <h2 className="section-title">{t('home.yourPets')}</h2>
          <ul className="list">
            {pets.map((pet) => (
              <li key={pet.id}>
                <Link
                  className={`pet-card ${pet.photoUrl ? 'pet-card--photo' : ''}`}
                  to={`/pets/${pet.id}`}
                  style={
                    pet.photoUrl
                      ? {
                          backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.55), rgba(0,0,0,0.15)), url(${pet.photoUrl})`,
                        }
                      : undefined
                  }
                >
                  <span className="pet-card__body">
                    {!pet.photoUrl && (
                      <span className="pet-card__avatar">{speciesEmoji(pet.species)}</span>
                    )}
                    <span>
                      <span className="pet-card__name">{pet.name}</span>
                      {pet.species && (
                        <span className="pet-card__species">{speciesLabel(pet.species, t)}</span>
                      )}
                    </span>
                  </span>
                  <ChevronRight className="pet-card__chevron" size={20} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hasPets && (
        <button
          type="button"
          className="fab"
          onClick={() => setShowCreateForm(true)}
          aria-label={t('home.createPet')}
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      )}

      {showCreateForm && (
        <div className="dialog-overlay" onMouseDown={() => setShowCreateForm(false)}>
          <div className="dialog" onMouseDown={(e) => e.stopPropagation()}>
            <div className="dialog__header">
              <h2 className="dialog__title">{t('home.createPet')}</h2>
              <button
                type="button"
                className="add-tutor__close"
                onClick={() => setShowCreateForm(false)}
                aria-label={t('home.close')}
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </div>
            <CreatePetForm onCreated={handlePetCreated} />
          </div>
        </div>
      )}
    </Layout>
  );
}
