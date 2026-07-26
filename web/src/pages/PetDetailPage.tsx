import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { api, ApiError } from '../api/client';
import { fetchWithCache, formatRelativeTime } from '../api/offline-cache';
import { enqueue, SYNC_QUEUE_CHANGED_EVENT } from '../api/sync-queue';
import { formatDateOnly, todayDateOnly } from '../api/dates';
import { tutorColor } from '../api/tutor-colors';
import type { CalendarEntry, Pet, PetTutor, StatsWindow } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { CalendarGrid } from '../components/CalendarGrid';
import { StatsPanel } from '../components/StatsPanel';
import { AddTutorMenu } from '../components/AddTutorMenu';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { speciesEmoji } from '../api/species';
import { toIntlLocale } from '../locales/i18n';

export function PetDetailPage() {
  const { t, i18n } = useTranslation('pets');
  const { petId } = useParams<{ petId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pet, setPet] = useState<Pet | null>(null);
  const [tutors, setTutors] = useState<PetTutor[]>([]);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [stats, setStats] = useState<StatsWindow[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [activeTutorId, setActiveTutorId] = useState<string | null>(null);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { rangeFrom, rangeTo, monthLabel, focusMonth } = useMemo(() => {
    const base = new Date();
    base.setDate(1);
    base.setMonth(base.getMonth() + monthOffset);
    const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
    const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);

    // Busca com folga de 2 semanas para cobrir a grade estendida exibida no CalendarGrid,
    // que mostra uma linha extra antes/depois do mês alinhada a domingo-sábado.
    const from = new Date(monthStart);
    from.setDate(from.getDate() - 14);
    const to = new Date(monthEnd);
    to.setDate(to.getDate() + 14);

    return {
      rangeFrom: formatDateOnly(from),
      rangeTo: formatDateOnly(to),
      monthLabel: base.toLocaleDateString(toIntlLocale(i18n.language), {
        month: 'long',
        year: 'numeric',
      }),
      focusMonth: monthStart,
    };
  }, [monthOffset, i18n.language]);

  const loadAll = useCallback(async () => {
    if (!petId) return;
    try {
      const [tutorsResult, entriesResult, statsResult] = await Promise.all([
        fetchWithCache<PetTutor[]>(`/pets/${petId}/tutors`),
        fetchWithCache<CalendarEntry[]>(`/pets/${petId}/calendar?from=${rangeFrom}&to=${rangeTo}`),
        fetchWithCache<StatsWindow[]>(`/pets/${petId}/calendar/stats?today=${todayDateOnly()}`),
      ]);
      const tutorsData = tutorsResult.data;
      setTutors(tutorsData);
      setEntries(entriesResult.data);
      setStats(statsResult.data);
      setCachedAt(tutorsResult.fromCache ? tutorsResult.fetchedAt : null);
      setActiveTutorId((current) => {
        if (current && tutorsData.some((t) => t.id === current)) return current;
        const mine = tutorsData.find((t) => t.userId === user?.id);
        return mine?.id ?? tutorsData[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('detail.loadError'));
    }
  }, [petId, rangeFrom, rangeTo, user?.id, t]);

  const loadPet = useCallback(async () => {
    if (!petId) return;
    try {
      const petsResult = await fetchWithCache<Pet[]>('/pets');
      setPet(petsResult.data.find((p) => p.id === petId) ?? null);
    } catch {
      // ignora falha isolada de recarregar o pet; loadAll cobre o erro geral
    }
  }, [petId]);

  useEffect(() => {
    loadPet();
  }, [loadPet]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    const handleQueueChanged = () => {
      if (navigator.onLine) {
        loadAll();
      }
    };
    window.addEventListener(SYNC_QUEUE_CHANGED_EVENT, handleQueueChanged);
    return () => window.removeEventListener(SYNC_QUEUE_CHANGED_EVENT, handleQueueChanged);
  }, [loadAll]);

  const queueDayToggleOffline = async (
    date: string,
    isRemoving: boolean,
    tutorId: string,
  ) => {
    if (isRemoving) {
      await enqueue({ method: 'DELETE', path: `/pets/${petId}/calendar/days/${date}` });
      setEntries((current) => current.filter((e) => e.date !== date));
    } else {
      await enqueue({
        method: 'POST',
        path: `/pets/${petId}/calendar/days`,
        body: { date, petTutorId: tutorId },
      });
      const activeTutor = tutors.find((tut) => tut.id === tutorId) ?? null;
      setEntries((current) => [
        ...current.filter((e) => e.date !== date),
        {
          id: `optimistic-${date}`,
          petId: petId as string,
          petTutorId: tutorId,
          date,
          petTutor: activeTutor ?? undefined,
        },
      ]);
    }
  };

  const handleToggleDay = async (date: string, currentTutorId: string | null) => {
    if (!petId || !activeTutorId) return;
    setError(null);

    const isRemoving = currentTutorId === activeTutorId;

    if (!navigator.onLine) {
      await queueDayToggleOffline(date, isRemoving, activeTutorId);
      return;
    }

    try {
      if (isRemoving) {
        await api.delete(`/pets/${petId}/calendar/days/${date}`);
      } else {
        await api.post(`/pets/${petId}/calendar/days`, { date, petTutorId: activeTutorId });
      }
      await loadAll();
    } catch (err) {
      if (err instanceof TypeError) {
        // Falha de rede detectada só na tentativa (ex: navigator.onLine desatualizado): enfileira do mesmo jeito.
        await queueDayToggleOffline(date, isRemoving, activeTutorId);
        return;
      }
      setError(err instanceof ApiError ? err.message : t('detail.dayUpdateError'));
    }
  };

  const handlePhotoSelected = async (file: File | null) => {
    if (!petId || !file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      await api.postForm(`/pets/${petId}/photo`, formData);
      await loadPet();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('detail.photoUploadError'));
    } finally {
      setUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleInvite = async (email: string) => {
    if (!petId) return;
    setError(null);
    try {
      await api.post(`/pets/${petId}/invitations`, { email });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('detail.inviteError'));
      throw err;
    }
  };

  const handleCreateManualTutor = async (name: string, email: string) => {
    if (!petId) return;
    setError(null);
    try {
      await api.post(`/pets/${petId}/manual-tutors`, { name, email: email || undefined });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('detail.createTutorError'));
      throw err;
    }
  };

  const handleDeletePet = async () => {
    if (!petId) return;
    setDeleting(true);
    setError(null);
    try {
      await api.delete(`/pets/${petId}`);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('detail.deleteError'));
      setDeleting(false);
      setConfirmingDelete(false);
    }
  };

  return (
    <Layout title={pet?.name ?? t('home.unnamedPet')} backTo="/">
      <section
        className="pet-banner"
        style={
          pet?.photoUrl
            ? { backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.5), rgba(0,0,0,0.05)), url(${pet.photoUrl})` }
            : undefined
        }
      >
        {!pet?.photoUrl && (
          <span className="pet-banner__placeholder">{speciesEmoji(pet?.species ?? null)}</span>
        )}
        <button
          type="button"
          className="pet-banner__edit"
          onClick={() => photoInputRef.current?.click()}
          disabled={uploadingPhoto}
          aria-label={t('detail.changingPhoto')}
        >
          <Camera size={16} strokeWidth={2.25} />
          {uploadingPhoto ? t('detail.uploadingPhoto') : t('detail.changePhoto')}
        </button>
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handlePhotoSelected(e.target.files?.[0] ?? null)}
        />
      </section>

      {error && <p className="error">{error}</p>}
      {cachedAt && (
        <p className="form__hint">
          {t('detail.cachedDataNotice', { time: formatRelativeTime(cachedAt) })}
        </p>
      )}

      <section className="card">
        <div className="section-header">
          <div>
            <h2 className="section-title" style={{ marginBottom: '0.2rem' }}>
              {t('detail.tutors')}
            </h2>
            <p className="form__hint" style={{ textAlign: 'left' }}>
              {t('detail.tutorsHint')}
            </p>
          </div>
          <AddTutorMenu onInvite={handleInvite} onCreateManual={handleCreateManualTutor} />
        </div>
        <ul className="list">
          {tutors.map((tutor) => {
            const color = tutorColor(tutors, tutor.id);
            const isActive = tutor.id === activeTutorId;
            return (
              <li key={tutor.id}>
                <button
                  type="button"
                  className={`tutor-row ${isActive ? 'tutor-row--active' : ''}`}
                  onClick={() => setActiveTutorId(tutor.id)}
                  style={
                    isActive && color
                      ? { borderColor: color, backgroundColor: `${color}22` }
                      : undefined
                  }
                >
                  <span className="tutor-row__label">
                    <span className="tutor-row__dot" style={{ backgroundColor: color }} />
                    {tutor.displayLabel}
                  </span>
                  <span className="tutor-row__badges">
                    {tutor.isManual && <span className="badge">{t('detail.manualBadge')}</span>}
                    {tutor.status === 'pending' && (
                      <span className="badge badge--pending">{t('detail.pendingInviteBadge')}</span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="card">
        <div className="calendar-nav">
          <button
            className="btn btn--icon"
            aria-label={t('detail.previousMonth')}
            onClick={() => setMonthOffset((m) => m - 1)}
          >
            <ChevronLeft size={18} strokeWidth={2.25} />
          </button>
          <span className="calendar-nav__label">{monthLabel}</span>
          <button
            className="btn btn--icon"
            aria-label={t('detail.nextMonth')}
            onClick={() => setMonthOffset((m) => m + 1)}
          >
            <ChevronRight size={18} strokeWidth={2.25} />
          </button>
        </div>
        <CalendarGrid
          focusMonth={focusMonth}
          entries={entries}
          tutors={tutors}
          onToggleDay={handleToggleDay}
        />
      </section>

      <section className="card">
        <h2 className="section-title">{t('detail.stats')}</h2>
        <StatsPanel stats={stats} tutors={tutors} />
      </section>

      <section className="card card--danger">
        <h2 className="section-title">{t('detail.dangerZone')}</h2>
        <p className="form__hint" style={{ textAlign: 'left', marginBottom: '0.85rem' }}>
          {t('detail.dangerZoneHint')}
        </p>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => setConfirmingDelete(true)}
        >
          <Trash2 size={16} strokeWidth={2.25} />
          {t('detail.deletePet')}
        </button>
      </section>

      <ConfirmDialog
        open={confirmingDelete}
        title={t('detail.confirmDeleteTitle', {
          petName: pet?.name ?? t('detail.confirmDeleteFallbackName'),
        })}
        description={t('detail.confirmDeleteDescription')}
        confirmLabel={deleting ? t('detail.deleting') : t('detail.confirmDeleteButton')}
        variant="danger"
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={handleDeletePet}
      />
    </Layout>
  );
}
