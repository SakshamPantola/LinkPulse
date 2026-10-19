
const TOKEN_KEY = 'linkpulse_token';
export const API_BASE = import.meta.env.VITE_API_URL || '';

export function getToken()  { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
export function clearToken() { localStorage.removeItem(TOKEN_KEY); }

export function getShortBaseUrl() {
  if (import.meta.env.VITE_SHORT_BASE_URL) return import.meta.env.VITE_SHORT_BASE_URL;
  if (import.meta.env.VITE_BASE_URL) return import.meta.env.VITE_BASE_URL;
  return import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin;
}

async function request(url, opts = {}) {
  const token = getToken();
  const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
  const headers = { 'Content-Type': 'application/json', ...opts.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(fullUrl, { ...opts, headers });
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.error || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

const api = {
  get:    (url)       => request(url),
  post:   (url, body) => request(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body) => request(url, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  (url, body) => request(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  delete: (url)       => request(url, { method: 'DELETE' }),
};

export default api;
