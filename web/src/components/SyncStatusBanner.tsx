import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useSyncStatus } from '../context/SyncStatusContext';

export function SyncStatusBanner() {
  const { t } = useTranslation('common');
  const { isOnline, pendingCount, sessionExpiredDuringSync, dismissSessionExpiredNotice } =
    useSyncStatus();

  if (sessionExpiredDuringSync) {
    return (
      <div className="sync-banner sync-banner--error">
        <span>{t('sync.sessionExpired')}</span>
        <button
          type="button"
          className="sync-banner__dismiss"
          onClick={dismissSessionExpiredNotice}
          aria-label={t('sync.dismiss')}
        >
          <X size={14} strokeWidth={2.25} />
        </button>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="sync-banner">
        <span>
          {pendingCount > 0
            ? t('sync.offlinePending', { count: pendingCount })
            : t('sync.offline')}
        </span>
      </div>
    );
  }

  if (pendingCount > 0) {
    return (
      <div className="sync-banner sync-banner--syncing">
        <span>{t('sync.syncing', { count: pendingCount })}</span>
      </div>
    );
  }

  return null;
}
