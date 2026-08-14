import { getTelegramUser } from './telegramSdk';

/**
 * Custom fetch wrapper that automatically attaches Telegram user authentication headers
 * to all backend API requests, ensuring strict user-level data isolation.
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const tgUser = getTelegramUser();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  if (tgUser && tgUser.id) {
    headers.set('x-telegram-user-id', String(tgUser.id));
    headers.set('x-telegram-user-info', JSON.stringify({
      id: tgUser.id,
      first_name: tgUser.first_name || '',
      last_name: tgUser.last_name || '',
      username: tgUser.username || '',
      photo_url: tgUser.photo_url || ''
    }));
  }

  return fetch(url, { ...options, headers });
}
