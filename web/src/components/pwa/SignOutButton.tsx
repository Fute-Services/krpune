/**
 * The only way left to end a session by hand.
 *
 * Sign out used to live inside the offline panel in the bottom-right corner.
 * That panel is gone, and losing the control with it would have left the
 * 20-minute expiry as the only way off a shared device — so it moved here
 * rather than quietly disappearing.
 *
 * Home only, and deliberately small: this is a staff action taken between
 * visitors, not something a visitor should find halfway through a brochure. The
 * home screen is where the kiosk gets reset, the left corner is clear there
 * (the guide owns the right one), and every other screen shows nothing at all.
 */
import { useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';

export default function SignOutButton() {
  const { pathname } = useLocation();
  const { session } = useAuth();

  if (pathname !== '/' || !session) return null;

  return (
    <button
      onClick={signOut}
      aria-label="Sign out"
      title={session.email}
      className="
        fixed bottom-5 left-[6.5rem] z-[1850]
        flex items-center gap-1.5 h-8 px-3 rounded-full
        bg-black/25 hover:bg-black/45 backdrop-blur-md border border-white/10
        text-white/50 hover:text-white/90 text-[11px] font-medium
        transition-colors
      "
    >
      <LogOut size={12} />
      Sign out
    </button>
  );
}
