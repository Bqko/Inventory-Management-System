// One helper for every request to the Express API.
// It adds the login token, turns errors into JavaScript errors,
// and sends the user back to /login if the token is no longer valid.
const API_URL = import.meta.env.VITE_API_URL || '';

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

export async function api(path, { method = 'GET', body } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;

  const res = await fetch(API_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/api/auth/login')) {
      clearToken();
      window.location.assign('/login');
    }
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    err.details = data.details;
    throw err;
  }
  return data;
}
