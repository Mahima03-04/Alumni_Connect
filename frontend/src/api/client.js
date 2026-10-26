import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * A single axios instance for the whole app.
 * `withCredentials` is required so the httpOnly auth cookie is sent, and the
 * request interceptor copies the readable CSRF cookie into the x-csrf-token
 * header for every state-changing request.
 */
const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

export const CSRF_COOKIE = 'ac_csrf';
export const CSRF_HEADER = 'x-csrf-token';

export function readCsrfToken() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function fetchCsrfToken() {
  const res = await api.get('/auth/csrf');
  return res.data?.data?.csrfToken || null;
}

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const token = readCsrfToken();
    if (token) config.headers[CSRF_HEADER] = token;
  }
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (!response) {
      error.friendlyMessage =
        'Unable to reach the server. Please check your connection and make sure the backend is running.';
      return Promise.reject(error);
    }

    // If the CSRF token expired, fetch a new one and retry once.
    if (response.status === 403 && response.data?.code === 'CSRF_INVALID' && !config.__csrfRetried) {
      config.__csrfRetried = true;
      try {
        refreshing = refreshing || fetchCsrfToken();
        await refreshing;
        refreshing = null;
        return api(config);
      } catch (retryError) {
        refreshing = null;
        return Promise.reject(retryError);
      }
    }

    error.friendlyMessage =
      response.data?.message || `Request failed with status ${response.status}.`;
    return Promise.reject(error);
  }
);

export default api;
