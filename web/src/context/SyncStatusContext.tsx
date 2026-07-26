import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  listPending,
  processQueue,
  SYNC_QUEUE_CHANGED_EVENT,
  SYNC_MUTATION_DISCARDED_EVENT,
} from '../api/sync-queue';

interface SyncStatusValue {
  isOnline: boolean;
  pendingCount: number;
  sessionExpiredDuringSync: boolean;
  dismissSessionExpiredNotice: () => void;
}

const SyncStatusContext = createContext<SyncStatusValue | null>(null);

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [sessionExpiredDuringSync, setSessionExpiredDuringSync] = useState(false);

  const refreshPendingCount = useCallback(async () => {
    const queue = await listPending();
    setPendingCount(queue.length);
  }, []);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleQueueChanged = () => refreshPendingCount();
    window.addEventListener(SYNC_QUEUE_CHANGED_EVENT, handleQueueChanged);
    return () => window.removeEventListener(SYNC_QUEUE_CHANGED_EVENT, handleQueueChanged);
  }, [refreshPendingCount]);

  useEffect(() => {
    const handleDiscarded = () => setSessionExpiredDuringSync(true);
    window.addEventListener(SYNC_MUTATION_DISCARDED_EVENT, handleDiscarded);
    return () => window.removeEventListener(SYNC_MUTATION_DISCARDED_EVENT, handleDiscarded);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline]);

  const dismissSessionExpiredNotice = useCallback(() => setSessionExpiredDuringSync(false), []);

  return (
    <SyncStatusContext.Provider
      value={{ isOnline, pendingCount, sessionExpiredDuringSync, dismissSessionExpiredNotice }}
    >
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncStatus(): SyncStatusValue {
  const ctx = useContext(SyncStatusContext);
  if (!ctx) {
    throw new Error('useSyncStatus deve ser usado dentro de SyncStatusProvider');
  }
  return ctx;
}
