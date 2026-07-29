import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/**
 * Gate for every route except /login.
 *
 * `replace` matters: without it the guarded URL stays in history, so Back from
 * /login bounces the user straight back through the guard again.
 *
 * The attempted location is stashed in `state.from` so LoginPage can send the
 * user to where they were actually going — deep links into /#/vr or
 * /#/unitplan/12 survive the redirect.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
