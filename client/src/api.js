const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }
  return data;
}

export const api = {
  register: (credentials) => request('/auth/register', { method: 'POST', body: credentials }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  profile: (token) => request('/profile', { token }),
  processArray: (token, payload) => request('/arrays/process', { method: 'POST', token, body: payload }),
  fetchArrays: (token, { page = 1, limit = 20 } = {}) =>
    request(`/arrays?page=${page}&limit=${limit}`, { token }),
  deleteArray: (token, id) => request(`/arrays/${id}`, { method: 'DELETE', token }),
};
