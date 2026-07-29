import { useSyncExternalStore } from 'react';
import { getSession, onAuthChange, type Session } from '@/lib/auth';

/**
 * useSyncExternalStore rather than useState+useEffect: it reads the session
 * during render, so a route guard never renders one frame of "logged out"
 * before an effect corrects it (which would bounce the user to /login on every
 * refresh).
 */
export function useAuth(): { session: Session | null; isAuthenticated: boolean } {
  const session = useSyncExternalStore(onAuthChange, getSession, () => null);
  return { session, isAuthenticated: session !== null };
}
