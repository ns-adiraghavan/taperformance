'use client';
import { SessionUser } from './types';

const STORAGE_KEY = 'ta-dashboard-session';

const DEMO_USERS: { email: string; password: string; user: SessionUser }[] = [
  {
    email: 'rima.ali@netscribes.com',
    password: 'Passw0rd',
    user: { email: 'rima.ali@netscribes.com', name: 'Rima Ali', role: 'hr_head' },
  },
];

export function login(email: string, password: string): SessionUser | null {
  const match = DEMO_USERS.find(
    (u) => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
  );
  if (!match) return null;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(match.user));
  } catch (_) {}
  return match.user;
}

export function logout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch (_) {
    return null;
  }
}

export function requireSession(): SessionUser | null {
  if (typeof window === 'undefined') return null;
  return getSession();
}
