// JWT is kept in localStorage (24h lifetime, issued by the API).
const KEY = 'sfsh.token';

export function getToken() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // Storage unavailable (private mode); the session just won't persist.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
