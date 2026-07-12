import { useCallback, useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('auth-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('auth-change', callback);
  };
}

function getSnapshot() {
  return localStorage.getItem('token');
}

export function useAuth() {
  const token = useSyncExternalStore(subscribe, getSnapshot);

  const setToken = useCallback((value: string) => {
    localStorage.setItem('token', value);
    window.dispatchEvent(new Event('auth-change'));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-change'));
  }, []);

  return { isAuthenticated: !!token, setToken, logout };
}
