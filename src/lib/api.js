import { API_URL } from './config';
import { getAuthToken, clearAuthSession } from './auth';

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Permintaan timeout. Periksa koneksi internet atau coba lagi.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
export async function apiFetch(path, options = {}) {
  const url = `${API_URL}${path}`;
  const token = getAuthToken();

  const response = await fetchWithTimeout(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    const currentPath = window.location.pathname;
    const isPrivatePath = currentPath.includes('/PrivateWeb');
    const isLoginPage =
      currentPath.includes('/PrivateWeb/login') || currentPath.includes('/PublicWeb/login');

    if (!isLoginPage) {
      clearAuthSession({ mode: isPrivatePath ? 'private' : 'public' });
      window.location.href = isPrivatePath ? '/PrivateWeb/login' : '/PublicWeb/login';
      throw new Error('Sesi berakhir. Silakan login kembali.');
    }
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    const looksLikeJson = text.trim().startsWith('{') || text.trim().startsWith('[');
    if (!looksLikeJson) {
      console.error('Non-JSON response from', url, ':', text.substring(0, 200));
      throw new Error(`Server mengembalikan respons non-JSON (status: ${response.status}). Pastikan backend berjalan dengan benar.`);
    }
  }

  return response;
}
