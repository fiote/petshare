import { get, set } from 'idb-keyval';
import { api } from './client';
import { toIntlLocale } from '../locales/i18n';
import i18n from '../locales/i18n';

interface CacheEntry<T> {
  data: T;
  fetchedAt: string;
}

function cacheKey(path: string): string {
  return `petshare:cache:${path}`;
}

async function getCached<T>(path: string): Promise<CacheEntry<T> | undefined> {
  return get(cacheKey(path));
}

async function setCached<T>(path: string, data: T): Promise<void> {
  const entry: CacheEntry<T> = { data, fetchedAt: new Date().toISOString() };
  await set(cacheKey(path), entry);
}

function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError;
}

export interface CachedResult<T> {
  data: T;
  fromCache: boolean;
  fetchedAt: string;
}

export function formatRelativeTime(isoDate: string): string {
  const diffMs = new Date(isoDate).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat(toIntlLocale(i18n.language), { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute');
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour');
  }
  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, 'day');
}

export async function fetchWithCache<T>(path: string): Promise<CachedResult<T>> {
  try {
    const data = await api.get<T>(path);
    await setCached(path, data);
    return { data, fromCache: false, fetchedAt: new Date().toISOString() };
  } catch (err) {
    if (!isNetworkError(err)) {
      throw err;
    }
    const cached = await getCached<T>(path);
    if (!cached) {
      throw err;
    }
    return { data: cached.data, fromCache: true, fetchedAt: cached.fetchedAt };
  }
}
