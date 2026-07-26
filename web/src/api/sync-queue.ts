import { get, set } from 'idb-keyval';
import { api, ApiError } from './client';

const QUEUE_KEY = 'petshare:sync-queue';

interface QueuedMutation {
  id: string;
  method: 'POST' | 'DELETE';
  path: string;
  body?: unknown;
  createdAt: string;
}

export const SYNC_QUEUE_CHANGED_EVENT = 'petshare:sync-queue-changed';
export const SYNC_MUTATION_DISCARDED_EVENT = 'petshare:sync-mutation-discarded';

function notifyQueueChanged(): void {
  window.dispatchEvent(new CustomEvent(SYNC_QUEUE_CHANGED_EVENT));
}

async function readQueue(): Promise<QueuedMutation[]> {
  return (await get<QueuedMutation[]>(QUEUE_KEY)) ?? [];
}

async function writeQueue(queue: QueuedMutation[]): Promise<void> {
  await set(QUEUE_KEY, queue);
  notifyQueueChanged();
}

export async function enqueue(mutation: Omit<QueuedMutation, 'id' | 'createdAt'>): Promise<void> {
  const queue = await readQueue();
  queue.push({
    ...mutation,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  });
  await writeQueue(queue);
}

export async function listPending(): Promise<QueuedMutation[]> {
  return readQueue();
}

let processing = false;

export async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    let queue = await readQueue();
    while (queue.length > 0) {
      const [next, ...rest] = queue;
      try {
        if (next.method === 'POST') {
          await api.post(next.path, next.body);
        } else {
          await api.delete(next.path);
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          window.dispatchEvent(
            new CustomEvent(SYNC_MUTATION_DISCARDED_EVENT, { detail: { mutation: next } }),
          );
          queue = rest;
          await writeQueue(queue);
          continue;
        }
        // Erro de rede ou de servidor: mantém a fila intacta e tenta de novo na próxima reconexão.
        return;
      }
      queue = rest;
      await writeQueue(queue);
    }
  } finally {
    processing = false;
  }
}
