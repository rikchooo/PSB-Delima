export function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}
export function setAuthSession({ token, user, mode = 'public' }) {
  if (typeof window === 'undefined') return;

  if (token) {
    localStorage.setItem('auth_token', token);
  }

  localStorage.setItem('isLoggedIn', 'true');

  if (mode === 'private') {
    localStorage.removeItem('user');
    localStorage.removeItem('registration_status');
    localStorage.removeItem('payment_status');
    localStorage.setItem('private_session', JSON.stringify(user));
    localStorage.setItem('private_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('private_session');
    localStorage.removeItem('private_user');
    localStorage.setItem('user', JSON.stringify(user));
  }

  window.dispatchEvent(new Event('login'));
}
export function clearAuthSession({ mode = 'all' } = {}) {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('auth_token');
  localStorage.removeItem('isLoggedIn');

  if (mode === 'public' || mode === 'all') {
    localStorage.removeItem('user');
    localStorage.removeItem('registration_status');
    localStorage.removeItem('payment_status');
  }

  if (mode === 'private' || mode === 'all') {
    localStorage.removeItem('private_session');
    localStorage.removeItem('private_user');
  }

  window.dispatchEvent(new Event('logout'));
}

export function getPrivateSession() {
  if (typeof window === 'undefined') return null;
  try {
    const session = localStorage.getItem('private_session');
    return session ? JSON.parse(session) : null;
  } catch {
    return null;
  }
}
