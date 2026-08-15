import { getTelegramUser } from './telegramSdk';

/**
 * Custom fetch wrapper that automatically attaches Telegram or Web user authentication headers
 * to all backend API requests, ensuring every web visitor & telegram user is tracked as a real user.
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
      username: tgUser.username || `tg_${tgUser.id}`,
      photo_url: tgUser.photo_url || ''
    }));
  } else {
    // Generate or retrieve persistent unique Web App Visitor ID
    let webUserId = localStorage.getItem('rubychan_web_user_id');
    let webUserName = localStorage.getItem('rubychan_web_user_name');
    if (!webUserId) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      webUserId = `web_usr_${Date.now().toString(36)}_${randomSuffix}`;
      webUserName = `Web Visitor #${randomSuffix}`;
      localStorage.setItem('rubychan_web_user_id', webUserId);
      localStorage.setItem('rubychan_web_user_name', webUserName);
    }

    headers.set('x-telegram-user-id', webUserId);
    headers.set('x-telegram-user-info', JSON.stringify({
      id: webUserId,
      first_name: webUserName || 'Web Visitor',
      last_name: '(Web App)',
      username: webUserName || `Web_${webUserId.slice(-4)}`,
      photo_url: ''
    }));
  }

  return fetch(url, { ...options, headers });
}
