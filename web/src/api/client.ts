import i18n from '../locales/i18n';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const CSRF_COOKIE_NAME = 'petshare_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function ensureCsrfCookie(): Promise<string> {
  const existing = readCookie(CSRF_COOKIE_NAME);
  if (existing) {
    return existing;
  }
  await fetch(`${API_BASE_URL}/auth/csrf`, { credentials: 'include' });
  return readCookie(CSRF_COOKIE_NAME) ?? '';
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const SESSION_EXPIRED_EVENT = 'petshare:session-expired';

const SAFE_METHODS = new Set(['GET', 'HEAD']);

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; formData?: FormData } = {},
): Promise<T> {
  const method = options.method ?? 'GET';
  const isFormData = Boolean(options.formData);
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'Accept-Language': i18n.language,
  };

  if (!SAFE_METHODS.has(method)) {
    headers[CSRF_HEADER_NAME] = await ensureCsrfCookie();
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers,
    body: isFormData ? options.formData : options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    let message = `Erro ${response.status}`;
    try {
      const data = await response.json();
      message = Array.isArray(data.message) ? data.message.join(', ') : data.message ?? message;
    } catch {
      // resposta sem corpo JSON
    }
    if (response.status === 401) {
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  postForm: <T>(path: string, formData: FormData) =>
    request<T>(path, { method: 'POST', formData }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
