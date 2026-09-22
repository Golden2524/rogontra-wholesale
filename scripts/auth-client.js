import { API_BASE_URL } from './config.js';

const TOKEN_KEY = 'rogontra-session-token';
const USER_KEY = 'rogontra-session-user';

export function getSession() {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const user = sessionStorage.getItem(USER_KEY);
  if (!token || !user) return undefined;
  try {
    return { token, user: JSON.parse(user) };
  } catch (_error) {
    clearSession();
    return undefined;
  }
}

export function saveSession({ token, user }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export async function authenticatedFetch(path, options = {}) {
  const session = getSession();
  if (!session) throw new Error('Please sign in to continue.');
  const headers = new Headers(options.headers);
  headers.set('Authorization', `Bearer ${session.token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (response.status === 401) clearSession();
  return response;
}
