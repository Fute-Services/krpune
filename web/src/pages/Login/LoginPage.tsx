import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate, Navigate, type Location } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, CircleAlert, LoaderCircle, ArrowRight } from 'lucide-react';
import { signIn } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/logo.png';

/**
 * Palette is taken from the app itself — deep navy (#05101f / #062442) with the
 * blue accents already used across the project (#3b82f6, #1C6CBC, #90C7FF).
 * No violet anywhere.
 */
const ACCENT = '#3b82f6';

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Where RequireAuth wanted to send us. Falls back to the home route.
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? '/';

  // Already signed in and someone opened /login directly → straight into the app.
  if (isAuthenticated) return <Navigate to={from === '/login' ? '/' : from} replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      // Auth is reactive, so the service worker and the media download have
      // already started by the time this navigation runs — no reload needed.
      navigate(from === '/login' ? '/' : from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
      setSubmitting(false);
    }
  }

  const fieldBase =
    'w-full h-12 pl-11 pr-11 rounded-xl bg-white/[0.04] border border-white/15 text-white ' +
    'placeholder-white/35 outline-none transition-all duration-200 ' +
    'focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/40 focus:bg-white/[0.07]';

  return (
    <div className="relative min-h-screen w-full flex bg-[#05101f] overflow-hidden">
      {/* ── Mobile: the hero becomes a faded background instead of a panel ── */}
      <div
        className="lg:hidden absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: 'url(/login-hero.jpg)' }}
        aria-hidden
      />
      <div
        className="lg:hidden absolute inset-0"
        style={{
          // Lighter at the top than the first attempt, which stacked a heavy
          // gradient on top of a 25% image and left the building invisible —
          // the photo may as well not have been there.
          background:
            'linear-gradient(180deg, rgba(5,16,31,0.45) 0%, rgba(5,16,31,0.82) 50%, rgba(5,16,31,0.96) 100%)',
        }}
        aria-hidden
      />

      {/* ── Left: full-height hero (desktop / landscape tablet only) ── */}
      <div className="hidden lg:block relative w-[55%] h-screen overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/login-hero.jpg)' }}
          initial={{ scale: 1.0 }}
          animate={{ scale: 1.09 }}
          transition={{ duration: 22, ease: 'easeOut' }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(120deg, rgba(5,16,31,0.86) 0%, rgba(6,36,66,0.55) 45%, rgba(10,59,106,0.15) 100%)',
          }}
        />
        {/* Feathered seam into the form side. The first version used a 160px
            linear ramp, which still left a visible vertical edge wherever the
            photo was bright (the sky, at the top). A wider ramp with an eased
            midpoint hides it. */}
        <div
          className="absolute inset-y-0 right-0 w-72"
          style={{
            background:
              'linear-gradient(90deg, rgba(5,16,31,0) 0%, rgba(5,16,31,0.35) 35%, rgba(5,16,31,0.82) 68%, #05101f 100%)',
          }}
        />

        {/* Scrim under the tagline. Without it the copy sits directly on the
            brightest part of the frame — the headlight trails — and the smaller
            line underneath becomes hard to read. */}
        <div
          className="absolute inset-x-0 bottom-0 h-[62%] pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(5,16,31,0) 0%, rgba(5,16,31,0.55) 45%, rgba(5,16,31,0.88) 100%)',
          }}
        />

        <div className="relative z-10 h-full flex flex-col justify-end p-14 xl:p-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          >
            <div className="h-px w-16 mb-7" style={{ background: ACCENT }} />
            <h1 className="text-white text-[2.6rem] xl:text-5xl font-light leading-[1.15] tracking-tight max-w-xl">
              A landmark address,
              <br />
              <span className="font-medium" style={{ color: '#90C7FF' }}>
                explored end to end.
              </span>
            </h1>
            <p className="mt-6 text-white/55 text-base max-w-md leading-relaxed">
              Virtual tour, amenities, floor plans and inventory — available on this device even
              with the network switched off.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ── Right: sign-in card ── */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
        <motion.div
          className="w-full max-w-[400px]"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          {/* Logo */}
          <motion.img
            src={logo}
            alt="KRC Pune"
            className="h-16 w-auto mb-9 select-none"
            draggable={false}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: 'easeOut' }}
          >
            <h2 className="text-white text-[1.75rem] font-medium tracking-tight">Sign in</h2>
            <p className="mt-2 text-white/45 text-sm">
              Enter your credentials to open the experience.
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="mt-8 space-y-4"
            noValidate
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.16, ease: 'easeOut' }}
          >
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-white/55 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={fieldBase}
                  disabled={submitting}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-white/55 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35 pointer-events-none"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={fieldBase}
                  disabled={submitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Inline error */}
            {error && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3.5 py-3"
              >
                <CircleAlert size={17} className="mt-px shrink-0 text-red-400" />
                <span className="text-sm text-red-200 leading-snug">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="
                group w-full h-12 mt-2 rounded-xl font-medium text-white
                flex items-center justify-center gap-2
                transition-all duration-200
                disabled:opacity-70 disabled:cursor-not-allowed
                hover:brightness-110 active:scale-[0.99]
                focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/50 focus:ring-offset-2 focus:ring-offset-[#05101f]
              "
              style={{ background: 'linear-gradient(135deg, #1C6CBC 0%, #3b82f6 100%)' }}
            >
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight
                    size={17}
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </motion.form>

          {/* Brand lockup */}
          <motion.div
            className="mt-10 pt-6 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/30">
              K Raheja Corp · Pune
            </p>
            <p className="mt-1.5 text-[11px] text-white/25">
              Authorised access only · Experience Centre
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
