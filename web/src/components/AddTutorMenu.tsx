import { useEffect, useRef, useState } from 'react';
import { Mail, Plus, UserPlus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Mode = 'closed' | 'menu' | 'invite' | 'manual';

interface Props {
  onInvite: (email: string) => Promise<void>;
  onCreateManual: (name: string, email: string) => Promise<void>;
}

export function AddTutorMenu({ onInvite, onCreateManual }: Props) {
  const { t } = useTranslation('pets');
  const [mode, setMode] = useState<Mode>('closed');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualEmail, setManualEmail] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode !== 'menu') return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMode('closed');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mode]);

  const reset = () => {
    setMode('closed');
    setInviteEmail('');
    setManualName('');
    setManualEmail('');
    setMessage(null);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await onInvite(inviteEmail);
      setMessage(t('tutorMenu.inviteSent', { email: inviteEmail }));
      setInviteEmail('');
      setTimeout(reset, 1200);
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreateManual(manualName, manualEmail);
      reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-tutor" ref={containerRef}>
      {mode === 'closed' && (
        <button
          type="button"
          className="add-tutor__trigger"
          onClick={() => setMode('menu')}
          aria-label={t('tutorMenu.add')}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>
      )}

      {mode === 'menu' && (
        <div className="add-tutor__menu">
          <button
            type="button"
            className="add-tutor__option"
            onClick={() => setMode('invite')}
          >
            <Mail size={16} strokeWidth={2.25} />
            {t('tutorMenu.inviteByEmail')}
          </button>
          <button
            type="button"
            className="add-tutor__option"
            onClick={() => setMode('manual')}
          >
            <UserPlus size={16} strokeWidth={2.25} />
            {t('tutorMenu.createManually')}
          </button>
        </div>
      )}

      {mode === 'invite' && (
        <form className="add-tutor__form" onSubmit={handleInviteSubmit}>
          <div className="add-tutor__form-header">
            <span>{t('tutorMenu.inviteByEmail')}</span>
            <button type="button" className="add-tutor__close" onClick={reset} aria-label={t('tutorMenu.close')}>
              <X size={16} strokeWidth={2.25} />
            </button>
          </div>
          <input
            type="email"
            placeholder={t('tutorMenu.emailPlaceholder')}
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            autoFocus
          />
          <button className="btn btn--small" type="submit" disabled={submitting}>
            <Mail size={14} strokeWidth={2.25} />
            {submitting ? t('tutorMenu.sending') : t('tutorMenu.sendInvite')}
          </button>
          {message && <p className="success">{message}</p>}
        </form>
      )}

      {mode === 'manual' && (
        <form className="add-tutor__form" onSubmit={handleManualSubmit}>
          <div className="add-tutor__form-header">
            <span>{t('tutorMenu.createManuallyTitle')}</span>
            <button type="button" className="add-tutor__close" onClick={reset} aria-label={t('tutorMenu.close')}>
              <X size={16} strokeWidth={2.25} />
            </button>
          </div>
          <label className="field">
            <span>{t('tutorMenu.tutorNameLabel')}</span>
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder={t('tutorMenu.tutorNamePlaceholder')}
              required
              autoFocus
            />
          </label>
          <label className="field">
            <span>{t('tutorMenu.emailOptionalLabel')}</span>
            <input
              type="email"
              value={manualEmail}
              onChange={(e) => setManualEmail(e.target.value)}
            />
          </label>
          <button className="btn btn--small" type="submit" disabled={submitting}>
            <UserPlus size={14} strokeWidth={2.25} />
            {submitting ? t('tutorMenu.saving') : t('tutorMenu.addTutor')}
          </button>
        </form>
      )}
    </div>
  );
}
